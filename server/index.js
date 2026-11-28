import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// .env-и оддӣ (калидҳо танҳо дар сервер мемонанд)
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  try { fs.chmodSync(envFile, 0o600); } catch {}
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const { createApp } = await import('./app.js');
const { restore, startSync, persistStatus } = await import('./persist.js');
const { judgeStatus, ensurePch } = await import('./judge.js');

const port = Number(process.env.PORT || 3000);
const dbFile = process.env.DB_FILE || path.join(root, 'data', 'codelab.db');
await restore(dbFile);
const { server, db } = createApp({
  dbFile,
  staticDir: path.join(root, 'web', 'public'),
});
startSync(db, dbFile);
ensurePch();  // дар пасманзар
server.listen(port, () => {
  const j = judgeStatus();
  console.log(`ILMSPACE CodeLab: http://localhost:${port}`);
  console.log(j.ok ? `Санҷандаи C++: ${j.driver}${j.url ? ' → ' + j.url : ''}` : `Санҷандаи C++ танзим нашудааст: ${j.reason}`);
  if (j.warning) console.log('ДИҚҚАТ: ' + j.warning);
  console.log(persistStatus().mode === 'postgres' ? 'Маълумот: SQLite + нусхаи доимӣ дар Postgres' : `Маълумот: SQLite (${dbFile})`);
});

// Render-и ройгон пас аз 15 дақиқаи бе боздид сайтро «хоб» мекунад ва кушодани аввал ~1 дақиқа тӯл мекашад.
// Дар соатҳои дарс (07:00–21:00, вақти Душанбе) сайт ҳар 10 дақиқа худашро мепурсад ва бедор мемонад.
// Хомӯш кардан: KEEPALIVE=0. Соатҳо: KEEPALIVE_HOURS=7-21.
const selfUrl = process.env.RENDER_EXTERNAL_URL;
if (selfUrl && process.env.KEEPALIVE !== '0') {
  const [from, to] = String(process.env.KEEPALIVE_HOURS || '7-21').split('-').map(Number);
  setInterval(() => {
    const h = (new Date().getUTCHours() + 5) % 24;   // Душанбе: UTC+5
    if (h >= from && h < to) fetch(selfUrl.replace(/\/$/, '') + '/api/health', { signal: AbortSignal.timeout(30000) }).catch(() => {});
  }, 10 * 60 * 1000).unref();
}
