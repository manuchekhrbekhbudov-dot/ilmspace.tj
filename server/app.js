// ILMSPACE CodeLab — сервер (node:http, бе фреймворк)
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { openDb, q } from './db.js';
import { judgeAll, runOnce, judgeStatus, normalizeOutput, queueDepth } from './judge.js';
import { persistStatus } from './persist.js';
import { explainCompile, explainRuntime } from './explain.js';
import { seedDemo, createGroup, applyTemplate, problemData, ensureTeacher, migrateCourse, coursePlan, fillLesson, COURSE } from './seed.js';
import { TOPICS, DEFAULT_STARTER } from './seed/problems.js';
import { HttpError, bad, forbidden, notFound, J, token, hashPassword, checkPassword, inviteCode, dushanbeDate, localToUtcIso } from './util.js';

const STARTED_AT = new Date().toISOString();
// Пароли намоишӣ дар README-и оммавӣ навишта шудааст — дар сайти воқеӣ бояд иваз шавад
const PUBLIC_DEMO_PASSWORDS = new Set(['ilmspace']);
const DEMO_LOGINS = ['ustod', 'shogird', 'begona'];
// Огоҳӣ дар бораи пароли намоишӣ танҳо дар сайти воқеӣ (Render) ё бо WARN_DEMO_PASSWORD=1
const DEMO_WARN = !!(process.env.RENDER || process.env.WARN_DEMO_PASSWORD);
const pubUser = u => u && { id: u.id, login: u.login, name: u.name, role: u.role, weak_pw: DEMO_WARN && u.weak_pw ? 1 : 0 };
export function createApp({ dbFile, staticDir, seed = true } = {}) {
  const db = openDb(dbFile);
  const Q = q(db);
  if (seed) seedDemo(Q);
  if (migrateCourse(Q)) console.log(`Курси нав (${COURSE.problems.length} масъала) ба база илова шуд.`);
  const t = ensureTeacher(Q);
  if (t) console.log(`Ҳисоби устод омода аст: ${t.login}${t.fromDemo ? ' (гурӯҳҳо ва дарси омода ба он гузаштанд)' : ''}${t.reset ? ' — пароли TEACHER_PASSWORD гузошта шуд' : ' — парол бетағйир (TEACHER_PASSWORD иваз нашудааст)'}`);
  // Ҳисобҳое, ки ҳанӯз пароли намоишии оммавӣ доранд (устодҳо ва ҳисобҳои намоишӣ)
  for (const u of Q.all(`SELECT id, pass_hash, weak_pw FROM users WHERE role='teacher' OR login IN (${DEMO_LOGINS.map(() => '?').join(',')})`, ...DEMO_LOGINS)) {
    const weak = [...PUBLIC_DEMO_PASSWORDS].some(pw => checkPassword(pw, u.pass_hash)) ? 1 : 0;
    if (weak !== u.weak_pw) Q.run('UPDATE users SET weak_pw=? WHERE id=?', weak, u.id);
  }

  // Версияи барнома: хэши app.js ва styles.css. Браузер нусхаи кӯҳнаро нигоҳ намедорад ва пас аз навсозӣ худаш аз нав бор мешавад.
  let build = { at: 0, key: '', id: 'dev' };
  function buildId() {
    if (Date.now() - build.at < 2000) return build.id;
    try {
      const fa = path.join(staticDir, 'app.js'), fc = path.join(staticDir, 'styles.css');
      const a = fs.statSync(fa), c = fs.statSync(fc);
      const key = `${a.mtimeMs}:${a.size}:${c.mtimeMs}:${c.size}`;
      if (key !== build.key) build = { ...build, key, id: crypto.createHash('sha1').update(fs.readFileSync(fa)).update(fs.readFileSync(fc)).digest('hex').slice(0, 12) };
    } catch {}
    build.at = Date.now();
    return build.id;
  }

  // ───────── Realtime (SSE) ─────────
  const streams = new Map(); // userId -> Set(res)
  function publish(userIds, ev) {
    const data = `data: ${JSON.stringify(ev)}\n\n`;
    for (const u of new Set(userIds)) for (const res of streams.get(u) || []) res.write(data);
  }
  const groupAudience = gid => {
    const g = Q.get('SELECT teacher_id FROM groups WHERE id=?', gid);
    if (!g) return [];
    return [g.teacher_id, ...Q.all("SELECT user_id FROM group_members WHERE group_id=? AND status='active'", gid).map(r => r.user_id)];
  };
  const teachersOf = uid => Q.all("SELECT DISTINCT g.teacher_id t, g.id gid FROM groups g JOIN group_members m ON m.group_id=g.id WHERE m.user_id=?", uid);
  setInterval(() => { for (const set of streams.values()) for (const r of set) r.write(': ping\n\n'); }, 25000).unref();

  // ───────── Ёрирасонҳо ─────────
  const userBy = sid => sid && Q.get('SELECT u.id, u.login, u.name, u.role, u.weak_pw FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?', sid);
  const ownsGroup = (u, gid) => u.role === 'teacher' && !!Q.get('SELECT 1 FROM groups WHERE id=? AND teacher_id=?', gid, u.id);
  const isMember = (uid, gid) => !!Q.get("SELECT 1 FROM group_members WHERE group_id=? AND user_id=? AND status='active'", gid, uid);
  function lessonFor(u, id) {
    const l = Q.get('SELECT * FROM lessons WHERE id=?', id);
    if (!l) throw notFound('Дарс ёфт нашуд.');
    if (u.role === 'teacher' ? !ownsGroup(u, l.group_id) : !isMember(u.id, l.group_id)) throw forbidden('Шумо ба ин дарс дастрасӣ надоред.');
    return l;
  }
  function teacherSeesUser(t, uid) {
    return t.role === 'teacher' && !!Q.get('SELECT 1 FROM groups g JOIN group_members m ON m.group_id=g.id WHERE g.teacher_id=? AND m.user_id=?', t.id, uid);
  }
  // Натиҷаи санҷиш дар база кӯтоҳ нигоҳ дошта мешавад: барои тестҳои гузашта танҳо ҳолат, барои
  // тестҳои нагузашта баромади барнома (то 4 КБ). Вуруд ва ҷавоби интизорӣ аз худи масъала гирифта мешаванд.
  const cut = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + '\n…' : s);
  function slimDetails(d) {
    let shown = 0;
    const tests = (d.tests || []).map(t => {
      const base = { i: t.i, hidden: !!t.hidden, tags: t.tags || [], status: t.status, ms: t.ms ?? null };
      if (t.status === 'AC') return base;
      const diff = t.diff ? { ...t.diff, expected: cut(t.diff.expected, 300), actual: cut(t.diff.actual, 300) } : null;
      if (t.hidden) return { ...base, explain: t.explain, diff };   // баромади тести пинҳонӣ ба касе нишон дода намешавад
      const n = shown++ ? 1500 : 4000;
      return { ...base, explain: t.explain, actual: cut(t.actual ?? '', n), stderr: cut(t.stderr || '', 1500), diff };
    });
    return { ...d, tests, compile: cut(d.compile, 8000) };
  }
  {
    const old = Q.all(`SELECT submission_id id FROM gradings WHERE instr(details, '"input":') > 0`);
    if (old.length) {
      let before = 0, after = 0;
      Q.tx(() => { for (const { id } of old) {
        const row = Q.get('SELECT details FROM gradings WHERE submission_id=?', id); const d = J(row.details); if (!d) continue;
        const s = JSON.stringify(slimDetails(d)); before += row.details.length; after += s.length;
        Q.run('UPDATE gradings SET details=? WHERE submission_id=?', s, id);
      } });
      console.log(`Натиҷаҳои санҷиш кӯтоҳ шуданд: ${old.length} кӯшиш, ${Math.round(before / 1024)} КБ → ${Math.round(after / 1024)} КБ.`);
    }
  }
  // Версияҳои нашршудаи масъала тағйир намеёбанд — маълумоти таҳлилшударо дар хотира нигоҳ медорем
  // (рӯйхати 700+ масъала ва ҷадвалҳо ҳар дафъа JSON-и калонро аз нав намехонанд). Натиҷаро тағйир надиҳед.
  const VC = new Map();
  function pvData(pid, v) {
    const k = pid + ':' + v;
    if (VC.has(k)) return VC.get(k);
    const row = Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=?', pid, v);
    const d = row ? J(row.data) : null;
    if (row) VC.set(k, d);
    return d;
  }
  function versionData(pid, v) {
    const p = Q.get('SELECT * FROM problems WHERE id=?', pid);
    if (!p) throw notFound('Масъала ёфт нашуд.');
    const ver = v || p.current_version;
    const row = Q.get('SELECT version, published_at FROM problem_versions WHERE problem_id=? AND version=?', pid, ver);
    return { p, row, data: row ? pvData(pid, ver) : null };
  }
  function publicProblem(pid, v) {
    const { p, row, data } = versionData(pid, v);
    if (!row) throw notFound('Масъала ҳанӯз нашр нашудааст.');
    const { solution, tests, ...rest } = data;
    return { id: p.id, slug: p.slug, topic: p.topic, version: row.version, currentVersion: p.current_version, published_at: row.published_at, ...rest,
      testCount: tests.length, hiddenCount: tests.filter(t => t.hidden).length };
  }
  const solvedSet = uid => new Set(Q.all("SELECT DISTINCT s.problem_id pid FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND g.verdict='AC'", uid).map(r => r.pid));

  function gradingView(g, forTeacher, pd) {
    if (!g) return null;
    const d = J(g.details) || {};
    // Вуруд ва баромади интизории тест дар база такрор нигоҳ дошта намешавад — аз версияи масъала гирифта мешавад
    const tests = (d.tests || []).map(t => (t.hidden && !forTeacher)
      ? { i: t.i, hidden: true, tags: t.tags, status: t.status, ms: t.ms, explain: t.explain }
      : (t.status === 'AC' || t.input !== undefined) ? t
      : { ...t, input: cut(pd?.tests?.[t.i - 1]?.input ?? '', 4000), expected: cut(pd?.tests?.[t.i - 1]?.output ?? '', 4000) });
    return { verdict: g.verdict, passed: g.passed, total: g.total, failedTags: J(g.failed_tags) || [], finished_at: g.finished_at,
      compile: d.compile, compileExplain: d.compileExplain, detail: d.detail, notConfigured: d.notConfigured, steps: d.steps, tests };
  }
  function submissionView(s, viewer) {
    const forTeacher = viewer.role === 'teacher';
    const g = Q.get('SELECT * FROM gradings WHERE submission_id=?', s.id);
    const pd = pvData(s.problem_id, s.problem_version) || {};
    const cur = Q.get('SELECT current_version FROM problems WHERE id=?', s.problem_id);
    const comments = Q.all('SELECT c.id, c.line, c.text, c.created_at, u.name author FROM comments c JOIN users u ON u.id=c.author_id WHERE submission_id=? ORDER BY c.id', s.id);
    const user = Q.get('SELECT id, name, login FROM users WHERE id=?', s.user_id);
    return { id: s.id, number: s.number, problem_id: s.problem_id, problem_title: pd.title, problem_version: s.problem_version,
      version_is_old: cur && cur.current_version !== s.problem_version, lesson_id: s.lesson_id, assignment_id: s.assignment_id,
      code: s.code, status: s.status, created_at: s.created_at, grading: gradingView(g, forTeacher, pd), comments, user: forTeacher || viewer.id === s.user_id ? user : undefined };
  }
  function canSeeSub(u, s) { return s.user_id === u.id || teacherSeesUser(u, s.user_id); }

  // ───────── Навбати санҷиш ─────────
  const pending = []; let pumping = 0;
  function enqueue(id) { pending.push(id); pump(); }
  function pump() {
    while (pumping < 4 && pending.length) { pumping++; const id = pending.shift(); grade(id).catch(e => console.error('grade', e)).finally(() => { pumping--; pump(); }); }
  }
  async function grade(id) {
    const s = Q.get('SELECT * FROM submissions WHERE id=?', id);
    if (!s || s.status === 'done') return;
    Q.run("UPDATE submissions SET status='running' WHERE id=?", id);
    notifySub(s, 'running');
    const { data } = versionData(s.problem_id, s.problem_version);
    const r = await judgeAll(s.code, data.tests, { timeMs: data.timeMs, memoryMb: data.memoryMb });
    for (const t of r.tests || []) t.explain = explainRuntime({ status: t.status, signal: t.signal, exitCode: t.exitCode });
    const failedTags = r.verdict === 'SE' ? [] : [...new Set((r.tests || []).filter(t => t.status !== 'AC').flatMap(t => t.tags || []))];
    const details = slimDetails({ tests: r.tests, compile: r.compile, compileExplain: explainCompile(r.compile), detail: r.detail, notConfigured: r.notConfigured, steps: r.steps });
    Q.tx(() => {
      Q.run('INSERT OR REPLACE INTO gradings (submission_id, verdict, passed, total, failed_tags, details, driver) VALUES (?,?,?,?,?,?,?)',
        id, r.verdict, r.passed || 0, r.total || 0, JSON.stringify(failedTags), JSON.stringify(details), r.driver || null);
      Q.run("UPDATE submissions SET status='done' WHERE id=?", id);
    });
    notifySub(s, 'done');
  }
  function notifySub(s, state) {
    publish([s.user_id], { type: 'submission', id: s.id, problem_id: s.problem_id, state });
    for (const t of teachersOf(s.user_id)) publish([t.t], { type: 'activity', group_id: t.gid, user_id: s.user_id, lesson_id: s.lesson_id });
  }
  for (const r of Q.all("SELECT id FROM submissions WHERE status!='done' ORDER BY id")) enqueue(r.id);

  // ───────── Ҳисобҳои синф ─────────
  // Тартиби табиӣ: «Шогирд 2» пеш аз «Шогирд 10»
  const coll = new Intl.Collator(['tg', 'ru'], { numeric: true, sensitivity: 'base' });
  const byName = (a, b) => coll.compare(a.name, b.name) || a.id - b.id;
  function members(gid) {
    return Q.all("SELECT u.id, u.name, u.login FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND m.status='active'", gid).sort(byName);
  }
  function subsFor(uids, pid) {
    if (!uids.length) return [];
    return Q.all(`SELECT s.id, s.user_id, s.number, s.status, s.created_at, g.verdict, g.passed, g.total, g.failed_tags
      FROM submissions s LEFT JOIN gradings g ON g.submission_id=s.id
      WHERE s.problem_id=? AND s.user_id IN (${uids.map(() => '?').join(',')}) ORDER BY s.id`, pid, ...uids);
  }
  function problemCells(uids, pid) {
    const by = new Map(uids.map(u => [u, []]));
    for (const s of subsFor(uids, pid)) by.get(s.user_id).push(s);
    const cells = new Map();
    for (const [u, list] of by) {
      const counted = list.filter(s => s.verdict && s.verdict !== 'SE');
      const solvedSub = counted.find(s => s.verdict === 'AC');
      const last = list[list.length - 1];
      const lastGraded = [...counted].reverse()[0];
      cells.set(u, {
        attempts: counted.length, solved: !!solvedSub, solvedAt: solvedSub?.created_at, solvedAttempts: solvedSub ? counted.indexOf(solvedSub) + 1 : null,
        pending: !!last && last.status !== 'done', lastId: last?.id, lastGraded: lastGraded ? { id: lastGraded.id, verdict: lastGraded.verdict, passed: lastGraded.passed, total: lastGraded.total, failedTags: J(lastGraded.failed_tags) || [], created_at: lastGraded.created_at } : null,
        lastSE: last?.verdict === 'SE',
      });
    }
    return cells;
  }
  function lessonSteps(lid) {
    return Q.all('SELECT * FROM lesson_steps WHERE lesson_id=? ORDER BY position', lid).map(s => {
      const payload = J(s.payload) || {};
      let problem = null;
      if (s.problem_id) { const pr = Q.get('SELECT current_version v FROM problems WHERE id=? AND current_version>0', s.problem_id); const d = pr && pvData(s.problem_id, pr.v); if (d) problem = { id: s.problem_id, title: d.title, version: pr.v }; }
      return { id: s.id, position: s.position, kind: s.kind, title: s.title, payload, problem, skipped: !!s.skipped };
    });
  }
  function tagSummary(lesson, uids, steps) {
    const tags = new Map(); // tag -> {students:Set, subIds:[], problems:Set}
    let ce = { students: new Set(), subIds: [] };
    for (const st of steps.filter(s => s.kind === 'problem' && s.problem && !s.skipped)) {
      const cells = problemCells(uids, st.problem.id);
      for (const [u, c] of cells) {
        if (c.solved || !c.lastGraded) continue;
        if (c.lastGraded.verdict === 'CE') { ce.students.add(u); ce.subIds.push(c.lastGraded.id); continue; }
        for (const t of c.lastGraded.failedTags) {
          if (!tags.has(t)) tags.set(t, { students: new Set(), subIds: [], problems: new Set() });
          const e = tags.get(t); e.students.add(u); e.subIds.push(c.lastGraded.id); e.problems.add(st.problem.title);
        }
      }
    }
    const list = [...tags].map(([tag, e]) => ({ tag, count: e.students.size, subIds: e.subIds, problems: [...e.problems] })).sort((a, b) => b.count - a.count);
    return { tags: list, compileErrors: { count: ce.students.size, subIds: ce.subIds } };
  }
  function boardData(l) {
    const g = Q.get('SELECT * FROM groups WHERE id=?', l.group_id);
    const ms = members(l.group_id); const uids = ms.map(m => m.id);
    const steps = lessonSteps(l.id);
    const cols = steps.map(st => {
      if (st.kind === 'problem' && st.problem) return { stepId: st.id, cells: Object.fromEntries(problemCells(uids, st.problem.id)) };
      const rs = Q.all('SELECT user_id, answer, correct, created_at FROM step_responses WHERE step_id=?', st.id);
      return { stepId: st.id, cells: Object.fromEntries(rs.map(r => [r.user_id, { answered: true, answer: r.answer, correct: r.correct, at: r.created_at }])) };
    });
    const help = Q.all("SELECT h.*, u.name FROM help_requests h JOIN users u ON u.id=h.user_id WHERE h.group_id=? AND h.status!='done' ORDER BY h.created_at", l.group_id);
    return { lesson: l, group: { id: g.id, name: g.name }, students: ms, steps, cols, summary: tagSummary(l, uids, steps), help, helpCount: help.length };
  }
  function lessonReport(l) {
    const ms = members(l.group_id); const uids = ms.map(m => m.id);
    const name = Object.fromEntries(ms.map(m => [m.id, m.name]));
    const steps = lessonSteps(l.id).filter(s => s.kind === 'problem' && s.problem);
    const problems = steps.map(st => {
      const all = subsFor(uids, st.problem.id).filter(s => s.verdict && s.verdict !== 'SE');
      const cells = problemCells(uids, st.problem.id);
      const attempted = [...cells.values()].filter(c => c.attempts > 0).length;
      const solved = [...cells.values()].filter(c => c.solved).length;
      const stuck = [...cells].filter(([, c]) => c.attempts > 0 && !c.solved).map(([u]) => u);
      return { stepId: st.id, problem: st.problem, participants: uids.length, attempted, solved, stuck: stuck.length,
        attempts: all.length, failed: all.filter(s => s.verdict !== 'AC').length,
        subIds: { all: all.map(s => s.id), failed: all.filter(s => s.verdict !== 'AC').map(s => s.id), stuck: all.filter(s => stuck.includes(s.user_id)).map(s => s.id), solved: all.filter(s => s.verdict === 'AC').map(s => s.id) } };
    });
    const hardest = [...problems].filter(p => p.attempted > 0).sort((a, b) => (b.stuck / Math.max(1, b.attempted)) - (a.stuck / Math.max(1, a.attempted)) || b.failed - a.failed)[0] || null;
    // кӣ ҳанӯз ёрӣ мехоҳад
    const need = new Map();
    for (const h of Q.all("SELECT * FROM help_requests WHERE group_id=? AND status!='done'", l.group_id)) {
      if (!need.has(h.user_id)) need.set(h.user_id, { user: { id: h.user_id, name: name[h.user_id] }, reasons: [], subIds: [] });
      need.get(h.user_id).reasons.push(`дархости ёрӣ: «${h.question}»`); if (h.submission_id) need.get(h.user_id).subIds.push(h.submission_id);
    }
    for (const p of problems) for (const id of p.subIds.stuck) {
      const s = Q.get('SELECT user_id FROM submissions WHERE id=?', id);
      if (!need.has(s.user_id)) need.set(s.user_id, { user: { id: s.user_id, name: name[s.user_id] }, reasons: [], subIds: [] });
      const e = need.get(s.user_id); const r = `«${p.problem.title}» ҳал нашуд`; if (!e.reasons.includes(r)) e.reasons.push(r); e.subIds.push(id);
    }
    const summ = tagSummary(l, uids, lessonSteps(l.id));
    const topTag = summ.tags[0] || null;
    let repeat = null;
    if (topTag) {
      const practice = Q.all('SELECT id, practice_tags, current_version FROM problems WHERE current_version>0').filter(p => (J(p.practice_tags) || []).includes(topTag.tag))
        .map(p => ({ id: p.id, title: pvData(p.id, p.current_version).title }));
      const topic = TOPICS.find(t => t.key === l.topic)?.title || l.topic;
      repeat = { topic, tag: topTag.tag, count: topTag.count, subIds: topTag.subIds, practice };
    } else if (hardest && hardest.stuck > 0) {
      repeat = { topic: TOPICS.find(t => t.key === l.topic)?.title || l.topic, tag: null, count: hardest.stuck, subIds: hardest.subIds.stuck, practice: [] };
    }
    return { lesson: l, problems, hardest, needHelp: [...need.values()], repeat, summary: summ, students: ms.length };
  }

  // ───────── Хона барои шогирд ─────────
  function studentHome(u) {
    const groups = Q.all("SELECT g.id, g.name, g.lesson_time, m.status FROM group_members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=?", u.id);
    const active = groups.filter(g => g.status === 'active').map(g => g.id);
    const today = dushanbeDate();
    let todayLesson = null;
    if (active.length) {
      const ph = active.map(() => '?').join(',');
      const l = Q.get(`SELECT * FROM lessons WHERE group_id IN (${ph}) AND status='live' ORDER BY started_at DESC LIMIT 1`, ...active)
        || Q.all(`SELECT * FROM lessons WHERE group_id IN (${ph}) AND status!='finished' ORDER BY scheduled_at`, ...active).find(x => dushanbeDate(x.scheduled_at) >= today);
      if (l) {
        const steps = lessonSteps(l.id).filter(s => !s.skipped);
        const solved = solvedSet(u.id);
        const done = steps.map(s => s.kind === 'problem' ? (s.problem && solved.has(s.problem.id)) : !!Q.get('SELECT 1 FROM step_responses WHERE step_id=? AND user_id=?', s.id, u.id));
        const cur = done.findIndex(d => !d);
        const ls = lessonSets(l);
        const cnt = ids => ({ total: ids.length, solved: ids.filter(id => solved.has(id)).length });
        const ex = l.kind === 'exam' ? examRow(l.id, u.id) : null;
        todayLesson = { ...l, opened: isOpen(l), isToday: dushanbeDate(l.scheduled_at) === today,
          steps: steps.map((s, i) => ({ id: s.id, title: s.problem?.title || s.title, kind: s.kind, done: done[i] })), currentStep: cur < 0 ? null : cur + 1,
          sets: { class: cnt(ls.class), home: cnt(ls.home), extra: cnt(ls.extra) },
          exam: ex ? { accepted: !!ex.accepted_at, finished: !!ex.finished_at, blocked: !!ex.blocked } : undefined };
      }
    }
    const lastDraft = Q.get('SELECT d.problem_id, d.updated_at FROM drafts d WHERE d.user_id=? ORDER BY d.updated_at DESC LIMIT 1', u.id);
    let cont = null;
    if (lastDraft) {
      const pp = publicProblem(lastDraft.problem_id);
      const last = Q.get('SELECT s.number, g.verdict FROM submissions s LEFT JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND s.problem_id=? ORDER BY s.id DESC LIMIT 1', u.id, lastDraft.problem_id);
      cont = { problem_id: pp.id, title: pp.title, topic: TOPICS.find(t => t.key === pp.topic)?.title, updated_at: lastDraft.updated_at, last };
    }
    const asg = active.length ? Q.all(`SELECT * FROM assignments WHERE group_id IN (${active.map(() => '?').join(',')}) ORDER BY due_at`, ...active) : [];
    const solved = solvedSet(u.id);
    const assignments = asg.map(a => ({ ...a, problems: assignmentStatus(a, u.id) }));
    const nearest = assignments.find(a => a.due_at >= new Date().toISOString() && a.problems.some(p => p.state !== 'submitted' && p.state !== 'late'))
      || assignments.find(a => a.due_at >= new Date().toISOString()) || null;
    const acc = studentAccess(u.id);
    const all = Q.all('SELECT id, topic FROM problems WHERE current_version>0 ORDER BY position');
    const inPlan = all.filter(p => acc.plan.has(p.id) && !acc.exam.has(p.id));
    const openList = inPlan.filter(p => acc.open.has(p.id));
    // Пешрафт танҳо аз рӯи масъалаҳои кушодашуда (рӯзҳои пӯшида ҳисоб намешаванд)
    const progress = TOPICS.map(t => { const ps = openList.filter(p => p.topic === t.key); return { topic: t.key, title: t.title, total: ps.length, solved: ps.filter(p => solved.has(p.id)).length }; }).filter(p => p.total > 0);
    // Вазифаҳои хонагии рӯзҳои кушода, ки ҳанӯз пурра иҷро нашудаанд (аз рӯзи навтарин)
    const homework = [];
    for (const gid of active) {
      let w = 0, d = 0;
      for (const l of Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', gid)) {
        if (d === 0 || d === 6) { w++; d = 0; } d++;
        if (l.kind === 'exam' || !isOpen(l)) continue;
        const h = lessonSets(l).home; const n = h.filter(id => solved.has(id)).length;
        if (h.length && n < h.length) homework.push({ lesson_id: l.id, title: l.title, week: w, day: d, scheduled_at: l.scheduled_at, total: h.length, solved: n });
      }
    }
    homework.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
    const contOk = cont && acc.open.has(cont.problem_id) && !acc.exam.has(cont.problem_id);
    return { groups, todayLesson, continue: contOk ? cont : null, nearestAssignment: nearest, assignments, homework: homework.slice(0, 3), progress, recommendation: recommend(u.id, solved, openList) };
  }
  function recommend(uid, solved, all) {
    const failed = Q.all(`SELECT g.failed_tags, s.problem_id FROM submissions s JOIN gradings g ON g.submission_id=s.id
      WHERE s.user_id=? AND g.verdict NOT IN ('AC','SE','CE') ORDER BY s.id DESC LIMIT 50`, uid);
    const allowed = new Set(all.map(p => p.id));
    const practice = Q.all('SELECT id, practice_tags, current_version FROM problems WHERE current_version>0').filter(p => allowed.has(p.id));
    for (const f of failed) for (const tag of J(f.failed_tags) || []) {
      const p = practice.find(p => (J(p.practice_tags) || []).includes(tag) && !solved.has(p.id) && p.id !== f.problem_id);
      if (p) {
        const src = publicProblem(f.problem_id).title;
        return { problem_id: p.id, title: publicProblem(p.id).title, reason: `Барои такрори ҳолати «${tag}» ин масъаларо ҳал кун — дар «${src}» тести «${tag}» нагузашт.` };
      }
    }
    for (const t of TOPICS) {
      const next = all.find(p => p.topic === t.key && !solved.has(p.id));
      if (next) { const ps = all.filter(p => p.topic === t.key); return { problem_id: next.id, title: publicProblem(next.id).title, reason: `Дар мавзӯи «${t.title}» ${ps.filter(p => solved.has(p.id)).length} аз ${ps.length} масъала ҳал шуд — ин масъалаи навбатии ҳамин мавзӯъ аст.` }; }
    }
    return null;
  }
  function assignmentStatus(a, uid) {
    return (J(a.problem_ids) || []).map(pid => {
      const first = Q.get("SELECT MIN(s.created_at) t FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND s.problem_id=? AND g.verdict='AC'", uid, pid).t;
      const tried = Q.get("SELECT COUNT(*) c FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND s.problem_id=? AND g.verdict!='SE'", uid, pid).c;
      const state = first ? (first <= a.due_at ? 'submitted' : 'late') : tried ? 'started' : 'not_started';
      let title; try { title = publicProblem(pid).title; } catch { title = '—'; }
      return { problem_id: pid, title, state, solved_at: first };
    });
  }

  // ───────── Проектор: танҳо маълумоти тозашуда ─────────
  function projectorContent(l, body) {
    if (body.kind === 'clear') return { kind: 'clear' };
    if (body.kind === 'example') {
      const pp = publicProblem(Number(body.problem_id));
      const ex = pp.examples[Number(body.index) || 0];
      if (!ex) throw bad('Мисол ёфт нашуд.');
      return { kind: 'example', title: pp.title, statement: pp.statement, example: { input: ex.input, output: ex.output, explain: ex.explain } };
    }
    if (body.kind === 'code') {
      const s = Q.get('SELECT * FROM submissions WHERE id=?', Number(body.submission_id));
      if (!s || !isMember(s.user_id, l.group_id)) throw bad('Кӯшиш ёфт нашуд.');
      const lines = s.code.split('\n'); const from = Math.max(1, Number(body.from) || 1); const to = Math.min(lines.length, Number(body.to) || lines.length);
      return { kind: 'code', title: body.title || 'Порчаи код', from, code: lines.slice(from - 1, to).join('\n') };
    }
    if (body.kind === 'votes') {
      const st = Q.get('SELECT * FROM lesson_steps WHERE id=? AND lesson_id=?', Number(body.step_id), l.id);
      if (!st) throw bad('Қадам ёфт нашуд.');
      return { kind: 'votes', step_id: st.id, ...votes(st) };
    }
    throw bad('Навъи номаълум.');
  }
  function votes(st) {
    const p = J(st.payload) || {};
    const rs = Q.all('SELECT answer FROM step_responses WHERE step_id=?', st.id);
    if (st.kind === 'quiz') {
      const counts = p.options.map((o, i) => ({ label: o, count: rs.filter(r => Number(r.answer) === i).length, correct: i === p.correct }));
      return { question: p.question, total: rs.length, options: counts };
    }
    const m = new Map();
    for (const r of rs) { const k = normalizeOutput(r.answer).trim().toLowerCase(); m.set(k, { label: r.answer.trim(), count: (m.get(k)?.count || 0) + 1 }); }
    return { question: p.question, total: rs.length, options: [...m.values()].sort((a, b) => b.count - a.count).slice(0, 8) };
  }

  // ───────── Масирҳо ─────────
  const routes = [];
  const R = (method, pattern, handler, opts = {}) => {
    const keys = []; const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, rx, keys, handler, ...opts });
  };
  const need = (u, role) => { if (!u) throw new HttpError(401, 'Аввал ворид шавед.'); if (role && u.role !== role) throw forbidden(); return u; };

  // Воридшавӣ
  R('POST', '/api/register', ({ body }) => {
    const name = String(body.name || '').trim(), login = String(body.login || '').trim().toLowerCase(), pw = String(body.password || '');
    if (name.length < 2) throw bad('Ном ва насабро нависед.');
    if (login.length < 3 || login.length > 32 || /\s/.test(login)) throw bad('Логин бояд аз 3 то 32 аломат бошад ва фосила надошта бошад. Ҳар гуна ҳарф (тоҷикӣ ё лотинӣ), рақам ва аломат мумкин аст.');
    if (pw.length < 8) throw bad('Парол бояд ҳадди ақал 8 аломат бошад (ҳар гуна ҳарф, рақам ё аломат).');
    if (PUBLIC_DEMO_PASSWORDS.has(pw)) throw bad('Ин парол ба ҳама маълум аст. Пароли дигар интихоб кунед.');
    if (Q.get('SELECT 1 FROM users WHERE login=?', login)) throw bad('Ин логин аллакай банд аст.');
    const id = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES (?,?,?,'student')", login, name, hashPassword(pw)).lastInsertRowid);
    const t = token(); Q.run('INSERT INTO sessions (token, user_id) VALUES (?,?)', t, id);
    return { cookie: t, user: { id, login, name, role: 'student' } };
  });
  // Ҳимоя аз тахмини парол: пас аз 8 хатои паёпай барои як логин (ё 40 аз як суроға) — 30/10 сония интизорӣ
  // байни кӯшишҳо. Қулф намешавад: корбари ҳақиқӣ ҳадди аксар 30 сония сабр мекунад.
  const fails = new Map();
  const ipOf = req => String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
  function throttled(keys) {
    const now = Date.now();
    for (const [k, free, gap] of keys) {
      const f = fails.get(k);
      if (f && now - f.first < 15 * 60000 && f.n >= free && now - f.last < gap) return Math.ceil((f.last + gap - now) / 1000);
    }
    return 0;
  }
  function noteFail(keys) {
    const now = Date.now();
    for (const [k] of keys) { const f = fails.get(k); if (!f || now - f.first >= 15 * 60000) fails.set(k, { n: 1, first: now, last: now }); else { f.n++; f.last = now; } }
    if (fails.size > 10000) for (const [k, f] of fails) if (now - f.first >= 15 * 60000) fails.delete(k);
  }
  R('POST', '/api/login', ({ body, req }) => {
    const login = String(body.login || '').trim().toLowerCase();
    const keys = [['l:' + login, 8, 30000], ['i:' + ipOf(req), 40, 10000]];
    const wait = throttled(keys);
    if (wait) throw new HttpError(429, `Пароли нодуруст бисёр ворид шуд. ${wait} сония сабр кунед ва боз кӯшиш кунед.`, { wait });
    const u = Q.get('SELECT * FROM users WHERE login=?', login);
    if (!u || !checkPassword(String(body.password || ''), u.pass_hash)) { noteFail(keys); throw bad('Логин ё парол нодуруст аст.'); }
    fails.delete('l:' + login);
    const weak = PUBLIC_DEMO_PASSWORDS.has(String(body.password)) ? 1 : 0;
    if (weak !== u.weak_pw) Q.run('UPDATE users SET weak_pw=? WHERE id=?', weak, u.id);
    const t = token(); Q.run('INSERT INTO sessions (token, user_id) VALUES (?,?)', t, u.id);
    return { cookie: t, user: pubUser({ ...u, weak_pw: weak }) };
  });
  R('POST', '/api/logout', ({ sid }) => { Q.run('DELETE FROM sessions WHERE token=?', sid || ''); return { cookie: '' }; });
  // Оё файли база дар диски доимӣ аст? (дар Render-и ройгон /data диски муваққатӣ аст)
  const onMountedDisk = () => { try { const dir = path.dirname(path.resolve(dbFile)); return fs.readFileSync('/proc/mounts', 'utf8').split('\n').some(l => { const mp = l.split(' ')[1]; return mp && mp !== '/' && (dir === mp || dir.startsWith(mp + '/')) && /^\/(data|var\/data|mnt)/.test(mp); }); } catch { return false; } };
  const storage = () => { const p = persistStatus(); return { ...p, ephemeral: p.mode !== 'postgres' && (p.mode === 'invalid' || (!!process.env.RENDER && !onMountedDisk())) }; };

  R('GET', '/api/me', ({ user }) => ({ user: pubUser(user) || null, judge: judgeStatus(), storage: user?.role === 'teacher' ? storage() : undefined }));
  R('GET', '/api/health', () => ({ ok: true, startedAt: STARTED_AT, build: buildId(), storage: storage(), judge: judgeStatus().ok }));
  // Профил: ном, логин ва паролро худи корбар иваз мекунад (пароли ҷорӣ лозим аст)
  R('PUT', '/api/me', ({ user, body, sid }) => {
    need(user);
    const row = Q.get('SELECT * FROM users WHERE id=?', user.id);
    if (!checkPassword(String(body.current_password || ''), row.pass_hash)) throw bad('Пароли ҷорӣ нодуруст аст.');
    const name = String(body.name ?? row.name).trim();
    const login = String(body.login ?? row.login).trim().toLowerCase();
    const pw = String(body.new_password || '');
    if (name.length < 2) throw bad('Ном ва насабро нависед.');
    if (login.length < 3 || login.length > 32 || /\s/.test(login)) throw bad('Логин бояд аз 3 то 32 аломат бошад ва фосила надошта бошад.');
    if (login !== row.login && Q.get('SELECT 1 FROM users WHERE login=?', login)) throw bad('Ин логин аллакай банд аст.');
    if (pw && pw.length < 8) throw bad('Пароли нав бояд ҳадди ақал 8 аломат бошад.');
    if (pw && PUBLIC_DEMO_PASSWORDS.has(pw)) throw bad('Ин парол ба ҳама маълум аст. Пароли дигар интихоб кунед.');
    const weak = pw ? 0 : row.weak_pw;
    Q.run('UPDATE users SET name=?, login=?, pass_hash=?, weak_pw=? WHERE id=?', name, login, pw ? hashPassword(pw) : row.pass_hash, weak, row.id);
    if (pw) Q.run('DELETE FROM sessions WHERE user_id=? AND token!=?', row.id, sid || '');
    return { user: pubUser({ id: row.id, login, name, role: row.role, weak_pw: weak }) };
  });
  R('GET', '/api/judge/status', () => ({ ...judgeStatus(), queue: queueDepth() }));

  // Шогирд: гурӯҳ
  R('POST', '/api/join', ({ user, body }) => {
    need(user, 'student');
    const g = Q.get('SELECT * FROM groups WHERE invite_code=?', String(body.code || '').trim().toUpperCase());
    if (!g) throw bad('Рамзи даъват нодуруст аст ё иваз шудааст. Аз устод рамзи навро пурсед.');
    const ex = Q.get('SELECT status FROM group_members WHERE group_id=? AND user_id=?', g.id, user.id);
    if (!ex) Q.run("INSERT INTO group_members (group_id, user_id, status) VALUES (?,?,'pending')", g.id, user.id);
    publish([g.teacher_id], { type: 'members', group_id: g.id });
    return { group: { id: g.id, name: g.name }, status: ex?.status || 'pending' };
  });
  R('GET', '/api/student/home', ({ user }) => studentHome(need(user, 'student')));

  // Устод: гурӯҳҳо
  // Огоҳиҳои устод: шогирдони блокшуда дар ҳамаи гурӯҳҳо (дар сарлавҳа ва саҳифаи асосӣ нишон дода мешаванд)
  R('GET', '/api/teacher/alerts', ({ user }) => {
    need(user, 'teacher');
    const blocked = Q.all(`SELECT v.user_id, u.name, u.login, v.lesson_id, l.title AS lesson_title, g.id AS group_id, g.name AS group_name, v.count, v.last_type, v.updated_at
      FROM exam_violations v JOIN lessons l ON l.id=v.lesson_id JOIN groups g ON g.id=l.group_id JOIN users u ON u.id=v.user_id
      WHERE g.teacher_id=? AND v.blocked=1 ORDER BY v.updated_at DESC`, user.id);
    return { blocked };
  });
  R('GET', '/api/groups', ({ user }) => {
    need(user, 'teacher');
    const today = dushanbeDate();
    return Q.all('SELECT * FROM groups WHERE teacher_id=? ORDER BY id', user.id).map(g => {
      const ls = Q.all('SELECT id, number, title, scheduled_at, status FROM lessons WHERE group_id=? ORDER BY scheduled_at', g.id);
      const live = ls.find(l => l.status === 'live');
      const next = ls.find(l => l.status !== 'finished' && dushanbeDate(l.scheduled_at) >= today);
      return { ...g, students: Q.get("SELECT COUNT(*) c FROM group_members WHERE group_id=? AND status='active'", g.id).c,
        pendingCount: Q.get("SELECT COUNT(*) c FROM group_members WHERE group_id=? AND status='pending'", g.id).c,
        lessonsTotal: ls.length, lessonsDone: ls.filter(l => l.status === 'finished').length, live, next,
        hasLessonToday: !!ls.find(l => dushanbeDate(l.scheduled_at) === today), helpOpen: Q.get("SELECT COUNT(*) c FROM help_requests WHERE group_id=? AND status!='done'", g.id).c,
        blocked: Q.get('SELECT COUNT(*) c FROM exam_violations v JOIN lessons l ON l.id=v.lesson_id WHERE l.group_id=? AND v.blocked=1', g.id).c };
    });
  });
  R('POST', '/api/groups', ({ user, body }) => {
    need(user, 'teacher');
    const name = String(body.name || '').trim(); if (!name) throw bad('Номи гурӯҳро нависед.');
    const start = /^\d{4}-\d{2}-\d{2}$/.test(body.start_date) ? body.start_date : dushanbeDate();
    const time = /^\d{2}:\d{2}$/.test(body.lesson_time) ? body.lesson_time : '14:00';
    const wd = String(body.weekdays || '1,2,3,4,5,6').split(',').map(Number).filter(n => n >= 1 && n <= 7);
    if (!wd.length) throw bad('Ҳадди ақал як рӯзи ҳафтаро интихоб кунед.');
    const count = Math.min(60, Math.max(1, Number(body.count) || 24));
    const id = Q.tx(() => createGroup(Q, { teacherId: user.id, name, startDate: start, lessonTime: time, weekdays: wd.join(','), count }));
    return { id };
  });
  R('GET', '/api/groups/:id', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    const g = Q.get('SELECT * FROM groups WHERE id=?', gid);
    const mem = Q.all('SELECT u.id, u.name, u.login, m.status, m.created_at FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=?', gid)
      .sort((a, b) => a.status.localeCompare(b.status) || byName(a, b)).map(m => {
        const exams = Q.all('SELECT v.lesson_id, l.title, v.count, v.blocked, v.finished_at FROM exam_violations v JOIN lessons l ON l.id=v.lesson_id WHERE v.user_id=? AND l.group_id=? AND (v.blocked=1 OR v.count>0) ORDER BY l.scheduled_at', m.id, gid);
        return { ...m, exams, exam_blocked: exams.filter(e => e.blocked) };
      });
    const lessons = Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at', gid).map(l => ({ ...l, steps: Q.get('SELECT COUNT(*) c FROM lesson_steps WHERE lesson_id=?', l.id).c, homework_problem_ids: J(l.homework_problem_ids) }));
    const asg = Q.all('SELECT * FROM assignments WHERE group_id=? ORDER BY due_at', gid).map(a => {
      const active = mem.filter(m => m.status === 'active');
      return { ...a, problem_ids: J(a.problem_ids), students: active.map(m => ({ id: m.id, name: m.name, problems: assignmentStatus(a, m.id) })) };
    });
    return { group: g, members: mem, lessons, assignments: asg };
  });
  R('PATCH', '/api/groups/:id', ({ user, params, body }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    if ('lock_days' in body) Q.run('UPDATE groups SET lock_days=? WHERE id=?', body.lock_days ? 1 : 0, gid);
    if (body.name) Q.run('UPDATE groups SET name=? WHERE id=?', String(body.name).trim(), gid);
    publish(groupAudience(gid), { type: 'lesson', group_id: gid }); return { ok: true };
  });
  R('POST', '/api/groups/:id/invite', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    let code; do { code = inviteCode(); } while (Q.get('SELECT 1 FROM groups WHERE invite_code=?', code));
    Q.run('UPDATE groups SET invite_code=? WHERE id=?', code, gid); return { invite_code: code };
  });
  R('POST', '/api/groups/:id/members', ({ user, params, body }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    let uid = Number(body.user_id);
    if (!uid && body.login) { const s = Q.get("SELECT id FROM users WHERE login=? AND role='student'", String(body.login).trim().toLowerCase()); if (!s) throw bad('Шогирд бо ин логин ёфт нашуд. Аввал ӯ бояд худаш сабти ном кунад.'); uid = s.id; }
    if (!Q.get("SELECT 1 FROM users WHERE id=? AND role='student'", uid)) throw bad('Шогирд ёфт нашуд.');
    Q.run("INSERT INTO group_members (group_id, user_id, status) VALUES (?,?,'active') ON CONFLICT(group_id,user_id) DO UPDATE SET status='active'", gid, uid);
    publish([uid], { type: 'membership', group_id: gid });
    return { ok: true };
  });
  // Пароли муваққатӣ барои шогирде, ки паролашро фаромӯш кард
  R('POST', '/api/groups/:id/members/:uid/password', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id), uid = Number(params.uid);
    if (!ownsGroup(user, gid) || !Q.get('SELECT 1 FROM group_members WHERE group_id=? AND user_id=?', gid, uid)) throw forbidden();
    const A = 'abcdefghkmnpqrstuvwxyz23456789'; let pw = ''; for (let i = 0; i < 8; i++) pw += A[Math.floor(Math.random() * A.length)];
    Q.run('UPDATE users SET pass_hash=?, weak_pw=0 WHERE id=?', hashPassword(pw), uid);
    Q.run('DELETE FROM sessions WHERE user_id=?', uid);
    return { password: pw, login: Q.get('SELECT login FROM users WHERE id=?', uid).login };
  });
  // Пешрафти пурраи як шогирд
  R('GET', '/api/groups/:id/students/:uid', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id), uid = Number(params.uid);
    if (!ownsGroup(user, gid) || !isMember(uid, gid)) throw forbidden();
    const st = Q.get('SELECT id, name, login, created_at FROM users WHERE id=?', uid);
    const rows = Q.all(`SELECT s.problem_id pid, COUNT(*) n, SUM(g.verdict='AC') ac, MIN(CASE WHEN g.verdict='AC' THEN s.created_at END) solved_at, MAX(s.id) last_id
      FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND g.verdict!='SE' GROUP BY s.problem_id`, uid);
    const by = new Map(rows.map(r => [r.pid, r]));
    // Як сатр барои масъала; масъалаи кӯшишнашуда — танҳо ном (ҷавоб сабук мемонад)
    const row = pid => {
      const r = by.get(pid); if (!r) return { id: pid, title: titleOf(pid) };
      const last = Q.get('SELECT verdict, passed, total, failed_tags FROM gradings WHERE submission_id=?', r.last_id);
      return { id: pid, title: titleOf(pid), attempts: r.n, solved: !!r.ac, solved_at: r.solved_at || null, last_id: r.last_id, last: last ? { ...last, failed_tags: J(last.failed_tags) } : null };
    };
    // Пешрафт аз рӯи рӯзҳои курс (ҳафта → рӯз → синфӣ/хонагӣ/иловагӣ)
    const inPlan = new Set();
    let w = 0, d = 0;
    const days = Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', gid).map(l => {
      if (d === 0 || d === 6) { w++; d = 0; } d++;
      const s = lessonSets(l);
      [...s.class, ...s.home, ...s.extra].forEach(id => inPlan.add(id));
      const e = l.kind === 'exam' ? examRow(l.id, uid) : null;
      return { id: l.id, week: w, day: d, kind: l.kind, title: l.title, scheduled_at: l.scheduled_at, opened: isOpen(l), status: l.status,
        exam: e ? { accepted: !!e.accepted_at, finished: !!e.finished_at, blocked: !!e.blocked, count: e.count } : undefined,
        sets: { class: s.class.map(row), home: s.home.map(row), extra: s.extra.map(row) } };
    });
    const other = rows.filter(r => !inPlan.has(r.pid)).map(r => row(r.pid));
    const help = Q.all('SELECT question, status, created_at FROM help_requests WHERE user_id=? AND group_id=? ORDER BY id DESC LIMIT 20', uid, gid);
    const asg = Q.all('SELECT * FROM assignments WHERE group_id=? ORDER BY due_at', gid).map(a => ({ id: a.id, title: a.title, due_at: a.due_at, problems: assignmentStatus(a, uid) }));
    return { student: st, days, other, help, assignments: asg };
  });
  // Натиҷаҳои гурӯҳ барои Excel (CSV)
  R('GET', '/api/groups/:id/export.csv', ({ user, params, res }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    const g = Q.get('SELECT name FROM groups WHERE id=?', gid);
    const ps = Q.all('SELECT id, topic, current_version v FROM problems WHERE current_version>0 ORDER BY position, id').filter(p => !pvData(p.id, p.v).lessonOnly);
    const esc = v => { const t = String(v ?? ''); return /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const head = ['Шогирд', 'Логин', 'Ҳал шуд (ҳамагӣ)', ...TOPICS.map(t => t.title), 'Кӯшишҳо', ...ps.map(p => publicProblem(p.id).title)];
    const lines = [head.map(esc).join(';')];
    for (const m of members(gid)) {
      const solved = solvedSet(m.id);
      const att = Q.get("SELECT COUNT(*) c FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND g.verdict!='SE'", m.id).c;
      lines.push([m.name, m.login, ps.filter(p => solved.has(p.id)).length, ...TOPICS.map(t => `${ps.filter(p => p.topic === t.key && solved.has(p.id)).length}/${ps.filter(p => p.topic === t.key).length}`), att,
        ...ps.map(p => solved.has(p.id) ? 'ҳал шуд' : (Q.get('SELECT 1 FROM submissions WHERE user_id=? AND problem_id=?', m.id, p.id) ? 'кӯшиш' : ''))].map(esc).join(';'));
    }
    const name = encodeURIComponent(`${g.name} — натиҷаҳо ${dushanbeDate()}.csv`);
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename*=UTF-8''${name}` });
    res.end('﻿' + lines.join('\r\n'));
  }, { raw: true });
  // Нест кардани гурӯҳ
  R('DELETE', '/api/groups/:id', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    const aud = groupAudience(gid);
    Q.tx(() => {
      Q.run('DELETE FROM help_requests WHERE group_id=?', gid);
      Q.run('UPDATE submissions SET lesson_id=NULL WHERE lesson_id IN (SELECT id FROM lessons WHERE group_id=?)', gid);
      Q.run('UPDATE submissions SET assignment_id=NULL WHERE assignment_id IN (SELECT id FROM assignments WHERE group_id=?)', gid);
      Q.run('DELETE FROM groups WHERE id=?', gid);
    });
    publish(aud, { type: 'membership', group_id: gid }); return { ok: true };
  });
  R('DELETE', '/api/groups/:id/members/:uid', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    Q.run('DELETE FROM group_members WHERE group_id=? AND user_id=?', gid, Number(params.uid)); publish([Number(params.uid)], { type: 'membership', group_id: gid }); return { ok: true };
  });

  // Дарсҳо
  R('GET', '/api/lessons/:id', ({ user, params }) => {
    need(user); const l = lessonFor(user, Number(params.id));
    if (isLocked(user, l)) throw forbidden('Ин рӯз пӯшида аст — устод онро мекушояд.');
    const steps = lessonSteps(l.id).filter(s => user.role === 'teacher' || !s.skipped).map(s => {
      if (user.role === 'teacher') return s;
      const p = { ...s.payload }; delete p.correct; delete p.explain;
      const resp = Q.get('SELECT answer, correct, created_at FROM step_responses WHERE step_id=? AND user_id=?', s.id, user.id);
      let reveal = null;
      if (resp && s.kind === 'quiz') reveal = { correct: s.payload.correct, explain: s.payload.explain };
      if (resp && s.kind === 'predict') { const o = Q.get('SELECT * FROM predict_outputs WHERE step_id=?', s.id); reveal = o ? { status: o.status, stdout: o.stdout } : null; }
      return { ...s, payload: p, response: resp, reveal, solved: s.problem ? solvedSet(user.id).has(s.problem.id) : undefined };
    });
    const g = Q.get('SELECT id, name FROM groups WHERE id=?', l.group_id);
    return { lesson: l, group: g, steps };
  });
  const lessonEvent = l => publish(groupAudience(l.group_id), { type: 'lesson', lesson_id: l.id, group_id: l.group_id });
  R('POST', '/api/lessons/:id/start', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    Q.run("UPDATE lessons SET status='finished', ended_at=COALESCE(ended_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE group_id=? AND status='live' AND id!=?", l.group_id, l.id);
    Q.run("UPDATE lessons SET status='live', opened=1, opened_at=COALESCE(opened_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')), started_at=COALESCE(started_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')), ended_at=NULL WHERE id=?", l.id);
    lessonEvent(l); return { ok: true };
  });
  R('POST', '/api/lessons/:id/finish', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    Q.run("UPDATE lessons SET status='finished', ended_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", l.id);
    lessonEvent(l); return { ok: true };
  });
  R('PATCH', '/api/lessons/:id', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    if (Array.isArray(body.order)) Q.tx(() => body.order.forEach((sid, i) => Q.run('UPDATE lesson_steps SET position=? WHERE id=? AND lesson_id=?', i + 1, Number(sid), l.id)));
    if (body.title) Q.run('UPDATE lessons SET title=? WHERE id=?', String(body.title), l.id);
    if (Array.isArray(body.homework_problem_ids)) Q.run('UPDATE lessons SET homework_problem_ids=? WHERE id=?', JSON.stringify(body.homework_problem_ids.map(Number)), l.id);
    lessonEvent(l); return { ok: true };
  });
  R('POST', '/api/steps/:id/skip', ({ user, params, body }) => {
    need(user, 'teacher'); const st = Q.get('SELECT * FROM lesson_steps WHERE id=?', Number(params.id)); if (!st) throw notFound();
    const l = lessonFor(user, st.lesson_id);
    Q.run('UPDATE lesson_steps SET skipped=? WHERE id=?', body.skipped ? 1 : 0, st.id); lessonEvent(l); return { ok: true };
  });
  R('POST', '/api/steps/:id/respond', async ({ user, params, body }) => {
    need(user, 'student'); const st = Q.get('SELECT * FROM lesson_steps WHERE id=?', Number(params.id)); if (!st) throw notFound();
    const l = lessonFor(user, st.lesson_id); const p = J(st.payload) || {};
    const answer = String(body.answer ?? '').slice(0, 500);
    if (!answer.trim()) throw bad('Аввал ҷавоб нависед.');
    if (Q.get('SELECT 1 FROM step_responses WHERE step_id=? AND user_id=?', st.id, user.id)) throw bad('Шумо аллакай ҷавоб додаед.');
    let correct = null, reveal = null;
    if (st.kind === 'quiz') { correct = Number(answer) === p.correct ? 1 : 0; reveal = { correct: p.correct, explain: p.explain }; }
    if (st.kind === 'predict') {
      let o = Q.get('SELECT * FROM predict_outputs WHERE step_id=?', st.id);
      if (!o) {
        const r = await runOnce(p.code, p.input || '');
        if (r.status === 'SE') throw new HttpError(503, 'Санҷанда ҳоло ҷавоб намедиҳад, бинобар ин натиҷаи воқеиро гирифта натавонистем. Ҷавоби шумо сабт нашуд — баъдтар дубора фиристед.', { notConfigured: r.notConfigured, steps: r.steps });
        Q.run('INSERT OR REPLACE INTO predict_outputs (step_id, status, stdout, detail) VALUES (?,?,?,?)', st.id, r.status, r.stdout ?? '', r.compile || r.detail || null);
        o = Q.get('SELECT * FROM predict_outputs WHERE step_id=?', st.id);
      }
      const norm = s => normalizeOutput(s).trim().replace(/^["«]|["»]$/g, '').toLowerCase();
      correct = norm(answer) === norm(o.stdout) ? 1 : 0;
      reveal = { status: o.status, stdout: o.stdout };
    }
    Q.run('INSERT INTO step_responses (step_id, user_id, answer, correct) VALUES (?,?,?,?)', st.id, user.id, answer, correct);
    publish([Q.get('SELECT teacher_id FROM groups WHERE id=?', l.group_id).teacher_id], { type: 'activity', group_id: l.group_id, lesson_id: l.id });
    return { answer, correct, reveal };
  });
  R('GET', '/api/lessons/:id/board', ({ user, params }) => { need(user, 'teacher'); return boardData(lessonFor(user, Number(params.id))); });
  R('GET', '/api/lessons/:id/report', ({ user, params }) => { need(user, 'teacher'); return lessonReport(lessonFor(user, Number(params.id))); });
  R('GET', '/api/lessons/:id/votes/:step', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const st = Q.get('SELECT * FROM lesson_steps WHERE id=? AND lesson_id=?', Number(params.step), l.id); if (!st) throw notFound();
    const rs = Q.all('SELECT r.answer, r.correct, u.name FROM step_responses r JOIN users u ON u.id=r.user_id WHERE step_id=?', st.id);
    return { ...votes(st), responses: rs };
  });
  R('POST', '/api/lessons/:id/projector/preview', ({ user, params, body }) => { need(user, 'teacher'); return projectorContent(lessonFor(user, Number(params.id)), body); });
  R('POST', '/api/lessons/:id/projector', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const c = projectorContent(l, body);
    Q.run("INSERT INTO projector_state (lesson_id, content, updated_at) VALUES (?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(lesson_id) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at", l.id, JSON.stringify(c));
    publish([user.id], { type: 'projector', lesson_id: l.id }); return c;
  });
  R('GET', '/api/lessons/:id/projector', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const r = Q.get('SELECT content FROM projector_state WHERE lesson_id=?', l.id);
    let content = r ? J(r.content) : { kind: 'clear' };
    if (content.kind === 'votes') { const st = Q.get('SELECT * FROM lesson_steps WHERE id=?', content.step_id); if (st) content = { kind: 'votes', step_id: st.id, ...votes(st) }; }
    return { lesson: { id: l.id, title: l.title }, content };
  });

  // ───── Нақшаи курс: ҳафта → рӯз → маҷмӯаҳо (синфӣ, хонагӣ, иловагӣ) ─────
  // Рӯзро танҳо устод мекушояд (ё бо оғози дарс). То кушодан шогирд ба он даромада наметавонад.
  // Рӯз танҳо бо қарори устод кушода аст («Рӯзро кушо» ё оғози «Дарси зинда»). «Рӯзро пӯш» ҳамеша мепӯшад.
  const isOpen = l => !!l.opened;
  const isLocked = (u, l) => u.role !== 'teacher' && !isOpen(l);
  // Масъалаҳое, ки шогирд дида метавонад: аз рӯзҳои кушода ва вазифаҳои хонагии гурӯҳҳояш
  function studentAccess(uid) {
    const open = new Set(), exam = new Map(), plan = new Set();
    for (const { group_id } of Q.all("SELECT group_id FROM group_members WHERE user_id=? AND status='active'", uid)) {
      for (const l of Q.all('SELECT * FROM lessons WHERE group_id=?', group_id)) {
        const s = lessonSets(l); const ids = [...s.class, ...s.home, ...s.extra];
        ids.forEach(id => plan.add(id));
        if (l.kind === 'exam') ids.forEach(id => exam.set(id, l.id));
        if (isOpen(l)) ids.forEach(id => open.add(id));
      }
      for (const a of Q.all('SELECT problem_ids FROM assignments WHERE group_id=?', group_id)) (J(a.problem_ids) || []).forEach(id => open.add(id));
    }
    return { open, exam, plan };
  }
  const examRow = (lid, uid) => Q.get('SELECT count, blocked, last_type, accepted_at, finished_at FROM exam_violations WHERE lesson_id=? AND user_id=?', lid, uid) || { count: 0, blocked: 0, accepted_at: null, finished_at: null };
  function assertProblemAccess(u, pid) {
    if (u.role === 'teacher') return;
    const { open, exam } = studentAccess(u.id);
    if (!open.has(pid)) throw forbidden('Ин масъала ҳанӯз кушода нашудааст — устод рӯзро мекушояд.');
    const lid = exam.get(pid);
    if (lid) {
      const e = examRow(lid, u.id);
      if (e.blocked) throw new HttpError(403, 'Шумо аз ин имтиҳон блок шудед (3 вайронкунӣ). Ба устод муроҷиат кунед.', { blocked: true });
      if (!e.accepted_at) throw new HttpError(403, 'Аввал шартҳои имтиҳонро хонед ва қабул кунед.', { needAccept: true, lesson_id: lid });
      if (e.finished_at) throw new HttpError(403, 'Шумо ин имтиҳонро тамом кардед.', { finished: true, lesson_id: lid });
    }
  }
  function lessonSets(l) {
    const cls = Q.all("SELECT problem_id FROM lesson_steps WHERE lesson_id=? AND kind='problem' AND skipped=0 AND problem_id IS NOT NULL ORDER BY position", l.id).map(r => r.problem_id);
    return { class: [...new Set(cls)], home: J(l.homework_problem_ids) || [], extra: J(l.extra_problem_ids) || [] };
  }
  const titleOf = pid => { try { return publicProblem(pid).title; } catch { return '—'; } };
  function courseFor(u, gid) {
    const g = Q.get('SELECT * FROM groups WHERE id=?', gid);
    if (!g) throw notFound('Гурӯҳ ёфт нашуд.');
    if (u.role === 'teacher' ? !ownsGroup(u, gid) : !isMember(u.id, gid)) throw forbidden('Шумо дар ин гурӯҳ нестед.');
    const today = dushanbeDate();
    const solved = u.role === 'student' ? solvedSet(u.id) : null;
    const uids = u.role === 'teacher' ? members(gid).map(m => m.id) : [];
    const solvedBy = u.role === 'teacher' ? new Map(uids.map(id => [id, solvedSet(id)])) : null;
    const ls = Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', gid);
    let w = 0, d = 0;
    const days = ls.map(l => {
      if (d === 0 || d === 6) { w++; d = 0; } d++;
      const sets = lessonSets(l);
      const count = ids => u.role === 'student'
        ? { total: ids.length, solved: ids.filter(id => solved.has(id)).length }
        : { total: ids.length, complete: uids.filter(id => ids.length && ids.every(p => solvedBy.get(id).has(p))).length, students: uids.length };
      const date = dushanbeDate(l.scheduled_at);
      const locked = isLocked(u, l);
      const all = [...sets.class, ...sets.home, ...sets.extra];
      const state = locked ? 'locked' : u.role === 'teacher' && !isOpen(l) ? 'closed' : l.status === 'live' ? 'live' : date === today ? 'today'
        : (u.role === 'student' && all.length && all.every(id => solved.has(id))) || (u.role === 'teacher' && l.status === 'finished') ? 'done'
        : date < today ? 'progress' : 'planned';
      const examStat = u.role === 'teacher' && l.kind === 'exam'
        ? Q.get('SELECT SUM(blocked) blocked, SUM(CASE WHEN count>0 AND blocked=0 THEN 1 ELSE 0 END) warned, SUM(CASE WHEN accepted_at IS NOT NULL THEN 1 ELSE 0 END) entered FROM exam_violations WHERE lesson_id=?', l.id) : null;
      return { id: l.id, number: l.number, week: w, day: d, kind: l.kind, title: l.title, topic: l.topic, scheduled_at: l.scheduled_at, status: l.status, state, locked, opened: isOpen(l),
        exam: examStat ? { blocked: examStat.blocked || 0, warned: examStat.warned || 0, entered: examStat.entered || 0 } : undefined,
        my: u.role === 'student' && l.kind === 'exam' ? (e => ({ finished: !!e.finished_at, blocked: !!e.blocked }))(examRow(l.id, u.id)) : undefined,
        sets: { class: count(sets.class), home: count(sets.home), extra: count(sets.extra) } };
    });
    const weeks = [];
    for (const x of days) { if (!weeks[x.week - 1]) weeks[x.week - 1] = { week: x.week, days: [] }; weeks[x.week - 1].days.push(x); }
    return { group: { id: g.id, name: g.name, lesson_time: g.lesson_time, lock_days: !!g.lock_days }, weeks, role: u.role };
  }
  R('GET', '/api/groups/:id/course', ({ user, params }) => courseFor(need(user), Number(params.id)));
  R('GET', '/api/course', ({ user }) => {
    need(user, 'student');
    const g = Q.get("SELECT group_id FROM group_members WHERE user_id=? AND status='active' ORDER BY created_at LIMIT 1", user.id);
    if (!g) throw notFound('Шумо ҳанӯз дар гурӯҳ нестед. Аз саҳифаи асосӣ ба гурӯҳ ҳамроҳ шавед.');
    return courseFor(user, g.group_id);
  });
  R('GET', '/api/lessons/:id/sets', ({ user, params }) => {
    need(user); const l = lessonFor(user, Number(params.id));
    if (isLocked(user, l)) throw forbidden('Ин рӯз ҳанӯз кушода нашудааст — устод онро мекушояд.');
    let exam;
    if (l.kind === 'exam' && user.role === 'student') {
      const e = examRow(l.id, user.id);
      if (e.blocked) throw new HttpError(403, 'Шумо аз ин имтиҳон блок шудед (3 вайронкунӣ). Танҳо устод метавонад шуморо боз кунад.', { blocked: true });
      exam = { count: e.count, max: 3, accepted: !!e.accepted_at, finished: !!e.finished_at };
    }
    const sets = lessonSets(l);
    const solved = user.role === 'student' ? solvedSet(user.id) : new Set();
    const mk = ids => ids.map(pid => ({ id: pid, title: titleOf(pid), solved: solved.has(pid) }));
    return { lesson: { id: l.id, number: l.number, title: l.title, kind: l.kind, status: l.status, group_id: l.group_id, scheduled_at: l.scheduled_at, opened: isOpen(l) },
      sets: { class: mk(sets.class), home: mk(sets.home), extra: mk(sets.extra) }, exam };
  });
  R('POST', '/api/lessons/:id/open', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    Q.run('UPDATE lessons SET opened=? WHERE id=?', body.opened === false ? 0 : 1, l.id);
    if (body.opened !== false) Q.run("UPDATE lessons SET opened_at=COALESCE(opened_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?", l.id);
    lessonEvent(l); return { ok: true, opened: body.opened !== false };
  });
  // Рӯзро аз нав аз рӯи нақшаи курс пур кардан (масалан, пас аз «Ба гурӯҳ деҳ»-и дарси омода)
  R('POST', '/api/lessons/:id/replan', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    if (l.status === 'live') throw bad('Дарс ҳозир меравад. Аввал дарсро тамом кунед.');
    const i = Q.all('SELECT id FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', l.group_id).findIndex(x => x.id === l.id);
    const plan = coursePlan();
    Q.tx(() => fillLesson(Q, l.id, plan[i % plan.length]));
    lessonEvent(l); return { ok: true };
  });
  // ───── Журнал (CRM) ─────
  // Ҳар рӯз: ҳозирӣ (☑) ва хол 0–5. Ҳар ҳафта: бонус. Рӯзи имтиҳон: агар устод хол нагузошта бошад — аз фоизи имтиҳон (100% → 5).
  // Фоизи ҳафта = (ҷамъи холҳо + бонус) / (5 × рӯзҳои холгузошта) × 100 (на зиёда аз 100).
  // Миёна = (Ҳ1 + Ҳ2 + …) / шумораи ҳафтаҳои холдор. Масалан, 100% ва 40% → 70%.
  // Шогирд ҷадвал ва холҳоро мебинад; шарҳҳо ва маълумоти падару модар танҳо барои устод.
  const ATT = ['present', 'late', 'absent', 'excused'];
  const CKINDS = ['auto', 'absent', 'late', 'behavior', 'other'];
  const INFO_FIELDS = ['phone', 'father_name', 'father_phone', 'mother_name', 'mother_phone', 'notes'];
  const EMPTY_INFO = Object.fromEntries(INFO_FIELDS.map(k => [k, '']));
  const infoOf = uid => Q.get(`SELECT ${INFO_FIELDS.join(', ')} FROM student_info WHERE user_id=?`, uid) || { ...EMPTY_INFO };
  function courseWeeks(gid) {
    const weeks = []; let w = 0, d = 0;
    for (const l of Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', gid)) {
      if (d === 0 || d === 6) { w++; d = 0; } d++;   // як ҳафта = 6 рӯз (5 дарс + имтиҳон)
      (weeks[w - 1] ||= { week: w, days: [] }).days.push({ ...l, day: d });
    }
    return weeks.filter(Boolean).map(x => {
      const exam = x.days.find(l => l.kind === 'exam') || null;
      const held = !!exam && (!!exam.opened_at || !!Q.get('SELECT 1 FROM exam_violations WHERE lesson_id=? AND accepted_at IS NOT NULL', exam.id));
      return { ...x, exam, held, examIds: exam ? (s => [...s.class, ...s.home, ...s.extra])(lessonSets(exam)) : [] };
    });
  }
  function journalData(gid, teacher) {
    const weeks = courseWeeks(gid);
    const lids = weeks.flatMap(w => w.days.map(l => l.id));
    const ph = lids.map(() => '?').join(',');
    const by = (rows, k, v) => { const m = new Map(); for (const r of rows) { if (!m.has(r.user_id)) m.set(r.user_id, new Map()); m.get(r.user_id).set(r[k], r[v]); } return m; };
    const rowsIn = sql => lids.length ? Q.all(sql.replace('IN ()', `IN (${ph})`), ...lids) : [];
    const att = by(rowsIn('SELECT lesson_id, user_id, status FROM attendance WHERE lesson_id IN ()'), 'lesson_id', 'status');
    const scores = by(rowsIn('SELECT lesson_id, user_id, score FROM day_scores WHERE lesson_id IN ()'), 'lesson_id', 'score');
    const comm = teacher ? by(rowsIn('SELECT lesson_id, user_id, COUNT(*) n FROM journal_comments WHERE lesson_id IN () GROUP BY lesson_id, user_id'), 'lesson_id', 'n') : new Map();
    const bonus = by(Q.all('SELECT week, user_id, bonus FROM week_bonus WHERE group_id=?', gid), 'week', 'bonus');
    const ms = members(gid);
    // Хол дар ҳар рӯз (бо хол аз имтиҳон)
    const cells = new Map(ms.map(m => {
      const solved = solvedSet(m.id);
      return [m.id, weeks.map(w => w.days.map(l => {
        let sc = scores.get(m.id)?.get(l.id); let auto = false;
        if (sc == null && l.kind === 'exam' && w.held && w.examIds.length) {
          const e = examRow(l.id, m.id);
          if (!(l.opened && !e.finished_at && !e.blocked)) { sc = Math.round((5 * w.examIds.filter(id => solved.has(id)).length) / w.examIds.length); auto = true; }
        }
        return { id: l.id, att: att.get(m.id)?.get(l.id) || null, score: sc ?? null, auto, comments: teacher ? comm.get(m.id)?.get(l.id) || 0 : undefined };
      }))];
    }));
    // Рӯзи «холгузошта» — рӯзе, ки ҳадди ақал як шогирд хол дорад
    const graded = weeks.map((w, wi) => w.days.map((l, di) => ms.some(m => cells.get(m.id)[wi][di].score != null)));
    const students = ms.map(m => {
      const ws = weeks.map((w, wi) => {
        const days = cells.get(m.id)[wi];
        const n = graded[wi].filter(Boolean).length, b = bonus.get(m.id)?.get(w.week) || 0;
        const sum = days.reduce((a, d, di) => a + (graded[wi][di] ? d.score || 0 : 0), 0);
        return { week: w.week, days, bonus: b, percent: n ? Math.max(0, Math.min(100, Math.round((100 * (sum + b)) / (5 * n)))) : null };
      });
      const counted = ws.filter(x => x.percent != null);
      return { id: m.id, name: m.name, login: m.login, ...(teacher ? { info: infoOf(m.id) } : {}), weeks: ws,
        overall: counted.length ? Math.round(counted.reduce((a, x) => a + x.percent, 0) / counted.length) : null };
    });
    return { today: dushanbeDate(), students,
      weeks: weeks.map((w, wi) => ({ week: w.week, graded: graded[wi].filter(Boolean).length,
        days: w.days.map(l => ({ id: l.id, day: l.day, kind: l.kind, title: l.title, date: dushanbeDate(l.scheduled_at) })) })) };
  }
  R('GET', '/api/groups/:id/journal', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    return { group: Q.get('SELECT id, name FROM groups WHERE id=?', gid), role: 'teacher', ...journalData(gid, true) };
  });
  // Шогирд: ҷадвал ва холҳои гурӯҳ (бе шарҳҳо ва бе маълумоти падару модар)
  R('GET', '/api/my/journal', ({ user }) => {
    need(user, 'student');
    const g = Q.get("SELECT g.id, g.name FROM group_members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=? AND m.status='active' ORDER BY m.created_at LIMIT 1", user.id);
    if (!g) throw notFound('Шумо ҳанӯз дар гурӯҳ нестед.');
    return { group: g, role: 'student', me: user.id, ...journalData(g.id, false) };
  });
  const journalEvent = gid => { const t = Q.get('SELECT teacher_id FROM groups WHERE id=?', gid); publish([t.teacher_id, ...members(gid).map(m => m.id)], { type: 'journal', group_id: gid }); };
  // Ҳозирӣ: як шогирд (present | late | absent | excused | null)
  R('PUT', '/api/lessons/:id/attendance', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const uid = Number(body.user_id); if (!isMember(uid, l.group_id)) throw bad('Ин шогирд дар гурӯҳ нест.');
    const st = body.status == null || body.status === '' ? null : String(body.status);
    if (st && !ATT.includes(st)) throw bad('Ҳолати ҳозирӣ нодуруст аст.');
    if (st) Q.run(`INSERT INTO attendance (lesson_id, user_id, status) VALUES (?,?,?)
      ON CONFLICT(lesson_id, user_id) DO UPDATE SET status=excluded.status, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`, l.id, uid, st);
    else Q.run('DELETE FROM attendance WHERE lesson_id=? AND user_id=?', l.id, uid);
    journalEvent(l.group_id); return { ok: true, status: st };
  });
  // Ҳамаро «омад» қайд кардан (status: null — ҳамаро тоза кардан)
  R('POST', '/api/lessons/:id/attendance/all', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    if (body.status === null) { Q.run('DELETE FROM attendance WHERE lesson_id=?', l.id); journalEvent(l.group_id); return { ok: true }; }
    const st = ATT.includes(body.status) ? body.status : 'present';
    let n = 0;
    Q.tx(() => { for (const m of members(l.group_id)) n += Number(Q.run('INSERT OR IGNORE INTO attendance (lesson_id, user_id, status) VALUES (?,?,?)', l.id, m.id, st).changes); });
    journalEvent(l.group_id); return { ok: true, marked: n };
  });
  // Холи рӯз 0–5 (null — тоза)
  R('PUT', '/api/lessons/:id/score', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const uid = Number(body.user_id); if (!isMember(uid, l.group_id)) throw bad('Ин шогирд дар гурӯҳ нест.');
    if (body.score == null || body.score === '') Q.run('DELETE FROM day_scores WHERE lesson_id=? AND user_id=?', l.id, uid);
    else {
      const sc = Number(body.score); if (!Number.isInteger(sc) || sc < 0 || sc > 5) throw bad('Хол бояд аз 0 то 5 бошад.');
      Q.run('INSERT INTO day_scores (lesson_id, user_id, score) VALUES (?,?,?) ON CONFLICT(lesson_id, user_id) DO UPDATE SET score=excluded.score', l.id, uid, sc);
      // Шогирде, ки хол гирифт, дар дарс буд — агар ҳозирӣ ҳанӯз қайд нашуда бошад, «омад» мегузорем
      Q.run("INSERT OR IGNORE INTO attendance (lesson_id, user_id, status) VALUES (?,?,'present')", l.id, uid);
    }
    journalEvent(l.group_id); return { ok: true };
  });
  // Бонуси ҳафта
  R('PUT', '/api/groups/:id/bonus', ({ user, params, body }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    const uid = Number(body.user_id), week = Number(body.week), b = Number(body.bonus) || 0;
    if (!isMember(uid, gid)) throw bad('Ин шогирд дар гурӯҳ нест.');
    if (!Number.isInteger(week) || week < 1 || week > 60) throw bad('Ҳафта нодуруст аст.');
    if (!Number.isInteger(b) || b < -30 || b > 30) throw bad('Бонус бояд аз −30 то 30 бошад.');
    Q.run('INSERT INTO week_bonus (group_id, week, user_id, bonus) VALUES (?,?,?,?) ON CONFLICT(group_id, week, user_id) DO UPDATE SET bonus=excluded.bonus', gid, week, uid, b);
    journalEvent(gid); return { ok: true };
  });
  // Шарҳҳои устод ба шогирд дар як рӯз (ғоибӣ, дермонӣ, рафтор…) — танҳо устод мебинад
  R('GET', '/api/lessons/:id/jcomments', ({ user, params, query }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    return Q.all('SELECT c.id, c.kind, c.text, c.late_min, c.created_at, u.name author FROM journal_comments c JOIN users u ON u.id=c.author_id WHERE c.lesson_id=? AND c.user_id=? ORDER BY c.id', l.id, Number(query.user_id));
  });
  R('POST', '/api/lessons/:id/jcomments', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const uid = Number(body.user_id); if (!isMember(uid, l.group_id)) throw bad('Ин шогирд дар гурӯҳ нест.');
    const kind = CKINDS.includes(body.kind) ? body.kind : 'other';
    const text = String(body.text || '').trim().slice(0, 1000);
    const late = body.late_min === '' || body.late_min == null ? null : Math.max(0, Math.min(600, Math.round(Number(body.late_min) || 0)));
    if (!text && late == null) throw bad('Шарҳ ё дақиқаи дермониро нависед.');
    Q.run('INSERT INTO journal_comments (lesson_id, user_id, author_id, kind, text, late_min) VALUES (?,?,?,?,?,?)', l.id, uid, user.id, kind, text, late);
    if (late != null && late > 0) Q.run(`INSERT INTO attendance (lesson_id, user_id, status) VALUES (?,?,'late') ON CONFLICT(lesson_id, user_id) DO UPDATE SET status='late'`, l.id, uid);
    if (kind === 'absent') Q.run(`INSERT INTO attendance (lesson_id, user_id, status) VALUES (?,?,'absent') ON CONFLICT(lesson_id, user_id) DO UPDATE SET status='absent'`, l.id, uid);
    journalEvent(l.group_id); return { ok: true };
  });
  R('DELETE', '/api/jcomments/:id', ({ user, params }) => {
    need(user, 'teacher');
    const c = Q.get('SELECT c.id, l.group_id FROM journal_comments c JOIN lessons l ON l.id=c.lesson_id WHERE c.id=?', Number(params.id));
    if (!c || !ownsGroup(user, c.group_id)) throw notFound();
    Q.run('DELETE FROM journal_comments WHERE id=?', c.id); journalEvent(c.group_id); return { ok: true };
  });
  // Маълумоти шогирд (телефонҳо, падар ва модар) — танҳо устод
  R('PUT', '/api/students/:uid/info', ({ user, params, body }) => {
    need(user, 'teacher'); const uid = Number(params.uid); if (!teacherSeesUser(user, uid)) throw forbidden();
    const v = Object.fromEntries(INFO_FIELDS.map(k => [k, String(body[k] ?? '').trim().slice(0, k === 'notes' ? 2000 : 120)]));
    Q.run(`INSERT INTO student_info (user_id, ${INFO_FIELDS.join(', ')}) VALUES (?, ${INFO_FIELDS.map(() => '?').join(', ')})
      ON CONFLICT(user_id) DO UPDATE SET ${INFO_FIELDS.map(k => `${k}=excluded.${k}`).join(', ')}, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`, uid, ...INFO_FIELDS.map(k => v[k]));
    return { ok: true, info: v };
  });
  // Имтиҳон: вайронкунӣ (нусхабардорӣ, рафтан ба равзанаи дигар). 3 → блоки худкор.
  R('POST', '/api/lessons/:id/violation', ({ user, params, body }) => {
    need(user, 'student'); const l = lessonFor(user, Number(params.id));
    if (l.kind !== 'exam') throw bad('Ин имтиҳон нест.');
    const prev = Q.get('SELECT * FROM exam_violations WHERE lesson_id=? AND user_id=?', l.id, user.id);
    if (prev?.blocked) return { count: prev.count, blocked: true };
    if (!prev?.accepted_at || prev.finished_at) return { count: prev?.count || 0, blocked: false, ignored: true }; // ҳанӯз ворид нашудааст ё тамом кард
    const lastEv = Q.get('SELECT created_at FROM exam_events WHERE lesson_id=? AND user_id=? ORDER BY id DESC LIMIT 1', l.id, user.id);
    if (lastEv && Date.now() - Date.parse(lastEv.created_at) < 1000) return { count: prev.count, blocked: false, ignored: true }; // як амал (масалан, blur + visibilitychange) — як вайронкунӣ
    const type = String(body.type || 'other').slice(0, 20);
    Q.run(`INSERT INTO exam_violations (lesson_id, user_id, count, last_type) VALUES (?,?,1,?)
      ON CONFLICT(lesson_id, user_id) DO UPDATE SET count=count+1, last_type=excluded.last_type, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`, l.id, user.id, type);
    Q.run('INSERT INTO exam_events (lesson_id, user_id, type) VALUES (?,?,?)', l.id, user.id, type);
    const r = Q.get('SELECT count FROM exam_violations WHERE lesson_id=? AND user_id=?', l.id, user.id);
    const blocked = r.count >= 3;
    if (blocked) Q.run('UPDATE exam_violations SET blocked=1 WHERE lesson_id=? AND user_id=?', l.id, user.id);
    publish([Q.get('SELECT teacher_id FROM groups WHERE id=?', l.group_id).teacher_id], { type: 'exam', lesson_id: l.id, group_id: l.group_id, user_id: user.id, name: user.name, count: r.count, blocked, vtype: type, lesson_title: l.title });
    return { count: r.count, blocked };
  });
  // Шогирд шартҳои имтиҳонро хонд ва қабул кард — баъд масъалаҳо кушода мешаванд
  R('POST', '/api/lessons/:id/exam/accept', ({ user, params }) => {
    need(user, 'student'); const l = lessonFor(user, Number(params.id));
    if (l.kind !== 'exam') throw bad('Ин имтиҳон нест.');
    if (isLocked(user, l)) throw forbidden('Ин рӯз ҳанӯз кушода нашудааст — устод онро мекушояд.');
    const e = examRow(l.id, user.id);
    if (e.blocked) throw new HttpError(403, 'Шумо аз ин имтиҳон блок шудед. Танҳо устод метавонад шуморо боз кунад.', { blocked: true });
    Q.run(`INSERT INTO exam_violations (lesson_id, user_id, count, accepted_at) VALUES (?,?,0,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      ON CONFLICT(lesson_id, user_id) DO UPDATE SET accepted_at=COALESCE(accepted_at, excluded.accepted_at)`, l.id, user.id);
    publish([Q.get('SELECT teacher_id FROM groups WHERE id=?', l.group_id).teacher_id], { type: 'exam', lesson_id: l.id, group_id: l.group_id, user_id: user.id, name: user.name, accepted: true });
    return { ok: true };
  });
  // Шогирд имтиҳонро худаш тамом кард — баъд аз ин назорат қатъ мешавад ва масъалаҳо баста мешаванд
  R('POST', '/api/lessons/:id/exam/finish', ({ user, params }) => {
    need(user, 'student'); const l = lessonFor(user, Number(params.id));
    if (l.kind !== 'exam') throw bad('Ин имтиҳон нест.');
    const e = examRow(l.id, user.id);
    if (!e.accepted_at) throw bad('Шумо ҳанӯз ба имтиҳон ворид нашудаед.');
    Q.run("UPDATE exam_violations SET finished_at=COALESCE(finished_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE lesson_id=? AND user_id=?", l.id, user.id);
    const s = lessonSets(l); const ids = [...s.class, ...s.home, ...s.extra]; const sv = solvedSet(user.id); const solved = ids.filter(id => sv.has(id)).length;
    publish([Q.get('SELECT teacher_id FROM groups WHERE id=?', l.group_id).teacher_id], { type: 'exam', lesson_id: l.id, group_id: l.group_id, user_id: user.id, name: user.name, finished: true,
      points: solved * 10, max: ids.length * 10, percent: ids.length ? Math.round((100 * solved) / ids.length) : 0 });
    return { ok: true };
  });
  R('GET', '/api/lessons/:id/exam', ({ user, params }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const s = lessonSets(l); const ids = [...s.class, ...s.home, ...s.extra];
    return members(l.group_id).map(m => {
      const e = examRow(l.id, m.id); const sv = solvedSet(m.id); const solved = ids.filter(id => sv.has(id)).length;
      return { user: m, count: e.count, blocked: !!e.blocked, last_type: e.last_type || null, accepted_at: e.accepted_at || null, finished_at: e.finished_at || null,
        solved, total: ids.length, points: solved * 10, max: ids.length * 10, percent: ids.length ? Math.round((100 * solved) / ids.length) : 0 };
    });
  });
  R('POST', '/api/lessons/:id/unblock', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    Q.run('UPDATE exam_violations SET count=0, blocked=0, finished_at=NULL WHERE lesson_id=? AND user_id=?', l.id, Number(body.user_id));
    publish([Number(body.user_id)], { type: 'lesson', lesson_id: l.id, group_id: l.group_id, unblocked: true });
    publish([user.id], { type: 'exam', lesson_id: l.id, group_id: l.group_id, user_id: Number(body.user_id), unblocked: true });
    return { ok: true };
  });
  R('PUT', '/api/lessons/:id/sets', ({ user, params, body }) => {
    need(user, 'teacher'); const l = lessonFor(user, Number(params.id));
    const valid = a => (Array.isArray(a) ? a : []).map(Number).filter(id => Q.get('SELECT 1 FROM problems WHERE id=? AND current_version>0', id));
    Q.tx(() => {
      if (body.class) {
        const want = valid(body.class);
        const cur = Q.all("SELECT id, problem_id FROM lesson_steps WHERE lesson_id=? AND kind='problem'", l.id);
        for (const st of cur) if (!want.includes(st.problem_id)) Q.run('DELETE FROM lesson_steps WHERE id=?', st.id);
        let pos = Q.get('SELECT COALESCE(MAX(position),0) m FROM lesson_steps WHERE lesson_id=?', l.id).m;
        for (const pid of want) if (!cur.some(c => c.problem_id === pid))
          Q.run("INSERT INTO lesson_steps (lesson_id, position, kind, title, problem_id) VALUES (?,?,'problem',?,?)", l.id, ++pos, l.kind === 'exam' ? 'Имтиҳон' : 'Масъалаи синфӣ', pid);
      }
      if (body.home) Q.run('UPDATE lessons SET homework_problem_ids=? WHERE id=?', JSON.stringify(valid(body.home)), l.id);
      if (body.extra) Q.run('UPDATE lessons SET extra_problem_ids=? WHERE id=?', JSON.stringify(valid(body.extra)), l.id);
    });
    lessonEvent(l); return { ok: true };
  });

  // Қолабҳои дарс
  R('GET', '/api/templates', ({ user }) => { need(user, 'teacher'); return Q.all('SELECT * FROM lesson_templates WHERE owner_id=? OR owner_id IS NULL ORDER BY id', user.id).map(t => ({ ...t, steps: J(t.steps) })); });
  R('GET', '/api/templates/:id', ({ user, params }) => { need(user, 'teacher'); const t = Q.get('SELECT * FROM lesson_templates WHERE id=? AND owner_id=?', Number(params.id), user.id); if (!t) throw notFound(); return { ...t, steps: J(t.steps) }; });
  R('PUT', '/api/templates/:id', ({ user, params, body }) => {
    need(user, 'teacher'); const t = Q.get('SELECT * FROM lesson_templates WHERE id=? AND owner_id=?', Number(params.id), user.id); if (!t) throw notFound();
    const steps = validateSteps(body.steps);
    Q.run("UPDATE lesson_templates SET title=?, topic=?, steps=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", String(body.title || t.title), String(body.topic || t.topic), JSON.stringify(steps), t.id);
    return { ok: true };
  });
  R('POST', '/api/templates/:id/copy', ({ user, params, body }) => {
    need(user, 'teacher'); const t = Q.get('SELECT * FROM lesson_templates WHERE id=? AND owner_id=?', Number(params.id), user.id); if (!t) throw notFound();
    const id = Number(Q.run('INSERT INTO lesson_templates (owner_id, title, topic, steps) VALUES (?,?,?,?)', user.id, String(body.title || t.title + ' (нусха)'), String(body.topic || t.topic), t.steps).lastInsertRowid);
    return { id };
  });
  R('POST', '/api/templates/:id/assign', ({ user, params, body }) => {
    need(user, 'teacher'); const t = Q.get('SELECT * FROM lesson_templates WHERE id=? AND owner_id=?', Number(params.id), user.id); if (!t) throw notFound();
    let lid = Number(body.lesson_id);
    if (!lid) {
      const gid = Number(body.group_id); if (!ownsGroup(user, gid)) throw forbidden();
      const today = dushanbeDate();
      const ls = Q.all("SELECT * FROM lessons WHERE group_id=? AND status!='finished' ORDER BY scheduled_at", gid);
      const l = ls.find(x => x.status === 'live') || ls.find(x => dushanbeDate(x.scheduled_at) >= today) || ls[0];
      if (!l) throw bad('Дар гурӯҳ дарси банақшагирифта нест.');
      lid = l.id;
    }
    const l = lessonFor(user, lid);
    Q.tx(() => applyTemplate(Q, l.id, { title: t.title, topic: t.topic, steps: J(t.steps) }));
    Q.run('DELETE FROM predict_outputs WHERE step_id NOT IN (SELECT id FROM lesson_steps)');
    lessonEvent(l); return { lesson_id: l.id };
  });
  function validateSteps(steps) {
    if (!Array.isArray(steps) || !steps.length) throw bad('Ҳадди ақал як қадам лозим аст.');
    return steps.map(s => {
      if (!['predict', 'problem', 'quiz'].includes(s.kind)) throw bad('Навъи қадам нодуруст аст.');
      const out = { kind: s.kind, title: String(s.title || '').trim() || 'Қадам', payload: s.payload || {} };
      if (s.kind === 'problem') { const pid = Number(s.problem_id) || Q.get('SELECT id FROM problems WHERE slug=?', s.problem_slug || '')?.id; if (!pid) throw bad(`Барои қадами «${out.title}» масъала интихоб нашудааст.`); out.problem_id = pid; }
      if (s.kind === 'quiz') { const o = out.payload.options; if (!Array.isArray(o) || o.length < 2) throw bad('Санҷиш ҳадди ақал 2 ҷавоб мехоҳад.'); }
      if (s.kind === 'predict' && !out.payload.code) throw bad('Қадами «Пешгӯӣ кун» код мехоҳад.');
      return out;
    });
  }

  // Масъалаҳо
  R('GET', '/api/problems', ({ user }) => {
    need(user);
    const solved = user.role === 'student' ? solvedSet(user.id) : new Set();
    const acc = user.role === 'student' ? studentAccess(user.id) : null;
    return Q.all('SELECT * FROM problems ORDER BY position, id').map(p => {
      if (acc && (!acc.open.has(p.id) || acc.exam.has(p.id))) return null;
      const v = p.current_version ? pvData(p.id, p.current_version) : (J(p.draft) || {});
      if (user.role === 'student' && !p.current_version) return null;
      return { id: p.id, slug: p.slug, topic: p.topic, title: v.title || 'Масъалаи нав', level: v.level, version: p.current_version, hasDraft: !!p.draft, lessonOnly: !!v.lessonOnly, solved: solved.has(p.id), practice_tags: J(p.practice_tags) };
    }).filter(Boolean);
  });
  R('GET', '/api/problems/:id', ({ user, params, query }) => {
    need(user); const pid = Number(params.id);
    if (user.role === 'teacher') {
      const p = Q.get('SELECT * FROM problems WHERE id=?', pid); if (!p) throw notFound();
      const versions = Q.all('SELECT version, published_at FROM problem_versions WHERE problem_id=? ORDER BY version', pid);
      const cur = p.current_version ? J(Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=?', pid, Number(query.v) || p.current_version).data) : null;
      return { id: p.id, slug: p.slug, topic: p.topic, current_version: p.current_version, practice_tags: J(p.practice_tags), versions, published: cur, draft: J(p.draft), public: p.current_version ? publicProblem(pid, Number(query.v) || undefined) : null };
    }
    assertProblemAccess(user, pid);
    // Масъалаи имтиҳон танҳо дар саҳифаи имтиҳон (бо назорат) кушода мешавад
    return { ...publicProblem(pid, Number(query.v) || undefined), exam_lesson: studentAccess(user.id).exam.get(pid) };
  });
  R('POST', '/api/problems', ({ user, body }) => {
    need(user, 'teacher');
    const topic = TOPICS.some(t => t.key === body.topic) ? body.topic : 'io';
    const blank = { title: 'Масъалаи нав', level: 'Осон', statement: '', input: '', output: '', constraints: '', examples: [{ input: '', output: '', explain: '' }], hints: ['', '', ''], solution: DEFAULT_STARTER, starter: DEFAULT_STARTER, tests: [], timeMs: 2000, memoryMb: 256 };
    const r = Q.run('INSERT INTO problems (slug, owner_id, topic, position, current_version, draft) VALUES (?,?,?,?,0,?)', 'p-' + token(4), user.id, topic, 500, JSON.stringify(blank));
    return { id: Number(r.lastInsertRowid) };
  });
  function cleanProblem(d) {
    const s = v => String(v ?? '');
    const data = {
      title: s(d.title).trim(), level: s(d.level || 'Осон'), statement: s(d.statement), input: s(d.input), output: s(d.output), constraints: s(d.constraints),
      examples: (d.examples || []).map(e => ({ input: s(e.input), output: s(e.output), explain: s(e.explain) })).filter(e => e.input.trim() || e.output.trim()),
      hints: (d.hints || []).map(s).slice(0, 3), solution: s(d.solution), starter: s(d.starter || DEFAULT_STARTER),
      tests: (d.tests || []).map(t => ({ input: s(t.input).endsWith('\n') ? s(t.input) : s(t.input) + '\n', output: s(t.output), hidden: !!t.hidden, tags: (Array.isArray(t.tags) ? t.tags : s(t.tags).split(',')).map(x => String(x).trim()).filter(Boolean) })).filter(t => t.input.trim() || t.output.trim()),
      timeMs: Math.min(10000, Math.max(200, Number(d.timeMs) || 2000)), memoryMb: Math.min(512, Math.max(16, Number(d.memoryMb) || 256)), lessonOnly: !!d.lessonOnly,
    };
    return data;
  }
  R('PUT', '/api/problems/:id/draft', ({ user, params, body }) => {
    need(user, 'teacher'); const p = Q.get('SELECT * FROM problems WHERE id=?', Number(params.id)); if (!p) throw notFound();
    const data = cleanProblem(body.data || {});
    Q.run('UPDATE problems SET draft=?, topic=?, practice_tags=? WHERE id=?', JSON.stringify(data), TOPICS.some(t => t.key === body.topic) ? body.topic : p.topic, JSON.stringify((body.practice_tags || J(p.practice_tags) || []).map(String)), p.id);
    return { ok: true };
  });
  R('POST', '/api/problems/:id/check', async ({ user, params, body }) => {
    need(user, 'teacher'); if (!Q.get('SELECT 1 FROM problems WHERE id=?', Number(params.id))) throw notFound();
    const d = cleanProblem(body.data || {});
    return await checkSolution(d);
  });
  async function checkSolution(d) {
    const exTests = d.examples.map((e, i) => ({ input: e.input.endsWith('\n') ? e.input : e.input + '\n', output: e.output, tags: [`мисол ${i + 1}`], hidden: false }));
    const all = [...exTests, ...d.tests];
    const r = await judgeAll(d.solution, all, { timeMs: d.timeMs, memoryMb: d.memoryMb });
    const mism = (r.tests || []).filter(t => t.status !== 'AC').map(t => ({ ...t, label: t.i <= exTests.length ? `Мисоли ${t.i}` : `Тести ${t.i - exTests.length}${t.hidden ? ' (пинҳонӣ)' : ''}` }));
    return { verdict: r.verdict, passed: r.passed, total: all.length, compile: r.compile, compileExplain: explainCompile(r.compile), detail: r.detail, notConfigured: r.notConfigured, steps: r.steps, mismatches: mism };
  }
  R('POST', '/api/problems/:id/publish', async ({ user, params }) => {
    need(user, 'teacher'); const p = Q.get('SELECT * FROM problems WHERE id=?', Number(params.id)); if (!p) throw notFound();
    const d = J(p.draft); if (!d) throw bad('Тағйироти нав барои нашр нест.');
    if (!d.title || !d.statement) throw bad('Ном ва шарти масъала лозим аст.');
    if (!d.tests.length) throw bad('Ҳадди ақал як тест лозим аст.');
    const chk = await checkSolution(d);
    if (chk.verdict !== 'AC') throw new HttpError(409, 'Ҳалли намунавӣ аз ҳамаи тестҳо нагузашт — нашр манъ аст.', { check: chk });
    const v = p.current_version + 1;
    Q.tx(() => {
      Q.run('INSERT INTO problem_versions (problem_id, version, data) VALUES (?,?,?)', p.id, v, JSON.stringify(d));
      Q.run('UPDATE problems SET current_version=?, draft=NULL WHERE id=?', v, p.id);
    });
    return { version: v };
  });

  // Нусхаи машқӣ (draft)
  R('GET', '/api/drafts/:pid', ({ user, params }) => {
    need(user, 'student'); const pid = Number(params.pid); assertProblemAccess(user, pid); const pp = publicProblem(pid);
    const d = Q.get('SELECT code, stdin, rev, device, updated_at FROM drafts WHERE user_id=? AND problem_id=?', user.id, pid);
    const saved = Q.all('SELECT id, code, device, created_at FROM draft_conflicts WHERE user_id=? AND problem_id=? ORDER BY id DESC LIMIT 10', user.id, pid);
    return d ? { ...d, saved } : { code: pp.starter || DEFAULT_STARTER, stdin: pp.examples?.[0]?.input || '', rev: 0, saved };
  });
  R('PUT', '/api/drafts/:pid', ({ user, params, body }) => {
    need(user, 'student'); const pid = Number(params.pid); assertProblemAccess(user, pid); publicProblem(pid);
    const code = String(body.code ?? '').slice(0, 100000), stdin = String(body.stdin ?? '').slice(0, 100000), device = String(body.device || '').slice(0, 64);
    const row = Q.get('SELECT * FROM drafts WHERE user_id=? AND problem_id=?', user.id, pid);
    if (!row) {
      Q.run('INSERT INTO drafts (user_id, problem_id, code, stdin, rev, device) VALUES (?,?,?,?,1,?)', user.id, pid, code, stdin, device);
      return { rev: 1 };
    }
    const base = Number(body.baseRev);
    if (!body.force && base !== row.rev && row.code !== code) {
      throw new HttpError(409, 'Ҳамоҳангсозӣ лозим аст', { server: { code: row.code, rev: row.rev, device: row.device, updated_at: row.updated_at } });
    }
    if (body.force && row.code !== code) Q.run('INSERT INTO draft_conflicts (user_id, problem_id, code, device) VALUES (?,?,?,?)', user.id, pid, row.code, row.device);
    Q.run("UPDATE drafts SET code=?, stdin=?, rev=rev+1, device=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id=? AND problem_id=?", code, stdin, device, user.id, pid);
    return { rev: row.rev + 1 };
  });
  R('POST', '/api/drafts/:pid/keep', ({ user, params, body }) => {
    need(user, 'student'); const pid = Number(params.pid); publicProblem(pid);
    Q.run('INSERT INTO draft_conflicts (user_id, problem_id, code, device) VALUES (?,?,?,?)', user.id, pid, String(body.code ?? '').slice(0, 100000), String(body.device || '').slice(0, 64));
    return { ok: true };
  });

  // Иҷро ва кӯшиш
  const running = new Set();
  R('POST', '/api/run', async ({ user, body }) => {
    need(user);
    if (running.has(user.id)) throw new HttpError(429, 'Иҷрои қаблӣ ҳанӯз тамом нашудааст.');
    running.add(user.id);
    try {
      let lim = {};
      if (body.problem_id) { assertProblemAccess(user, Number(body.problem_id)); const { data } = versionData(Number(body.problem_id)); if (data) lim = { timeMs: data.timeMs, memoryMb: data.memoryMb }; }
      const r = await runOnce(String(body.code ?? ''), String(body.stdin ?? ''), lim);
      return { ...r, compileExplain: explainCompile(r.compile), explain: explainRuntime(r) };
    } finally { running.delete(user.id); }
  });
  R('POST', '/api/submissions', ({ user, body }) => {
    need(user, 'student');
    const pid = Number(body.problem_id); assertProblemAccess(user, pid); const pp = publicProblem(pid);
    const tok = String(body.client_token || '').slice(0, 80); if (tok.length < 8) throw bad('client_token лозим аст.');
    const ex = Q.get('SELECT * FROM submissions WHERE user_id=? AND client_token=?', user.id, tok);
    if (ex) return submissionView(ex, user);
    let lessonId = Number(body.lesson_id) || null;
    if (lessonId) { const l = Q.get('SELECT group_id FROM lessons WHERE id=?', lessonId); if (!l || !isMember(user.id, l.group_id)) lessonId = null; }
    const code = String(body.code ?? '').slice(0, 100000); if (!code.trim()) throw bad('Код холӣ аст.');
    const id = Q.tx(() => {
      const n = Q.get('SELECT COALESCE(MAX(number),0)+1 n FROM submissions WHERE user_id=? AND problem_id=?', user.id, pid).n;
      return Number(Q.run('INSERT INTO submissions (user_id, problem_id, problem_version, number, lesson_id, assignment_id, code, client_token) VALUES (?,?,?,?,?,?,?,?)',
        user.id, pid, pp.version, n, lessonId, Number(body.assignment_id) || null, code, tok).lastInsertRowid);
    });
    enqueue(id);
    const s = Q.get('SELECT * FROM submissions WHERE id=?', id);
    notifySub(s, 'queued');
    return submissionView(s, user);
  });
  R('GET', '/api/submissions', ({ user, query }) => {
    need(user);
    const uid = user.role === 'teacher' ? Number(query.user_id) : user.id;
    if (user.role === 'teacher' && !teacherSeesUser(user, uid)) throw forbidden();
    const rows = Q.all('SELECT * FROM submissions WHERE user_id=? AND problem_id=? ORDER BY id DESC', uid, Number(query.problem_id));
    return rows.map(s => submissionView(s, user));
  });
  R('GET', '/api/attempts', ({ user, query }) => {
    need(user, 'teacher');
    const ids = String(query.ids || '').split(',').map(Number).filter(Boolean).slice(0, 500);
    return ids.map(id => Q.get('SELECT * FROM submissions WHERE id=?', id)).filter(s => s && canSeeSub(user, s)).map(s => {
      const v = submissionView(s, user); return { id: v.id, number: v.number, user: v.user, problem_title: v.problem_title, problem_version: v.problem_version, created_at: v.created_at, verdict: v.grading?.verdict, passed: v.grading?.passed, total: v.grading?.total, failedTags: v.grading?.failedTags };
    });
  });
  R('GET', '/api/submissions/:id', ({ user, params }) => {
    need(user); const s = Q.get('SELECT * FROM submissions WHERE id=?', Number(params.id)); if (!s || !canSeeSub(user, s)) throw notFound('Кӯшиш ёфт нашуд.');
    return submissionView(s, user);
  });
  R('POST', '/api/submissions/:id/comments', ({ user, params, body }) => {
    need(user, 'teacher'); const s = Q.get('SELECT * FROM submissions WHERE id=?', Number(params.id)); if (!s || !canSeeSub(user, s)) throw notFound();
    const line = Number(body.line); const lines = s.code.split('\n').length;
    if (!(line >= 1 && line <= lines)) throw bad('Рақами сатр нодуруст аст.');
    const text = String(body.text || '').trim(); if (!text) throw bad('Матни шарҳ холӣ аст.');
    Q.run('INSERT INTO comments (submission_id, author_id, line, text) VALUES (?,?,?,?)', s.id, user.id, line, text.slice(0, 2000));
    publish([s.user_id], { type: 'comment', submission_id: s.id, problem_id: s.problem_id });
    return submissionView(s, user);
  });

  // Навбати ёрӣ
  R('POST', '/api/help', ({ user, body }) => {
    need(user, 'student');
    const question = String(body.question || '').trim(); if (!question) throw bad('Саволи худро нависед.');
    let gid = null, lid = Number(body.lesson_id) || null;
    if (lid) { const l = Q.get('SELECT group_id FROM lessons WHERE id=?', lid); if (l && isMember(user.id, l.group_id)) gid = l.group_id; else lid = null; }
    if (!gid) gid = Q.get("SELECT group_id FROM group_members WHERE user_id=? AND status='active' LIMIT 1", user.id)?.group_id;
    if (!gid) throw bad('Шумо ҳанӯз дар гурӯҳ нестед.');
    let sid = Number(body.submission_id) || null;
    if (sid) { const s = Q.get('SELECT user_id FROM submissions WHERE id=?', sid); if (!s || s.user_id !== user.id) sid = null; }
    const open = Q.get("SELECT id FROM help_requests WHERE user_id=? AND group_id=? AND status!='done'", user.id, gid);
    if (open) Q.run('UPDATE help_requests SET question=?, submission_id=?, problem_id=?, lesson_id=? WHERE id=?', question.slice(0, 1000), sid, Number(body.problem_id) || null, lid, open.id);
    else Q.run('INSERT INTO help_requests (user_id, group_id, lesson_id, problem_id, submission_id, question) VALUES (?,?,?,?,?,?)', user.id, gid, lid, Number(body.problem_id) || null, sid, question.slice(0, 1000));
    publish(groupAudience(gid).slice(0, 1), { type: 'help', group_id: gid });
    return { ok: true, updated: !!open };
  });
  R('GET', '/api/help/mine', ({ user }) => { need(user, 'student'); return Q.all("SELECT id, question, status, created_at, submission_id FROM help_requests WHERE user_id=? AND status!='done'", user.id); });
  R('POST', '/api/help/:id/:action', ({ user, params }) => {
    need(user, 'teacher'); const h = Q.get('SELECT * FROM help_requests WHERE id=?', Number(params.id)); if (!h || !ownsGroup(user, h.group_id)) throw notFound();
    if (params.action === 'take') Q.run("UPDATE help_requests SET status='taken', taken_by=? WHERE id=?", user.id, h.id);
    else if (params.action === 'done') Q.run("UPDATE help_requests SET status='done', done_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", h.id);
    else throw bad('Амали номаълум.');
    publish(groupAudience(h.group_id).slice(0, 1), { type: 'help', group_id: h.group_id });
    publish([h.user_id], { type: 'help', group_id: h.group_id, action: params.action });
    return { ok: true };
  });

  // Вазифаи хонагӣ
  R('POST', '/api/groups/:id/assignments', ({ user, params, body }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    const pids = (body.problem_ids || []).map(Number).filter(id => Q.get('SELECT 1 FROM problems WHERE id=? AND current_version>0', id));
    if (!pids.length) throw bad('Ҳадди ақал як масъала интихоб кунед.');
    const m = String(body.due_local || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/); if (!m) throw bad('Муҳлатро интихоб кунед.');
    const due = localToUtcIso(m[1], m[2]);
    const id = Number(Q.run('INSERT INTO assignments (group_id, lesson_id, title, problem_ids, due_at) VALUES (?,?,?,?,?)', gid, Number(body.lesson_id) || null, String(body.title || 'Вазифаи хонагӣ'), JSON.stringify(pids), due).lastInsertRowid);
    publish(groupAudience(gid), { type: 'assignment', group_id: gid });
    return { id, due_at: due };
  });

  // Realtime
  R('GET', '/api/events', ({ user, res }) => {
    need(user);
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`data: ${JSON.stringify({ type: 'hello', build: buildId() })}\n\n`);
    if (!streams.has(user.id)) streams.set(user.id, new Set());
    streams.get(user.id).add(res);
    res.on('close', () => streams.get(user.id)?.delete(res));
    return undefined;
  }, { raw: true });

  // ───────── HTTP ─────────
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
  function serveStatic(req, res, url) {
    let p = decodeURIComponent(url.pathname);
    if (p === '/' || !path.extname(p)) p = '/index.html';
    const f = path.join(staticDir, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(staticDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    if (p === '/index.html') {
      // Ба app.js ва styles.css версия илова мешавад (?v=…): пас аз навсозӣ браузер ҳатман нусхаи навро мегирад
      const b = buildId();
      const page = fs.readFileSync(f, 'utf8').replace(/\.\/(app\.js|styles\.css)"/g, `./$1?v=${b}"`).replace('<head>', `<head>\n<meta name="build" content="${b}">`);
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      return res.end(page);
    }
    const cache = p === '/sw.js' ? 'no-cache'
      : url.searchParams.has('v') || p.startsWith('/fonts/') ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': cache });
    fs.createReadStream(f).pipe(res);
  }
  const cookieOf = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(x => x[0]));

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url);
    const route = routes.find(r => r.method === req.method && r.rx.test(url.pathname));
    const send = (status, obj, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Build': buildId(), ...headers }); res.end(JSON.stringify(obj)); };
    if (!route) return send(404, { error: 'Масир ёфт нашуд.' });
    try {
      let body = {};
      if (req.method !== 'GET') {
        const chunks = []; let size = 0;
        for await (const c of req) { size += c.length; if (size > 2_000_000) throw bad('Дархост хеле калон аст.'); chunks.push(c); }
        if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      }
      const sid = cookieOf(req).sid;
      const user = userBy(sid);
      const m = url.pathname.match(route.rx);
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const out = await route.handler({ req, res, body, user, sid, params, query: Object.fromEntries(url.searchParams) });
      if (route.raw) return;
      if (out && 'cookie' in out) {
        const { cookie, ...rest } = out;
        return send(200, rest, { 'Set-Cookie': `sid=${cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${cookie ? 60 * 60 * 24 * 60 : 0}` });
      }
      send(200, out ?? {});
    } catch (e) {
      if (e instanceof HttpError) return send(e.status, { error: e.message, ...(e.extra || {}) });
      if (e instanceof SyntaxError) return send(400, { error: 'JSON нодуруст.' });
      console.error(e); send(500, { error: 'Хатои дохилии сервер.' });
    }
  });
  return { server, db, Q };
}
