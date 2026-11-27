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
