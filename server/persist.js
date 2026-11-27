// Нигоҳдории доимии маълумот дар Postgres (масалан, Neon — ройгон).
// Барнома бо SQLite кор мекунад; нусхаи пурраи база ҳар чанд сония ба Postgres фиристода
// ва ҳангоми оғоз аз он барқарор мешавад. Барои як сервер (Render, VPS) мувофиқ аст.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const INTERVAL = Number(process.env.SNAPSHOT_SECONDS || 10) * 1000;
let client = null, state = { mode: 'local', lastSaved: null, lastError: null, bytes: 0 };

export function persistStatus() { return { ...state }; }

async function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const { default: pg } = await import('pg');
  const ssl = /localhost|127\.0\.0\.1|host=\/|@\/|\/tmp/.test(url) || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false };
  const c = new pg.Client({ connectionString: url, ssl });
  await c.connect();
  await c.query('CREATE TABLE IF NOT EXISTS codelab_snapshot (id INT PRIMARY KEY, data BYTEA NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  return c;
}

/** Пеш аз кушодани SQLite: агар дар Postgres нусха бошад, онро ба DB_FILE менависад. */
export async function restore(dbFile) {
  if (!process.env.DATABASE_URL) return false;
  try {
    client = await connect();
    state.mode = 'postgres';
    const r = await client.query('SELECT data, updated_at FROM codelab_snapshot WHERE id=1');
    if (!r.rows.length) { console.log('Postgres: нусха ҳанӯз нест — база аз нав сохта мешавад.'); return false; }
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    for (const ext of ['', '-wal', '-shm']) fs.rmSync(dbFile + ext, { force: true });
    const raw = r.rows[0].data;
    fs.writeFileSync(dbFile, raw[0] === 0x1f && raw[1] === 0x8b ? zlib.gunzipSync(raw) : raw);
    state.lastSaved = r.rows[0].updated_at; state.bytes = r.rows[0].data.length;
    console.log(`Postgres: база барқарор шуд (${Math.round(r.rows[0].data.length / 1024)} КБ, ${new Date(r.rows[0].updated_at).toISOString()}).`);
    return true;
  } catch (e) {
    state.lastError = e.message;
    console.error('Postgres: барқарор нашуд —', e.message);
    throw new Error('DATABASE_URL танзим шудааст, вале пайваст нашуд: ' + e.message);
  }
}

/** Ҳар INTERVAL сония, агар тағйирот бошад, нусхаро ба Postgres мефиристад. */
export function startSync(db, dbFile) {
  if (!client) return;
  let lastChanges = -1, busy = false;
  const tmp = dbFile + '.snapshot';
  async function save(force = false) {
    if (busy) return; busy = true;
    try {
      const n = db.prepare('SELECT total_changes() AS n').get().n;
      if (!force && n === lastChanges) return;
      fs.rmSync(tmp, { force: true });
      db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
      const data = zlib.gzipSync(fs.readFileSync(tmp), { level: 6 });
      await client.query('INSERT INTO codelab_snapshot (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()', [data]);
      lastChanges = n; state.lastSaved = new Date().toISOString(); state.bytes = data.length; state.lastError = null;
    } catch (e) {
      state.lastError = e.message; console.error('Postgres: нусха фиристода нашуд —', e.message);
      try { await client.end(); } catch {} try { client = await connect(); } catch {}
    } finally { fs.rmSync(tmp, { force: true }); busy = false; }
  }
  save(true);
  setInterval(save, INTERVAL).unref();
  const stop = async sig => { console.log(`${sig}: нусхаи охирин фиристода мешавад…`); busy = false; await save(true); process.exit(0); };
  process.once('SIGTERM', () => stop('SIGTERM'));
  process.once('SIGINT', () => stop('SIGINT'));
}
