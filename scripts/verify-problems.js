// Ҳамаи мисолҳо ва тестҳои масъалаҳоро бо ҳалли намунавӣ тавассути санҷандаи воқеӣ иҷро мекунад.
// Натиҷа: docs/verification.md ва docs/verification.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROBLEMS, LESSON_PROBLEMS, BUGGY_COMPARE } from '../server/seed/problems.js';
import { judgeAll, judgeStatus, firstDiff } from '../server/judge.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const st = judgeStatus();
if (!st.ok) { console.error('Санҷанда танзим нашудааст:', st.reason); process.exit(2); }

const all = [...PROBLEMS, ...LESSON_PROBLEMS];
const rows = []; let bad = 0;
for (const p of all) {
  const exTests = p.examples.map(e => ({ input: e.input, output: e.output, tags: [], hidden: false }));
  const ex = await judgeAll(p.solution, exTests);
  const ts = await judgeAll(p.solution, p.tests);
  // мисолҳо бояд дар байни тестҳои кушода бошанд
  const openMissing = p.examples.filter(e => !p.tests.some(t => !t.hidden && t.input.trim() === e.input.trim() && !firstDiff(t.output, e.output)));
  const ok = ex.verdict === 'AC' && ts.verdict === 'AC' && openMissing.length === 0;
  if (!ok) bad++;
  const fails = [...(ex.tests || []), ...(ts.tests || [])].filter(t => t.status !== 'AC').map(t => ({ i: t.i, status: t.status, diff: t.diff }));
  rows.push({ slug: p.slug, title: p.title, topic: p.topic, examples: `${ex.passed}/${ex.total}`, tests: `${ts.passed}/${ts.total}`, hidden: p.tests.filter(t => t.hidden).length, verdict: ok ? 'OK' : 'ХАТО', exVerdict: ex.verdict, testVerdict: ts.verdict, compile: ex.compile || ts.compile, fails, openMissing: openMissing.length });
  console.log(`${ok ? '✓' : '✗'} ${p.slug.padEnd(9)} ${p.title.padEnd(28)} мисолҳо ${ex.passed}/${ex.total}  тестҳо ${ts.passed}/${ts.total}${ok ? '' : '  ' + JSON.stringify({ ex: ex.verdict, ts: ts.verdict, fails, openMissing: openMissing.length, ce: (ex.compile || '').slice(0, 300) })}`);
}
// Назорати манфӣ: ҳалли нопурра бояд маҳз дар тестҳои «баробарӣ» афтад
const cmp = PROBLEMS.find(p => p.slug === 'cond-1');
const neg = await judgeAll(BUGGY_COMPARE, cmp.tests);
const negTags = [...new Set(neg.tests.filter(t => t.status !== 'AC').flatMap(t => t.tags))];
console.log(`Назорати манфӣ (ҳалли нопурра): ${neg.verdict} ${neg.passed}/${neg.total}, тамғаҳои афтода: ${negTags.join(', ')}`);

const now = new Date().toISOString();
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/verification.json'), JSON.stringify({ at: now, driver: st.driver, rows, negative: { verdict: neg.verdict, passed: neg.passed, total: neg.total, failedTags: negTags } }, null, 2));
const md = [
  `# Санҷиши масъалаҳо бо ҳалли намунавӣ`, '',
  `Сана: ${now} · Санҷанда: \`${st.driver}\` (g++ C++17, иҷрои воқеӣ)`, '',
  '| # | Масъала | Мавзӯъ | Мисолҳо | Тестҳо (ҳамагӣ) | Пинҳонӣ | Натиҷа |', '|---|---|---|---|---|---|---|',
  ...rows.map((r, i) => `| ${i + 1} | ${r.title} (\`${r.slug}\`) | ${r.topic} | ${r.examples} | ${r.tests} | ${r.hidden} | ${r.verdict} |`),
  '', `Назорати манфӣ: барномаи «барои баробарӣ B чоп мекунад» дар «Муқоисаи ду адад» — ${neg.verdict}, ${neg.passed}/${neg.total}; тамғаҳои афтода: ${negTags.join(', ')}.`, '',
];
fs.writeFileSync(path.join(root, 'docs/verification.md'), md.join('\n'));
console.log(bad ? `\n${bad} масъала номувофиқ` : `\nҲамаи ${all.length} масъала гузаштанд.`);
process.exit(bad ? 1 : 0);
