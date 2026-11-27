import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// .env-и оддӣ (калидҳо танҳо дар сервер мемонанд)
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const { createApp } = await import('./app.js');
const { judgeStatus } = await import('./judge.js');

const port = Number(process.env.PORT || 3000);
const { server } = createApp({
  dbFile: process.env.DB_FILE || path.join(root, 'data', 'codelab.db'),
  staticDir: path.join(root, 'web', 'public'),
});
server.listen(port, () => {
  const j = judgeStatus();
  console.log(`ILMSPACE CodeLab: http://localhost:${port}`);
  console.log(j.ok ? `Санҷандаи C++: ${j.driver}${j.url ? ' → ' + j.url : ''}` : `Санҷандаи C++ танзим нашудааст: ${j.reason}`);
  if (j.warning) console.log('ДИҚҚАТ: ' + j.warning);
});
