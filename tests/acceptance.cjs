// Санҷишҳои қабули кор (9 банд) — дар браузери воқеӣ (Playwright/Chromium) бо сессияҳои алоҳида.
// Иҷро: npm run test:acceptance   → натиҷа: docs/acceptance.md, docs/screenshots/*.png
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'codelab-acc-'));
const DB = path.join(TMP, 'test.db');
const P = 3210, P_DOWN = 3211, P_NONE = 3212;
const U = p => `http://localhost:${p}`;
const BUGGY = `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    if (a > b) {
        cout << "A" << endl;
    } else {
        cout << "B" << endl;
    }
    return 0;
}`;
const GOOD = `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    if (a > b) cout << "A" << endl;
    else if (a < b) cout << "B" << endl;
    else cout << "EQUAL" << endl;
    return 0;
}`;
const CE = `#include <iostream>
using namespace std;
int main() {
    long long a, b
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

const results = []; let section = '';
function check(name, ok, detail = '') {
  results.push({ section, name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
}
function sec(s) { section = s; console.log('\n' + s); }

function startServer(port, env = {}) {
  const p = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], { env: { ...process.env, PORT: String(port), DB_FILE: DB, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((res, rej) => {
    let out = '';
    p.stdout.on('data', d => { out += d; if (out.includes('CodeLab:')) res(p); });
    p.stderr.on('data', d => { if (!/Experimental|trace-warnings/.test(d)) process.stderr.write(d); });
    setTimeout(() => rej(new Error('server timeout ' + out)), 15000);
  });
}

async function main() {
  const servers = [await startServer(P)];
  const browser = await chromium.launch();
  const errors = [];
  async function session(login, opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light', ...opts.ctx });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${login}: ${e.message}`));
    if (login) {
      await page.goto(U(P) + '/');
      await page.fill('input[autocomplete=username]', login);
      await page.fill('input[type=password]', opts.password || 'ilmspace');
      await page.click('form button.btn.p');
      await page.waitForSelector('header.top', { timeout: 10000 });
    }
    return { ctx, page };
  }
  const api = (page, method, url, body) => page.evaluate(async ([m, u, b]) => {
    const r = await fetch(u, { method: m, headers: b ? { 'Content-Type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, data: await r.json().catch(() => null) };
  }, [method, url, body]);
  const setCode = (page, code) => page.evaluate(c => { const v = window.__editor; v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: c } }); }, code);
  const getCode = page => page.evaluate(() => window.__editor.state.doc.toString());
  const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
  const waitGraded = async (page, sid) => { for (let i = 0; i < 60; i++) { const r = await api(page, 'GET', `/api/submissions/${sid}`); if (r.data?.grading) return r.data; await page.waitForTimeout(300); } throw new Error('not graded ' + sid); };
  const submitApi = async (page, pid, code, lessonId) => (await api(page, 'POST', '/api/submissions', { problem_id: pid, code, client_token: 'tok-' + Math.random().toString(36).slice(2), lesson_id: lessonId })).data;

  const T = await session('ustod');
  const A = await session('shogird');
  const B = await session('begona');
  const problems = (await api(T.page, 'GET', '/api/problems')).data;
  const pid = slug => problems.find(p => p.slug === slug).id;
  const CMP = pid('cond-1'), FIX = pid('cond-fix');

  // ───────── 1 ─────────
  sec('1) Ду сессия: устод дарсро оғоз мекунад, шогирди гурӯҳ мебинад, шогирди гурӯҳи дигар дастрасӣ надорад');
  await A.page.goto(U(P) + '/#/');
  await A.page.waitForSelector('text=Пешрафт аз рӯи мавзӯъ');
  await T.page.goto(U(P) + '/#/');
  await T.page.click('text=Ба гурӯҳ деҳ');
  await T.page.waitForURL(/#\/live\/\d+/);
  const LID = Number(T.page.url().match(/live\/(\d+)/)[1]);
  await T.page.click('[data-testid=start-lesson]');
  await T.page.waitForSelector('text=Дарсро анҷом деҳ');
  await shot(T.page, '01-teacher-live-start');
  let ok = await A.page.waitForSelector('text=Дарс ҳозир меравад', { timeout: 8000 }).then(() => true).catch(() => false);
  const aHome = await A.page.textContent('body');
  check('Шогирди гурӯҳ дарсро бе refresh мебинад («Дарс ҳозир меравад», «Шартҳо дар C++»)', ok && aHome.includes('Шартҳо дар C++'));
  await shot(A.page, '01-student-home-live');
  await B.page.goto(U(P) + '/#/'); await B.page.waitForSelector('text=Пешрафт аз рӯи мавзӯъ');
  const bHome = await B.page.textContent('body');
  check('Шогирди гурӯҳи дигар дар саҳифаи аввал дарси «Шартҳо»-ро намебинад', !bHome.includes('Шартҳо дар C++') && !bHome.includes('Дарс ҳозир меравад'));
  const bApi = await api(B.page, 'GET', `/api/lessons/${LID}`);
  check('Шогирди гурӯҳи дигар: API дарс → 403', bApi.status === 403, bApi.data?.error);
  await B.page.goto(U(P) + `/#/lesson/${LID}`); await B.page.waitForSelector('.notice');
  check('Шогирди гурӯҳи дигар: саҳифаи дарс паёми «дастрасӣ надоред» медиҳад', (await B.page.textContent('body')).includes('дастрасӣ надоред'));
  const aBoard = await api(A.page, 'GET', `/api/lessons/${LID}/board`);
  check('Шогирд ҷадвали устодро гирифта наметавонад (403)', aBoard.status === 403);
  const aProb = (await api(A.page, 'GET', `/api/problems/${CMP}`)).data;
  check('Ба шогирд ҳалли намунавӣ ва тестҳои пинҳонӣ фиристода намешаванд', aProb && !('solution' in aProb) && !('tests' in aProb), Object.keys(aProb || {}).join(','));

  // Қадами «Пешгӯӣ кун»
  await A.page.click('text=Оғоз кун');
  await A.page.waitForURL(/#\/lesson\//);
  await A.page.fill('input.i.mono', 'Якум калон аст');
  await A.page.click('button:has-text("Фирист")');
  ok = await A.page.waitForSelector('text=Натиҷаи воқеии иҷро', { timeout: 20000 }).then(() => true).catch(() => false);
  const predTxt = await A.page.textContent('body');
  check('«Пешгӯӣ кун»: пешгӯӣ ва натиҷаи воқеии иҷро паҳлуи ҳам', ok && predTxt.includes('Якум калон нест') && predTxt.includes('Якум калон аст'));
  await shot(A.page, '01-student-predict');

  // ───────── 2 ─────────
  sec('2) «Муқоисаи ду адад»: аввал ҳалли нопурра, баъд ҳалли дуруст');
  await A.page.click('button.step:has-text("Худат ҳал кун")');
  await A.page.click('a:has-text("Оғоз кун")');
  await A.page.waitForFunction(() => !!window.__editor);
  await setCode(A.page, BUGGY);
  await A.page.click('[data-testid=submit]');
  await A.page.waitForSelector('text=Ҷавоби нодуруст', { timeout: 20000 });
  const wa = await A.page.textContent('.out');
  check('Барои 5 5 фарқи B ва EQUAL дида мешавад', wa.includes('5 5') && wa.includes('EQUAL') && /Фарқи аввал: сатри 1, аломати 1/.test(wa) && wa.includes('баробарӣ'), wa.match(/Фарқи аввал[^.]*\./)?.[0]);
  await shot(A.page, '02-student-wrong-answer');
  await T.page.waitForFunction(() => document.body.textContent.includes('баробарӣ') && document.body.textContent.includes('1 шогирд'), null, { timeout: 8000 }).catch(() => {});
  let tb = await T.page.textContent('body');
  check('Ҷадвали устод бе refresh: «✗ … баробарӣ» ва «1 шогирд … баробарӣ»', tb.includes('баробарӣ') && /1 шогирд\s*ҳоло аз тестҳои бахши «баробарӣ»/.test(tb));
  await shot(T.page, '02-teacher-board-wrong');
  await setCode(A.page, GOOD);
  await A.page.click('[data-testid=submit]');
  await A.page.waitForSelector('text=Ҳал шуд!', { timeout: 20000 });
  check('Ҳалли дуруст: «Ҷавоби дуруст», ҳамаи тестҳо гузаштанд', (await A.page.textContent('.out')).includes('Ҷавоби дуруст'));
  await shot(A.page, '02-student-accepted');
  ok = await T.page.waitForSelector('text=Ҳал шуд · 2 кӯшиш', { timeout: 8000 }).then(() => true).catch(() => false);
  check('Ҷадвали устод нав шуд: «✓ Ҳал шуд · 2 кӯшиш»', ok);
  await shot(T.page, '02-teacher-board-solved');
  await A.page.goto(U(P) + '/#/'); await A.page.waitForSelector('text=Пешрафт аз рӯи мавзӯъ');
  const prog = await A.page.textContent('.grid2 > .col:last-child');
  check('Пешрафти шогирд: «Шартҳо 1 аз N ҳал шуд» (танҳо рӯзҳои кушода)', /Шартҳо\s*1\s*аз \d+/.test(prog), prog.match(/Шартҳо[^Д]*/)?.[0]);

  // ───────── 3 ─────────
  sec('3) Як шогирд чанд ҷавоби нодуруст — дар ҳисобот як нафар');
  const C = await session(null);
  await C.page.goto(U(P) + '/');
  await C.page.click('text=Сабти ном (шогирд)');
  await C.page.fill('input[autocomplete=name]', 'Сино Каримов');
  await C.page.fill('input[autocomplete=username]', 'sino');
  await C.page.fill('input[type=password]', 'parol123');
  await C.page.click('form button.btn.p');
  await C.page.waitForSelector('text=Ба гурӯҳ ҳамроҳ шав');
  const g1 = (await api(T.page, 'GET', '/api/groups')).data[0];
  await C.page.fill('input[aria-label="Рамзи даъват"]', g1.invite_code);
  await C.page.click('button:has-text("Ҳамроҳ шав")');
  await C.page.waitForSelector('text=интизори тасдиқ', { timeout: 5000 }).catch(() => {});
  const lessonPage = T.page.url();
  await T.page.goto(U(P) + `/#/g/${g1.id}?tab=students`);
  await T.page.click('button:has-text("Қабул кун")');
  await T.page.waitForTimeout(500);
  const mem = (await api(T.page, 'GET', `/api/groups/${g1.id}`)).data.members.find(m => m.login === 'sino');
  check('Сабти номи шогирд → рамзи даъват → устод қабул кард', mem?.status === 'active');
  ok = await C.page.waitForSelector('text=Дарс ҳозир меравад', { timeout: 8000 }).then(() => true).catch(() => false);
  check('Шогирди навқабул дарси ҷориро бе refresh мебинад', ok);
  for (let i = 0; i < 3; i++) await waitGraded(C.page, (await submitApi(C.page, CMP, BUGGY, LID)).id);
  const rep1 = (await api(T.page, 'GET', `/api/lessons/${LID}/report`)).data;
  const pr1 = rep1.problems.find(p => p.problem.id === CMP);
  const tag1 = rep1.summary.tags.find(t => t.tag === 'баробарӣ');
  check('3 кӯшиши нодуруст аз як шогирд → «баробарӣ»: 1 шогирд', tag1?.count === 1, JSON.stringify(tag1 && { count: tag1.count, subIds: tag1.subIds.length }));
  check('Ҳисобот: масъалаи мушкил — «Муқоисаи ду адад», ҳанӯз ҳал накардаанд: 1', rep1.hardest?.problem.id === CMP && pr1.stuck === 1 && pr1.failed === 4, `stuck=${pr1.stuck} failed=${pr1.failed} attempts=${pr1.attempts}`);
  check('Ҳисобот: «Кӣ ҳанӯз ёрӣ мехоҳад» — Сино як бор', rep1.needHelp.filter(n => n.user.name === 'Сино Каримов').length === 1 && rep1.needHelp.length === 1);
  check('Ҳисобот: такрор — «Шартҳо», тамғаи «баробарӣ», бо машқи тавсиявӣ', rep1.repeat?.tag === 'баробарӣ' && rep1.repeat.practice.length > 0, JSON.stringify(rep1.repeat && { topic: rep1.repeat.topic, practice: rep1.repeat.practice.map(p => p.title) }));
  await T.page.goto(U(P) + `/#/report/${LID}`); await T.page.waitForSelector('text=Кадом масъала мушкил буд');
  await shot(T.page, '03-report-before');
  await T.page.click('.card:has-text("Кӣ ҳанӯз ёрӣ мехоҳад") button.num >> nth=0');
  await T.page.waitForSelector('.modal table');
  const drillRows = await T.page.locator('.modal tbody tr').count();
  check('Рақами ҳисобот пахшшаванда аст ва ба рӯйхати кӯшишҳо мебарад', drillRows === 3, `${drillRows} кӯшиш`);
  await shot(T.page, '03-report-drilldown');
  await T.page.keyboard.press('Escape');
  await waitGraded(C.page, (await submitApi(C.page, CMP, GOOD, LID)).id);
  const rep2 = (await api(T.page, 'GET', `/api/lessons/${LID}/report`)).data;
  check('Пас аз ҳалли дуруст шумора нав шуд: «баробарӣ» 0, ҳанӯз не 0', !rep2.summary.tags.find(t => t.tag === 'баробарӣ') && rep2.problems.find(p => p.problem.id === CMP).stuck === 0 && rep2.needHelp.length === 0);

  // ───────── 4 ─────────
  sec('4) Гузариш байни масъалаҳо, refresh ва қатъи интернет');
  await A.page.goto(U(P) + `/#/p/${CMP}?lesson=${LID}`);
  await A.page.waitForFunction(() => !!window.__editor);
  await setCode(A.page, '// нусхаи A1\n' + GOOD);
  await A.page.waitForSelector('text=Захира шуд');
  await A.page.goto(U(P) + `/#/p/${FIX}?lesson=${LID}`);
  await A.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('} else {'));
  const fixCode = await getCode(A.page);
  check('Дар масъалаи дуюм коди масъалаи якум пайдо намешавад', !fixCode.includes('нусхаи A1') && fixCode.includes('} else {'));
  const fixTabs = await A.page.textContent('.out .tabs');
  check('Натиҷаи масъалаи якум дар дуюм пайдо намешавад («Кӯшишҳо (0)»)', fixTabs.includes('Кӯшишҳо (0)'), fixTabs);
  await A.page.click('text=Натиҷаи санҷиш');
  check('Дар ҷадвали натиҷаи масъалаи дуюм кӯшиши масъалаи якум нест', (await A.page.textContent('.out')).includes('Ҳанӯз кӯшиш нест'));
  await setCode(A.page, fixCode.replace('} else {', '} else if (a < b) {\n        cout << "B" << endl;\n    } else { // ислоҳ'));
  await A.page.waitForSelector('text=Захира шуд');
  await A.page.reload(); await A.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('// ислоҳ'));
  check('Пас аз refresh коди масъалаи дуюм боқӣ монд', (await getCode(A.page)).includes('// ислоҳ'));
  await A.page.goto(U(P) + `/#/p/${CMP}?lesson=${LID}`); await A.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('нусхаи A1'));
  check('Масъалаи якум коди худро нигоҳ дошт', (await getCode(A.page)).includes('нусхаи A1'));
  await A.page.goto(U(P) + `/#/p/${FIX}?lesson=${LID}`); await A.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('// ислоҳ'));
  await A.ctx.setOffline(true);
  await A.page.evaluate(() => dispatchEvent(new Event('offline')));
  await setCode(A.page, (await getCode(A.page)) + '\n// бе интернет навишта шуд');
  ok = await A.page.waitForSelector('text=Дар ин дастгоҳ нигоҳ дошта шуд', { timeout: 6000 }).then(() => true).catch(() => false);
  check('Бе интернет: ҳолати «Дар ин дастгоҳ нигоҳ дошта шуд», навиштан идома дорад', ok);
  await shot(A.page, '04-offline-saved-locally');
  let offlineReload = false;
  try { await A.page.reload({ timeout: 8000 }); offlineReload = await A.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('бе интернет'), null, { timeout: 8000 }).then(() => true); } catch { offlineReload = false; }
  check('Refresh бе интернет: саҳифа аз кэш кушода шуд ва код гум нашуд', offlineReload);
  await A.ctx.setOffline(false);
  if (!offlineReload) await A.page.reload();
  await A.page.waitForFunction(() => !!window.__editor);
  await A.page.evaluate(() => dispatchEvent(new Event('online')));
  ok = await A.page.waitForSelector('[data-testid=save-state]:has-text("Захира шуд")', { timeout: 8000 }).then(() => true).catch(() => false);
  const srvDraft = (await api(A.page, 'GET', `/api/drafts/${FIX}`)).data;
  check('Пас аз барқароршавии интернет ба сервер ҳамоҳанг шуд', ok && srvDraft.code.includes('бе интернет'));
  // Ихтилоф байни ду дастгоҳ
  const A2 = await session('shogird', { ctx: { viewport: { width: 400, height: 800 } } });
  await A2.page.goto(U(P) + `/#/p/${FIX}`); await A2.page.waitForFunction(() => window.__editor && window.__editor.state.doc.toString().includes('бе интернет'));
  await A.ctx.setOffline(true); await A.page.evaluate(() => dispatchEvent(new Event('offline')));
  await setCode(A.page, (await getCode(A.page)) + '\n// аз ноутбук');
  await A.page.waitForSelector('text=Дар ин дастгоҳ нигоҳ дошта шуд');
  await setCode(A2.page, (await getCode(A2.page)) + '\n// аз телефон');
  await A2.page.waitForSelector('text=Захира шуд');
  await A.ctx.setOffline(false); await A.page.evaluate(() => dispatchEvent(new Event('online')));
  ok = await A.page.waitForSelector('text=Кадом нусхаро идома медиҳед', { timeout: 8000 }).then(() => true).catch(() => false);
  check('Ду таҳрири гуногун дар ду дастгоҳ → «Ҳамоҳангсозӣ лозим аст» бо интихоби нусха', ok);
  await shot(A.page, '04-conflict-choice');
  await A.page.click('button:has-text("Ин нусхаро идома деҳ") >> nth=0');
  await A.page.waitForSelector('[data-testid=save-state]:has-text("Захира шуд")');
  const afterConf = (await api(A.page, 'GET', `/api/drafts/${FIX}`)).data;
  check('Ҳар ду нусха нигоҳ дошта шуд (интихобшуда + нусхаи телефон дар «нигоҳдошта»)', afterConf.code.includes('аз ноутбук') && afterConf.saved.some(s => s.code.includes('аз телефон')));
  await A2.ctx.close();

  // Дукаратаи «Фирист»
  const before = (await api(A.page, 'GET', `/api/submissions?problem_id=${FIX}`)).data.length;
  await A.page.locator('[data-testid=submit]').first().dblclick();
  await A.page.waitForTimeout(2500);
  const after = (await api(A.page, 'GET', `/api/submissions?problem_id=${FIX}`)).data.length;
  check('Пахши дукаратаи «Фирист» як кӯшиш эҷод мекунад', after - before === 1, `${before} → ${after}`);
  const tok = 'same-token-123';
  const s1 = await api(A.page, 'POST', '/api/submissions', { problem_id: FIX, code: GOOD, client_token: tok });
  const s2 = await api(A.page, 'POST', '/api/submissions', { problem_id: FIX, code: GOOD, client_token: tok });
  check('Ҳамон client_token дубора → ҳамон кӯшиш (сервер)', s1.data.id === s2.data.id);
  await waitGraded(A.page, s1.data.id);

  // ───────── 5 ─────────
  sec('5) Шарҳи устод ба сатри кӯшиш пас аз таҳрири код дар ҳамон нусха мемонад');
  await T.page.goto(lessonPage); await T.page.waitForSelector('.board');
  await T.page.click('tr:has-text("Шогирди намоишӣ") td.cell >> nth=1');
  await T.page.waitForSelector('.drawer button:has-text("№1")');
  await T.page.click('.drawer button:has-text("№1")');
  await T.page.click('.drawer .codeview .ln.click:has-text("} else {") >> span >> nth=0');
  await T.page.fill('.drawer textarea', 'Ин else ҳолати a == b-ро ҳам мегирад. Шохаи EQUAL куҷост?');
  await T.page.click('.drawer button:has-text("Шарҳ гузор")');
  await T.page.waitForSelector('.drawer .cmt');
  await shot(T.page, '05-teacher-comment');
  const subsA = (await api(A.page, 'GET', `/api/submissions?problem_id=${CMP}`)).data.sort((a, b) => a.number - b.number);
  await A.page.goto(U(P) + `/#/p/${CMP}?lesson=${LID}`); await A.page.waitForFunction(() => !!window.__editor);
  await setCode(A.page, '// таҳрири нав пас аз шарҳ\n' + GOOD);
  await A.page.waitForSelector('text=Захира шуд');
  const sNew = await submitApi(A.page, CMP, '// кӯшиши нав\n' + GOOD, LID); await waitGraded(A.page, sNew.id);
  const s1v = (await api(A.page, 'GET', `/api/submissions/${subsA[0].id}`)).data;
  const sNv = (await api(A.page, 'GET', `/api/submissions/${sNew.id}`)).data;
  const lineText = s1v.code.split('\n')[s1v.comments[0]?.line - 1];
  check('Шарҳ ба кӯшиши №1, сатри 9 («} else {») пайваст аст', s1v.comments.length === 1 && s1v.comments[0].line === 9 && lineText.trim() === '} else {', `сатр ${s1v.comments[0]?.line}: ${lineText}`);
  check('Коди кӯшиши №1 тағйир наёфт ва кӯшиши нав шарҳ надорад', s1v.code === BUGGY && sNv.comments.length === 0);
  await A.page.click('text=Кӯшишҳо (');
  await A.page.click('.out tr:has(td:nth-child(2):text-is("1")) button:has-text("Бин")');
  ok = await A.page.waitForSelector('.out .cmt', { timeout: 5000 }).then(() => true).catch(() => false);
  check('Шогирд шарҳро дар кӯшиши №1 мебинад', ok && (await A.page.textContent('.out')).includes('Шохаи EQUAL куҷост'));
  await shot(A.page, '05-student-sees-comment');

  // ───────── 6 ─────────
  sec('6) Хатои компилятсия, ҷавоби нодуруст ва қатъи хидмати иҷро');
  await setCode(A.page, CE);
  await A.page.click('[data-testid=submit]');
  await A.page.waitForSelector('.out :text("Хатои компилятсия")', { timeout: 20000 });
  const ceTxt = await A.page.textContent('.out');
  check('Хатои компилятсия: паёми аслӣ + шарҳи тоҷикӣ, рақами сатр аз g++ (5)', ceTxt.includes('expected initializer before') && ceTxt.includes('Сатри 5') && ceTxt.includes('нуқтавергул'), ceTxt.match(/Сатри \d+[^С]*/)?.[0]);
  await shot(A.page, '06-compile-error');
  await A.page.click('text=Иҷро');
  await setCode(A.page, 'int main() { }');
  await A.page.fill('.out textarea', '1 2');
  await A.page.click('.wsx-actions [data-testid=run]');
  await A.page.waitForSelector('text=Барнома натиҷа чоп накард', { timeout: 20000 });
  check('Иҷро бе баромад: «Барнома натиҷа чоп накард»', true);
  check('Ҷавоби нодуруст: паёми алоҳида (банди 2)', results.some(r => r.name.startsWith('Барои 5 5') && r.ok));
  servers.push(await startServer(P_DOWN, { JUDGE_DRIVER: 'judge0', JUDGE0_URL: 'http://127.0.0.1:9' }));
  const boardBefore = (await api(T.page, 'GET', `/api/lessons/${LID}/board`)).data;
  const stepCmp = boardBefore.steps.find(s => s.problem?.id === CMP).id;
  const uidA = boardBefore.students.find(s => s.name === 'Шогирди намоишӣ').id;
  const cellBefore = boardBefore.cols.find(c => c.stepId === stepCmp).cells[uidA];
  await A.page.goto(U(P_DOWN) + `/#/p/${CMP}?lesson=${LID}`); await A.page.waitForFunction(() => !!window.__editor);
  await setCode(A.page, GOOD);
  await A.page.click('[data-testid=submit]');
  ok = await A.page.waitForSelector('text=Хидмати санҷиш ҷавоб надод', { timeout: 30000 }).then(() => true).catch(() => false);
  const seTxt = await A.page.textContent('.out');
  check('Қатъи хидмати иҷро: паёми «Хидмати санҷиш ҷавоб надод», бе натиҷаи сохта', ok && seTxt.includes('таъсир намерасонад') && !seTxt.includes('Ҷавоби дуруст ·'));
  await shot(A.page, '06-service-down');
  const boardAfter = (await api(T.page, 'GET', `/api/lessons/${LID}/board`)).data;
  const cellAfter = boardAfter.cols.find(c => c.stepId === stepCmp).cells[uidA];
  check('Хатои хидмат ба пешрафт ва шумораи кӯшишҳо таъсир нарасонд', cellAfter.solved && cellAfter.attempts === cellBefore.attempts, `кӯшишҳо ${cellBefore.attempts} → ${cellAfter.attempts}, ҳал шуд: ${cellAfter.solved}`);
  await A.page.click('text=Иҷро');
  await A.page.click('.wsx-actions [data-testid=run]');
  check('«Иҷро кун» ҳангоми қатъи хидмат: «Хидмати иҷро ҷавоб надод»', await A.page.waitForSelector('text=Хидмати иҷро ҷавоб надод', { timeout: 30000 }).then(() => true).catch(() => false));
  servers.push(await startServer(P_NONE, { JUDGE_DRIVER: 'judge0', JUDGE0_URL: '' }));
  await A.page.goto(U(P_NONE) + `/#/p/${CMP}`); await A.page.waitForFunction(() => !!window.__editor);
  await A.page.click('.wsx-actions [data-testid=run]');
  ok = await A.page.waitForSelector('text=Санҷандаи C++ пайваст нашудааст', { timeout: 10000 }).then(() => true).catch(() => false);
  check('Санҷанда танзим нашудааст: сабаб ва қадамҳои пайвасткунӣ нишон дода мешаванд', ok && (await A.page.textContent('.out')).includes('JUDGE0_URL'));
  await shot(A.page, '06-judge-not-configured');

  // ───────── 7 ─────────
  sec('7) Ҳолати проектор бе маълумоти шахсӣ ва тестҳои пинҳонӣ');
  const lessonSteps = (await api(A.page, 'GET', `/api/lessons/${LID}`)).data.steps;
  const quiz = lessonSteps.find(s => s.kind === 'quiz');
  await api(A.page, 'POST', `/api/steps/${quiz.id}/respond`, { answer: '1' });
  await api(C.page, 'POST', `/api/steps/${quiz.id}/respond`, { answer: '0' });
  await T.page.goto(lessonPage); await T.page.reload(); await T.page.waitForSelector('.board');
  await T.page.click('button:has-text("Ҳолати проектор")');
  await T.page.waitForSelector('.proj-frame .proj h1');
  await shot(T.page, '07-projector-preview');
  await T.page.click('button:has-text("Ба экран барор")');
  const PJ = await T.ctx.newPage();
  await PJ.goto(U(P) + `/#/projector/${LID}`); await PJ.waitForSelector('.proj h1');
  const forbidden = ['Шогирди намоишӣ', 'Сино', 'sino', 'shogird', 'Устоди намоишӣ', '-1000000000 1000000000', '1000000000 1000000000', '-5 -5', '0 -1', 'solution', 'баҳо'];
  const leak = async () => { const t = await PJ.textContent('body'); return forbidden.filter(f => t.includes(f)); };
  let l1 = await leak();
  check('Проектор (мисол): ном, баҳо ва тестҳои пинҳонӣ нестанд', l1.length === 0, l1.join(', ') || (await PJ.textContent('.proj h1')));
  await shot(PJ, '07-projector-example');
  await T.page.selectOption('.modal select >> nth=0', 'votes');
  await T.page.selectOption('.modal select >> nth=1', String(quiz.id));
  await T.page.waitForTimeout(500);
  await T.page.click('button:has-text("Ба экран барор")');
  await PJ.waitForSelector('text=2 ҷавоб', { timeout: 8000 });
  l1 = await leak();
  check('Проектор (овоздиҳӣ): танҳо тақсимоти ҷавобҳо, бе ном', l1.length === 0 && (await PJ.textContent('body')).includes('50%'), l1.join(', '));
  await shot(PJ, '07-projector-votes');
  const cSub = (await api(T.page, 'GET', `/api/submissions?user_id=${mem.id}&problem_id=${CMP}`)).data[0];
  await api(T.page, 'POST', `/api/lessons/${LID}/projector`, { kind: 'code', submission_id: cSub.id, from: 7, to: 9 });
  await PJ.waitForSelector('text=Порчаи код', { timeout: 8000 });
  l1 = await leak();
  check('Проектор (порчаи код): танҳо сатрҳои интихобшуда, бе номи шогирд', l1.length === 0 && (await PJ.textContent('body')).includes('else if'), l1.join(', '));
  await shot(PJ, '07-projector-code');
  const pjApi = JSON.stringify((await api(T.page, 'GET', `/api/lessons/${LID}/projector`)).data.content);
  check('Ҷавоби API-и проектор майдони user/name/tests надорад', !/"(user|name|tests|hidden|solution)"/.test(pjApi));
  await PJ.close();
  await T.page.keyboard.press('Escape');

  // ───────── 8 ─────────
  sec('8) Телефон 360px: аз хондани шарт то натиҷа');
  const M = await session('shogird', { ctx: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } });
  const ARR = pid('arr-1');
  await api(T.page, 'POST', `/api/groups/${g1.id}/assignments`, { problem_ids: [ARR], due_local: '2030-01-01T18:00', title: 'Массивҳо' });
  await M.page.goto(U(P) + `/#/p/${ARR}`);
  await M.page.waitForSelector('.wsx h1');
  await M.page.waitForFunction(() => !!window.__editor);
  await shot(M.page, '08-mobile-statement');
  const vis = async sel => { const bb = await M.page.locator(sel).first().boundingBox(); return bb && bb.x >= 0 && bb.y >= 0 && bb.x + bb.width <= 360 && bb.y + bb.height <= 740; };
  check('Тугмаҳои «Иҷро кун» ва «Барои санҷиш фирист» дар поёни экран (360px)', (await vis('.mbar [data-testid=run]')) && (await vis('.mbar [data-testid=submit]')));
  check('Шарт хонда мешавад', (await M.page.locator('.wsx h1').isVisible()) && (await M.page.textContent('.wsx')).includes('Холҳои даста'));
  const SOL = '#include <iostream>\nusing namespace std;\nint main() {\n    int n, s = 0, m = 0, x;\n    cin >> n;\n    for (int i = 0; i < n; i++) { cin >> x; s += x; if (x > m) m = x; }\n    cout << s << " " << m << endl;\n}';
  await setCode(M.page, SOL);
  await shot(M.page, '08-mobile-code');
  await M.page.click('.ex button:has-text("Бо ҳамин вуруд санҷ") >> nth=0');
  await M.page.waitForSelector('text=Бо натиҷаи интизоршуда мувофиқ аст', { timeout: 20000 });
  check('«Бо ҳамин вуруд санҷ» → натиҷа дар поёни масъала', true);
  check('Пас аз иҷро код нигоҳ дошта шуд', (await getCode(M.page)) === SOL);
  await M.page.click('.mbar [data-testid=submit]');
  await M.page.waitForSelector('text=Ҳал шуд!', { timeout: 20000 });
  await shot(M.page, '08-mobile-result');
  check('Фиристодан аз телефон: «Ҳал шуд!»', true);
  const sw = await M.page.evaluate(() => document.documentElement.scrollWidth);
  check('Скролли уфуқӣ нест (scrollWidth ≤ 360)', sw <= 360, `scrollWidth=${sw}`);
  await M.page.goto(U(P) + '/#/'); await M.page.waitForSelector('text=Пешрафт аз рӯи мавзӯъ');
  await shot(M.page, '08-mobile-home');
  const sw2 = await M.page.evaluate(() => document.documentElement.scrollWidth);
  check('Саҳифаи аввал дар 360px бе скролли уфуқӣ', sw2 <= 360, `scrollWidth=${sw2}`);

  // Мавзӯи торик, ноутбук ва проектор
  const D = await session('ustod', { dark: true });
  await D.page.goto(U(P) + lessonPage.slice(lessonPage.indexOf('/#'))); await D.page.waitForSelector('.board');
  await shot(D.page, '09-teacher-live-dark');
  const D2 = await session('shogird', { dark: true, ctx: { viewport: { width: 1366, height: 768 } } });
  await D2.page.goto(U(P) + `/#/p/${CMP}`); await D2.page.waitForFunction(() => !!window.__editor);
  await D2.page.click('text=Натиҷаи санҷиш');
  await shot(D2.page, '09-student-workspace-dark-laptop');
  const PJ2 = await D.ctx.newPage(); await PJ2.setViewportSize({ width: 1920, height: 1080 });
  await PJ2.goto(U(P) + `/#/projector/${LID}`); await PJ2.waitForSelector('.proj');
  await shot(PJ2, '09-projector-1080p');

  // ───────── 9 ─────────
  sec('9) Ҳамаи мисолҳо ва тестҳои 24 масъала бо ҳалли намунавӣ');
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'verify-problems.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const okN = (out.match(/^✓/gm) || []).length, badN = (out.match(/^✗/gm) || []).length;
    check(`Масъалаҳо: ${okN} гузашт, ${badN} номувофиқ`, badN === 0 && okN === 25, out.split('\n').find(l => l.startsWith('Назорати манфӣ')));
  } catch (e) { check('verify-problems', false, e.stdout || e.message); }

  // ───────── 10 ─────────
  sec('10) Рӯзҳоро устод мекушояд · имтиҳон бо назорат');
  {
    const crs = (await api(T.page, 'GET', `/api/groups/${g1.id}/course`)).data;
    const days = crs.weeks.flatMap(w => w.days);
    const closedDay = days.find(d => d.kind === 'lesson' && !d.opened && d.status === 'planned');
    const examDay = days.find(d => d.kind === 'exam');
    const S2 = await session('shogird');
    const setsBefore = await api(S2.page, 'GET', `/api/lessons/${closedDay.id}/sets`);
    check('Рӯзи пӯшида: шогирд ба маҷмӯаҳо даромада наметавонад (403)', setsBefore.status === 403, String(setsBefore.status));
    await api(T.page, 'POST', `/api/lessons/${closedDay.id}/open`, { opened: true });
    const setsAfter = await api(S2.page, 'GET', `/api/lessons/${closedDay.id}/sets`);
    const cnt = setsAfter.data?.sets ? ['class', 'home', 'extra'].reduce((a, k) => a + setsAfter.data.sets[k].length, 0) : 0;
    check('Пас аз «Рӯзро кушо»: 10 масъала (4 синфӣ + 3 хонагӣ + 3 иловагӣ)', setsAfter.status === 200 && cnt === 10, `status=${setsAfter.status}, ${cnt}`);
    await api(T.page, 'POST', `/api/lessons/${examDay.id}/open`, { opened: true });
    const exSets0 = (await api(S2.page, 'GET', `/api/lessons/${examDay.id}/sets`)).data;
    const exPid = exSets0.sets.class[0].id;
    const before = await api(S2.page, 'GET', `/api/problems/${exPid}`);
    check('Имтиҳон: то қабули шартҳо масъала кушода намешавад', before.status === 403 && before.data?.needAccept === true, String(before.status));
    await S2.page.goto(U(P) + `/#/set/${examDay.id}/class/0`); await S2.page.waitForSelector('.examgate');
    const gateTxt = await S2.page.textContent('.examgate');
    check('Саҳифаи шартҳо: экрани пурра, copy/paste, 3 вайронкунӣ → блок', /экрани пурра/.test(gateTxt) && /paste/.test(gateTxt) && /3 вайронкунӣ/.test(gateTxt));
    const disabled = await S2.page.locator('.eg-btns .btn.p').isDisabled();
    await S2.page.check('.eg-check input'); await S2.page.click('.eg-btns .btn.p');
    await S2.page.waitForFunction(() => !!window.__editor, { timeout: 15000 });
    check('«Ба имтиҳон ворид шав» танҳо баъди қабул; имтиҳон дар экрани пурра', disabled && await S2.page.evaluate(() => !!document.fullscreenElement));
    await S2.page.evaluate(() => document.dispatchEvent(new Event('copy', { bubbles: true, cancelable: true })));
    const w1 = await S2.page.waitForSelector('.examwarn h2:has-text("1 аз 3")', { timeout: 6000 }).then(() => true).catch(() => false);
    check('Copy дар имтиҳон → огоҳии калон «Вайронкунӣ 1 аз 3»', w1);
    await shot(S2.page, '10-exam-warning');
    await S2.page.click('.examwarn .btn.p'); await S2.page.waitForTimeout(1300);
    let last;
    for (const t of ['paste', 'leave']) { last = await api(S2.page, 'POST', `/api/lessons/${examDay.id}/violation`, { type: t }); await S2.page.waitForTimeout(1300); }
    check('3 вайронкунӣ дар имтиҳон → блоки худкор', last.data?.blocked === true || last.data?.blocked === 1, JSON.stringify(last.data));
    const exSets = await api(S2.page, 'GET', `/api/lessons/${examDay.id}/sets`);
    check('Шогирди блокшуда имтиҳонро кушода наметавонад', exSets.status === 403, String(exSets.status));
    const sid = (await api(T.page, 'GET', `/api/groups/${g1.id}`)).data.members.find(m => m.login === 'shogird').id;
    await api(T.page, 'POST', `/api/lessons/${examDay.id}/unblock`, { user_id: sid });
    const exSets2 = await api(S2.page, 'GET', `/api/lessons/${examDay.id}/sets`);
    check('Танҳо устод блокро бардошт → шогирд боз даромад', exSets2.status === 200, String(exSets2.status));
    const selfUnblock = await api(S2.page, 'POST', `/api/lessons/${examDay.id}/unblock`, { user_id: sid });
    check('Шогирд худаш блокро бардошта наметавонад', selfUnblock.status === 403, String(selfUnblock.status));
    await api(S2.page, 'POST', `/api/lessons/${examDay.id}/exam/finish`);
    const fin = await api(S2.page, 'GET', `/api/problems/${exPid}`);
    const finSets = (await api(S2.page, 'GET', `/api/lessons/${examDay.id}/sets`)).data;
    check('«Имтиҳонро тамом кардам» → масъалаҳо баста, натиҷа нишон дода мешавад', fin.status === 403 && finSets.exam?.finished === true, String(fin.status));
    // «Рӯзро пӯш» ҳатто вақте дарс зинда ё тамомшуда аст
    const other = days.find(d => d.kind === 'lesson' && !d.opened && d.id !== closedDay.id);
    await api(T.page, 'POST', `/api/lessons/${other.id}/start`);
    const liveOpen = await api(S2.page, 'GET', `/api/lessons/${other.id}/sets`);
    await api(T.page, 'POST', `/api/lessons/${other.id}/open`, { opened: false });
    const liveClosed = await api(S2.page, 'GET', `/api/lessons/${other.id}/sets`);
    const liveLessonPage = await api(S2.page, 'GET', `/api/lessons/${other.id}`);
    await api(T.page, 'POST', `/api/lessons/${other.id}/finish`);
    const finClosed = await api(S2.page, 'GET', `/api/lessons/${other.id}/sets`);
    const stCourse = (await api(S2.page, 'GET', '/api/course')).data.weeks.flatMap(w => w.days).find(d => d.id === other.id);
    check('«Рӯзро пӯш» дарси зинда ва тамомшударо ҳам мепӯшад', liveOpen.status === 200 && liveClosed.status === 403 && liveLessonPage.status === 403 && finClosed.status === 403 && stCourse.state === 'locked',
      `${liveOpen.status}/${liveClosed.status}/${liveLessonPage.status}/${finClosed.status}/${stCourse.state}`);
    // «↺ Аз нақшаи курс»: рӯз аз нав аз рӯи нақша пур мешавад
    const tpl = (await api(T.page, 'GET', '/api/templates')).data[0];
    await api(T.page, 'POST', `/api/templates/${tpl.id}/assign`, { lesson_id: other.id });
    const afterTpl = (await api(T.page, 'GET', `/api/lessons/${other.id}/sets`)).data.sets.class.length;
    await api(T.page, 'POST', `/api/lessons/${other.id}/replan`);
    const afterPlan = (await api(T.page, 'GET', `/api/lessons/${other.id}/sets`)).data.sets;
    check('«↺ Аз нақшаи курс» рӯзро ба 4+3+3 масъала бармегардонад', afterPlan.class.length === 4 && afterPlan.home.length === 3 && afterPlan.extra.length === 3, `дарси омода: ${afterTpl} → ${afterPlan.class.length}+${afterPlan.home.length}+${afterPlan.extra.length}`);
    await S2.page.goto(U(P) + `/#/set/${closedDay.id}/class/0`); await S2.page.waitForFunction(() => !!window.__editor);
    check('Тугмаи «Устод, ёрӣ лозим» нест', (await S2.page.locator('text=Устод, ёрӣ лозим').count()) === 0);
    await S2.ctx.close();
  }

  check('Дар браузер хатои JavaScript набуд', errors.length === 0, errors.join(' | '));
  await browser.close();
  servers.forEach(s => s.kill());

  const pass = results.filter(r => r.ok).length;
  const md = ['# Натиҷаи санҷишҳои қабул', '', `Сана: ${new Date().toISOString()} · Браузер: Chromium (Playwright) · Санҷанда: g++ (local), барои банди 6 — Judge0-и қатъшуда`, '',
    `**${pass} аз ${results.length} санҷиш гузашт.**`, ''];
  let cur = '';
  for (const r of results) { if (r.section !== cur) { cur = r.section; md.push('', `## ${cur}`, ''); } md.push(`- ${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` — ${r.detail.replace(/\n/g, ' ')}` : ''}`); }
  md.push('', 'Скриншотҳо: `docs/screenshots/`.');
  fs.writeFileSync(path.join(ROOT, 'docs', 'acceptance.md'), md.join('\n') + '\n');
  console.log(`\n${pass}/${results.length} гузашт`);
  process.exit(pass === results.length ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(2); });
