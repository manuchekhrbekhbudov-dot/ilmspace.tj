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
let ctx = null;            // { db, dbFile } — пас аз startSync
let retryPending = false;  // пайвасти аввал нашуд — дар пасманзар боз кӯшиш мекунем
const state = { mode: 'local', lastSaved: null, lastError: null, bytes: 0, retrying: false };

export function persistStatus() { return { ...state, connection: connectionInfo() }; }

const clean = v => String(v ?? '').trim().replace(/^["'«]+|["'»]+$/g, '').trim();
const PLACEHOLDER = /\[YOUR[-_ ]PASSWORD\]/i;

/** Маълумоти ташхис бе сирр: парол аз куҷо гирифта мешавад ва кадом пайваст аст. */
export function connectionInfo(env = process.env) {
  const raw = clean(env.DATABASE_URL);
  if (!raw) return null;
  const pwSet = !!clean(env.DATABASE_PASSWORD);
  const { url } = databaseUrl(env);
  let host = '', port = '5432';
  try { const u = new URL(url.replace(/^postgres(ql)?:/i, 'http:')); host = u.hostname; port = u.port || '5432'; } catch {}
  return {
    passwordFrom: pwSet ? 'DATABASE_PASSWORD' : (PLACEHOLDER.test(raw) ? 'нест' : 'DATABASE_URL (пароли дохили силка)'),
    databasePasswordSet: pwSet,
    pooler: /pooler\.supabase\.com$/i.test(host) ? (port === '6543' ? 'transaction' : 'session') : (/supabase\.co$/i.test(host) ? 'direct' : 'other'),
    port,
  };
}

/** Силкаи пайвастро аз танзимот месозад. DATABASE_PASSWORD (агар бошад) ҳамеша истифода мешавад. */
export function databaseUrl(env = process.env) {
  const url = clean(env.DATABASE_URL);
  const pw = clean(env.DATABASE_PASSWORD);
  if (!url) return { url: '' };
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return { url, error: 'DATABASE_URL бояд бо postgresql:// оғоз шавад (силкаи база аз Supabase), на силкаи сайт.' };
  }
  const [, scheme, rest] = url.match(/^(postgres(?:ql)?:\/\/)(.*)$/i);
  const at = rest.lastIndexOf('@');
  if (at < 0) return { url };
  const userinfo = rest.slice(0, at), hostpart = rest.slice(at + 1);
  const colon = userinfo.indexOf(':');
  const user = colon < 0 ? userinfo : userinfo.slice(0, colon);
  let pass = colon < 0 ? '' : userinfo.slice(colon + 1);
  if (pw) pass = encodeURIComponent(pw);
  else if (PLACEHOLDER.test(pass)) return { url, error: 'Пароли база намерасад: дар Render тағйирёбандаи DATABASE_PASSWORD-ро бо пароли базаи Supabase илова кунед.' };
  else if (pass && !/%[0-9a-f]{2}/i.test(pass)) pass = encodeURIComponent(pass);
  return { url: scheme + user + (pass ? ':' + pass : '') + '@' + hostpart };
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
    retryPending = true;
    return false;
  }
}

function friendly(e) {
  const m = String(e?.message || e);
  if (/password authentication failed/i.test(m)) return clean(process.env.DATABASE_PASSWORD)
    ? 'Пароли DATABASE_PASSWORD бо пароли базаи Supabase мувофиқ нест. Дар Supabase «Reset database password» кунед ва ҳамон паролро дар DATABASE_PASSWORD гузоред.'
    : 'Пароли дохили DATABASE_URL нодуруст аст. Осонтар: дар Render тағйирёбандаи DATABASE_PASSWORD-ро бо пароли нави база илова кунед — силкаро иваз кардан лозим нест.';
  if (/ENOTFOUND|getaddrinfo/i.test(m)) return 'Суроғаи база ёфт нашуд. Силкаи «Session pooler»-ро аз Supabase нусха бардоред.';
  if (/ENETUNREACH|EHOSTUNREACH/i.test(m)) return 'Ба база роҳ нест. Дар Supabase «Session pooler»-ро интихоб кунед, на «Direct connection».';
  if (/timeout/i.test(m)) return 'База ҷавоб надод (вақт гузашт). Баъдтар боз кӯшиш мешавад.';
  if (/Tenant or user not found/i.test(m)) return 'Корбари база ёфт нашуд. Силкаро аз нав аз Supabase нусха бардоред.';
  return m;
}

/** Ҳар INTERVAL сония, агар тағйирот бошад, нусхаро ба Postgres мефиристад. */
export function startSync(db, dbFile) {
  ctx = { db, dbFile };
  if (client) return beginSync();
  if (retryPending) retryLoop();
}

// Ҳар дақиқа боз кӯшиш (масалан, пароли нав ҳанӯз дар Supabase паҳн нашудааст).
// Агар дар база аллакай нусха бошад, онро ҳеҷ гоҳ бо маълумоти муваққатӣ иваз намекунем.
function retryLoop() {
  state.retrying = true;
  const t = setInterval(async () => {
    let c;
    try {
      const { error } = databaseUrl(); if (error) { state.lastError = error; return; }
      c = await connect();
      let has = (await c.query('SELECT 1 FROM codelab.snapshot WHERE id=1')).rows.length > 0;
      if (!has) { try { has = (await c.query('SELECT 1 FROM public.codelab_snapshot WHERE id=1')).rows.length > 0; } catch {} }
      clearInterval(t); state.retrying = false;
      if (has) {
        await c.end();
        state.lastError = 'База пайваст шуд, вале маълумоти он ҳанӯз бор нашудааст. Дар Render «Manual Deploy → Restart service»-ро пахш кунед.';
        console.error('Postgres: ' + state.lastError);
        return;
      }
      client = c; state.mode = 'postgres'; state.lastError = null;
      console.log('Postgres: пас аз кӯшиши такрорӣ пайваст шуд — нигоҳдорӣ оғоз шуд.');
      beginSync();
    } catch (e) {
      state.lastError = friendly(e);
      try { await c?.end(); } catch {}
    }
  }, Number(process.env.RETRY_SECONDS || 60) * 1000);
  t.unref();
}

function beginSync() {
  const { db, dbFile } = ctx;
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
