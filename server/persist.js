// Нигоҳдории доимии маълумот дар Postgres (Supabase, Neon ё дигар).
// Барнома бо SQLite кор мекунад; нусхаи пурраи база ҳар чанд сония ба Postgres фиристода
// ва ҳангоми оғоз аз он барқарор мешавад. Барои як сервер (Render, VPS) мувофиқ аст.
//
// Танзим (ҳарду аз Supabase → Connect → Direct → Session pooler, бе таҳрир нусха бардошта мешаванд):
//   DATABASE_URL      = postgresql://postgres.xxxx:[YOUR-PASSWORD]@....pooler.supabase.com:5432/postgres
//   DATABASE_PASSWORD = пароли база (агар дар силка [YOUR-PASSWORD] монда бошад, барнома онро худаш иваз мекунад)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const INTERVAL = Number(process.env.SNAPSHOT_SECONDS || 10) * 1000;
let client = null;
const state = { mode: 'local', lastSaved: null, lastError: null, bytes: 0 };

export function persistStatus() { return { ...state }; }

/** Силкаи пайвастро аз танзимот месозад. Хатои маъмулиро бо забони фаҳмо мегӯяд. */
export function databaseUrl(env = process.env) {
  const clean = v => String(v ?? '').trim().replace(/^["'«]+|["'»]+$/g, '').trim();
  let url = clean(env.DATABASE_URL);
  const pw = clean(env.DATABASE_PASSWORD);
  if (!url) return { url: '' };
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return { url, error: 'DATABASE_URL бояд бо postgresql:// оғоз шавад (силкаи база аз Supabase), на силкаи сайт.' };
  }
  if (/\[YOUR[-_ ]PASSWORD\]/i.test(url)) {
    if (!pw) return { url, error: 'Дар DATABASE_URL ҳанӯз [YOUR-PASSWORD] ҳаст. Пароли базаро дар DATABASE_PASSWORD гузоред.' };
    url = url.replace(/\[YOUR[-_ ]PASSWORD\]/gi, encodeURIComponent(pw));
  }
  return { url };
}

async function connect() {
  const { url } = databaseUrl();
  const { default: pg } = await import('pg');
  const local = /localhost|127\.0\.0\.1|host=\/|@\/|\/tmp/.test(url) || /sslmode=disable/.test(url);
  const c = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000, query_timeout: 60000 });
  await c.connect();
  // Схемаи алоҳида: тавассути Data API-и Supabase дастрас нест
  await c.query('CREATE SCHEMA IF NOT EXISTS codelab');
  await c.query('CREATE TABLE IF NOT EXISTS codelab.snapshot (id INT PRIMARY KEY, data BYTEA NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  return c;
}

/** Пеш аз кушодани SQLite: агар дар Postgres нусха бошад, онро ба DB_FILE менависад. */
export async function restore(dbFile) {
  const { url, error } = databaseUrl();
  if (!url) return false;
  if (error) {
    state.mode = 'invalid'; state.lastError = error;
    console.error('ДИҚҚАТ: ' + error + ' Маълумот танҳо муваққатӣ нигоҳ дошта мешавад.');
    return false;
  }
  try {
    client = await connect();
    state.mode = 'postgres';
    let r = await client.query('SELECT data, updated_at FROM codelab.snapshot WHERE id=1');
    if (!r.rows.length) {
      // нусхаи версияи пешина (агар бошад)
      try { r = await client.query('SELECT data, updated_at FROM public.codelab_snapshot WHERE id=1'); } catch { r = { rows: [] }; }
    }
    if (!r.rows.length) { console.log('Postgres: пайваст шуд; нусха ҳанӯз нест — база аз нав сохта мешавад.'); return false; }
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    for (const ext of ['', '-wal', '-shm']) fs.rmSync(dbFile + ext, { force: true });
    const raw = r.rows[0].data;
    fs.writeFileSync(dbFile, raw[0] === 0x1f && raw[1] === 0x8b ? zlib.gunzipSync(raw) : raw);
    state.lastSaved = r.rows[0].updated_at; state.bytes = raw.length;
    console.log(`Postgres: база барқарор шуд (${Math.round(raw.length / 1024)} КБ, ${new Date(r.rows[0].updated_at).toISOString()}).`);
    return true;
  } catch (e) {
    state.lastError = friendly(e);
    console.error('Postgres: пайваст нашуд —', e.message, '— сайт бе нусхаи доимӣ кор мекунад.');
    state.mode = 'invalid';
    try { await client?.end(); } catch {}
    client = null;  // нусхаи кӯҳна дар Postgres дахл намешавад
    return false;
  }
}

function friendly(e) {
  const m = String(e?.message || e);
  if (/password authentication failed/i.test(m)) return 'Пароли база нодуруст аст (DATABASE_PASSWORD). Дар Supabase паролро нав кунед ва ҳамонро гузоред.';
  if (/ENOTFOUND|getaddrinfo/i.test(m)) return 'Суроғаи база ёфт нашуд. Силкаи «Session pooler»-ро аз Supabase нусха бардоред.';
  if (/ENETUNREACH|EHOSTUNREACH/i.test(m)) return 'Ба база роҳ нест. Дар Supabase «Session pooler»-ро интихоб кунед, на «Direct connection».';
  if (/timeout/i.test(m)) return 'База ҷавоб надод (вақт гузашт). Баъдтар боз кӯшиш мешавад.';
  if (/Tenant or user not found/i.test(m)) return 'Корбари база ёфт нашуд. Силкаро аз нав аз Supabase нусха бардоред.';
  return m;
}

/** Ҳар INTERVAL сония, агар тағйирот бошад, нусхаро ба Postgres мефиристад. */
export function startSync(db, dbFile) {
  if (!client) return;
  let lastChanges = -1;
  const tmp = dbFile + '.snapshot';
  async function doSave(force) {
    try {
      const n = db.prepare('SELECT total_changes() AS n').get().n;
      if (!force && n === lastChanges) return;
      fs.rmSync(tmp, { force: true });
      db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
      const data = zlib.gzipSync(fs.readFileSync(tmp), { level: 6 });
      if (!client) client = await connect();
      await client.query('INSERT INTO codelab.snapshot (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()', [data]);
      lastChanges = n; state.lastSaved = new Date().toISOString(); state.bytes = data.length; state.lastError = null; state.mode = 'postgres';
    } catch (e) {
      state.lastError = friendly(e); console.error('Postgres: нусха фиристода нашуд —', e.message);
      try { await client?.end(); } catch {}
      client = null; // дар навбати оянда аз нав пайваст мешавад
    } finally { fs.rmSync(tmp, { force: true }); }
  }
  // Ҳамаи нигоҳдориҳо пай дар пай (ду нусха ҳамзамон навишта намешаванд)
  let chain = Promise.resolve();
  const save = (force = false) => (chain = chain.then(() => doSave(force)));
  save(true);
  setInterval(() => save(), INTERVAL).unref();
  const stop = async sig => {
    console.log(`${sig}: нусхаи охирин фиристода мешавад…`);
    await Promise.race([save(true), new Promise(r => setTimeout(r, 20000))]);
    process.exit(0);
  };
  process.once('SIGTERM', () => stop('SIGTERM'));
  process.once('SIGINT', () => stop('SIGINT'));
}
