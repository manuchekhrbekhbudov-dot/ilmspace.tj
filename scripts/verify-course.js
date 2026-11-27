// Курси нав: ҳалли C++-и ҳар масъала бо ҷавобҳои ҳалли мустақили Python (дар course.json) муқоиса мешавад.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { judgeAll } from '../server/judge.js';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const course = JSON.parse(fs.readFileSync(path.join(root, 'server/seed/course.json'), 'utf8'));
let bad = 0, n = 0;
const rows = [];
const queue = [...course.problems];
async function worker() {
  while (queue.length) {
    const p = queue.shift();
    const r = await judgeAll(p.solution, p.tests);
    n++;
    const ok = r.verdict === 'AC';
    if (!ok) { bad++; const f = (r.tests || []).find(t => t.status !== 'AC'); console.log(`✗ ${p.slug} ${p.title}: ${r.verdict}`, r.compile ? r.compile.slice(0, 400) : f ? JSON.stringify({ in: f.input.slice(0, 80), exp: f.expected.slice(0, 80), got: (f.actual || '').slice(0, 80) }) : r.detail); }
    rows.push({ slug: p.slug, title: p.title, tests: `${r.passed}/${r.total}`, ok });
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
rows.sort((a, b) => a.slug.localeCompare(b.slug, 'en', { numeric: true }));
fs.writeFileSync(path.join(root, 'docs/verification-course.md'), ['# Курси 4-ҳафтаина: санҷиши 220 масъала', '', `Сана: ${new Date().toISOString()} · Ҳалли C++ (g++) бо ҷавобҳои ҳалли мустақили Python муқоиса шуд.`, '',
  '| Масъала | Ном | Тестҳо | Натиҷа |', '|---|---|---|---|', ...rows.map(r => `| ${r.slug} | ${r.title} | ${r.tests} | ${r.ok ? 'OK' : 'ХАТО'} |`), ''].join('\n'));
console.log(`\n${n - bad}/${n} масъала мувофиқ`);
process.exit(bad ? 1 : 0);
