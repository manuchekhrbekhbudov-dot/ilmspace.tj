// ILMSPACE CodeLab — сервер (node:http, бе фреймворк)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { openDb, q } from './db.js';
import { judgeAll, runOnce, judgeStatus, normalizeOutput, queueDepth } from './judge.js';
import { persistStatus } from './persist.js';
import { explainCompile, explainRuntime } from './explain.js';
import { seedDemo, createGroup, applyTemplate, problemData, ensureTeacher } from './seed.js';
import { TOPICS, DEFAULT_STARTER } from './seed/problems.js';
import { HttpError, bad, forbidden, notFound, J, token, hashPassword, checkPassword, inviteCode, dushanbeDate, localToUtcIso } from './util.js';

export function createApp({ dbFile, staticDir, seed = true } = {}) {
  const db = openDb(dbFile);
  const Q = q(db);
  if (seed) seedDemo(Q);
  const t = ensureTeacher(Q);
  if (t) console.log(`Ҳисоби устод омода аст: ${t.login}${t.fromDemo ? ' (гурӯҳҳо ва дарси омода ба он гузаштанд)' : ''}`);

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
  const userBy = sid => sid && Q.get('SELECT u.id, u.login, u.name, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?', sid);
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
  function versionData(pid, v) {
    const p = Q.get('SELECT * FROM problems WHERE id=?', pid);
    if (!p) throw notFound('Масъала ёфт нашуд.');
    const ver = v || p.current_version;
    const row = Q.get('SELECT data, version, published_at FROM problem_versions WHERE problem_id=? AND version=?', pid, ver);
    return { p, row, data: row ? J(row.data) : null };
  }
  function publicProblem(pid, v) {
    const { p, row, data } = versionData(pid, v);
    if (!row) throw notFound('Масъала ҳанӯз нашр нашудааст.');
    const { solution, tests, ...rest } = data;
    return { id: p.id, slug: p.slug, topic: p.topic, version: row.version, currentVersion: p.current_version, published_at: row.published_at, ...rest,
      testCount: tests.length, hiddenCount: tests.filter(t => t.hidden).length };
  }
  const solvedSet = uid => new Set(Q.all("SELECT DISTINCT s.problem_id pid FROM submissions s JOIN gradings g ON g.submission_id=s.id WHERE s.user_id=? AND g.verdict='AC'", uid).map(r => r.pid));

  function gradingView(g, forTeacher) {
    if (!g) return null;
    const d = J(g.details) || {};
    const tests = (d.tests || []).map(t => (t.hidden && !forTeacher)
      ? { i: t.i, hidden: true, tags: t.tags, status: t.status, ms: t.ms, explain: t.explain }
      : t);
    return { verdict: g.verdict, passed: g.passed, total: g.total, failedTags: J(g.failed_tags) || [], finished_at: g.finished_at,
      compile: d.compile, compileExplain: d.compileExplain, detail: d.detail, notConfigured: d.notConfigured, steps: d.steps, tests };
  }
  function submissionView(s, viewer) {
    const forTeacher = viewer.role === 'teacher';
    const g = Q.get('SELECT * FROM gradings WHERE submission_id=?', s.id);
    const pv = Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=?', s.problem_id, s.problem_version);
    const pd = pv ? J(pv.data) : {};
    const cur = Q.get('SELECT current_version FROM problems WHERE id=?', s.problem_id);
    const comments = Q.all('SELECT c.id, c.line, c.text, c.created_at, u.name author FROM comments c JOIN users u ON u.id=c.author_id WHERE submission_id=? ORDER BY c.id', s.id);
    const user = Q.get('SELECT id, name, login FROM users WHERE id=?', s.user_id);
    return { id: s.id, number: s.number, problem_id: s.problem_id, problem_title: pd.title, problem_version: s.problem_version,
      version_is_old: cur && cur.current_version !== s.problem_version, lesson_id: s.lesson_id, assignment_id: s.assignment_id,
      code: s.code, status: s.status, created_at: s.created_at, grading: gradingView(g, forTeacher), comments, user: forTeacher || viewer.id === s.user_id ? user : undefined };
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
    const details = { tests: r.tests, compile: r.compile, compileExplain: explainCompile(r.compile), detail: r.detail, notConfigured: r.notConfigured, steps: r.steps };
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
  function members(gid) {
    return Q.all("SELECT u.id, u.name, u.login FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND m.status='active' ORDER BY u.name", gid);
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
      if (s.problem_id) { const pr = Q.get('SELECT p.current_version v, pv.data FROM problems p JOIN problem_versions pv ON pv.problem_id=p.id AND pv.version=p.current_version WHERE p.id=?', s.problem_id); if (pr) problem = { id: s.problem_id, title: J(pr.data).title, version: pr.v }; }
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
        .map(p => ({ id: p.id, title: J(Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=?', p.id, p.current_version).data).title }));
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
        todayLesson = { ...l, isToday: dushanbeDate(l.scheduled_at) === today, steps: steps.map((s, i) => ({ id: s.id, title: s.title, kind: s.kind, done: done[i] })), currentStep: cur < 0 ? null : cur + 1 };
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
    const all = Q.all('SELECT id, topic FROM problems WHERE current_version>0 ORDER BY position').filter(p => !J(Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=(SELECT current_version FROM problems WHERE id=?)', p.id, p.id).data).lessonOnly);
    const progress = TOPICS.map(t => { const ps = all.filter(p => p.topic === t.key); return { topic: t.key, title: t.title, total: ps.length, solved: ps.filter(p => solved.has(p.id)).length }; });
    return { groups, todayLesson, continue: cont, nearestAssignment: nearest, assignments, progress, recommendation: recommend(u.id, solved, all) };
  }
  function recommend(uid, solved, all) {
    const failed = Q.all(`SELECT g.failed_tags, s.problem_id FROM submissions s JOIN gradings g ON g.submission_id=s.id
      WHERE s.user_id=? AND g.verdict NOT IN ('AC','SE','CE') ORDER BY s.id DESC LIMIT 50`, uid);
    const practice = Q.all('SELECT id, practice_tags, current_version FROM problems WHERE current_version>0');
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
    if (Q.get('SELECT 1 FROM users WHERE login=?', login)) throw bad('Ин логин аллакай банд аст.');
    const id = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES (?,?,?,'student')", login, name, hashPassword(pw)).lastInsertRowid);
    const t = token(); Q.run('INSERT INTO sessions (token, user_id) VALUES (?,?)', t, id);
    return { cookie: t, user: { id, login, name, role: 'student' } };
  });
  R('POST', '/api/login', ({ body }) => {
    const u = Q.get('SELECT * FROM users WHERE login=?', String(body.login || '').trim().toLowerCase());
    if (!u || !checkPassword(String(body.password || ''), u.pass_hash)) throw bad('Логин ё парол нодуруст аст.');
    const t = token(); Q.run('INSERT INTO sessions (token, user_id) VALUES (?,?)', t, u.id);
    return { cookie: t, user: { id: u.id, login: u.login, name: u.name, role: u.role } };
  });
  R('POST', '/api/logout', ({ sid }) => { Q.run('DELETE FROM sessions WHERE token=?', sid || ''); return { cookie: '' }; });
  const storage = () => { const p = persistStatus(); return { ...p, ephemeral: p.mode !== 'postgres' && (!!process.env.RENDER || p.mode === 'invalid') && !String(process.env.DB_FILE || '').startsWith('/data') }; };
  R('GET', '/api/me', ({ user }) => ({ user: user || null, judge: judgeStatus(), storage: user?.role === 'teacher' ? storage() : undefined }));
  R('GET', '/api/health', () => ({ ok: true, storage: storage(), judge: judgeStatus().ok }));
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
    Q.run('UPDATE users SET name=?, login=?, pass_hash=? WHERE id=?', name, login, pw ? hashPassword(pw) : row.pass_hash, row.id);
    if (pw) Q.run('DELETE FROM sessions WHERE user_id=? AND token!=?', row.id, sid || '');
    return { user: { id: row.id, login, name, role: row.role } };
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
        hasLessonToday: !!ls.find(l => dushanbeDate(l.scheduled_at) === today), helpOpen: Q.get("SELECT COUNT(*) c FROM help_requests WHERE group_id=? AND status!='done'", g.id).c };
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
    const mem = Q.all('SELECT u.id, u.name, u.login, m.status, m.created_at FROM group_members m JOIN users u ON u.id=m.user_id WHERE m.group_id=? ORDER BY m.status, u.name', gid);
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
  R('DELETE', '/api/groups/:id/members/:uid', ({ user, params }) => {
    need(user, 'teacher'); const gid = Number(params.id); if (!ownsGroup(user, gid)) throw forbidden();
    Q.run('DELETE FROM group_members WHERE group_id=? AND user_id=?', gid, Number(params.uid)); publish([Number(params.uid)], { type: 'membership', group_id: gid }); return { ok: true };
  });

  // Дарсҳо
  R('GET', '/api/lessons/:id', ({ user, params }) => {
    need(user); const l = lessonFor(user, Number(params.id));
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
    Q.run("UPDATE lessons SET status='live', started_at=COALESCE(started_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')), ended_at=NULL WHERE id=?", l.id);
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
  // Пешфарз ҳамаи масъалаҳо барои шогирд кушодаанд; устод метавонад рӯзҳои ояндаро пӯшад
  const isLocked = (u, l) => u.role !== 'teacher' && l.status !== 'live' && l.status !== 'finished' && dushanbeDate(l.scheduled_at) > dushanbeDate()
    && !!Q.get('SELECT lock_days FROM groups WHERE id=?', l.group_id)?.lock_days;
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
      const state = l.status === 'live' ? 'live' : date === today ? 'today' : locked ? 'locked'
        : (u.role === 'student' && all.length && all.every(id => solved.has(id))) || (u.role === 'teacher' && l.status === 'finished') ? 'done'
        : date < today ? 'progress' : 'planned';
      return { id: l.id, number: l.number, week: w, day: d, kind: l.kind, title: l.title, topic: l.topic, scheduled_at: l.scheduled_at, status: l.status, state, locked,
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
    if (isLocked(user, l)) throw forbidden('Ин рӯз ҳанӯз кушода нашудааст.');
    const sets = lessonSets(l);
    const solved = user.role === 'student' ? solvedSet(user.id) : new Set();
    const mk = ids => ids.map(pid => ({ id: pid, title: titleOf(pid), solved: solved.has(pid) }));
    return { lesson: { id: l.id, number: l.number, title: l.title, kind: l.kind, status: l.status, group_id: l.group_id, scheduled_at: l.scheduled_at },
      sets: { class: mk(sets.class), home: mk(sets.home), extra: mk(sets.extra) } };
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
    return Q.all('SELECT * FROM problems ORDER BY position, id').map(p => {
      const v = p.current_version ? J(Q.get('SELECT data FROM problem_versions WHERE problem_id=? AND version=?', p.id, p.current_version).data) : (J(p.draft) || {});
      if (user.role === 'student' && (!p.current_version || v.lessonOnly)) return null;
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
    return publicProblem(pid, Number(query.v) || undefined);
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
    need(user, 'student'); const pid = Number(params.pid); const pp = publicProblem(pid);
    const d = Q.get('SELECT code, stdin, rev, device, updated_at FROM drafts WHERE user_id=? AND problem_id=?', user.id, pid);
    const saved = Q.all('SELECT id, code, device, created_at FROM draft_conflicts WHERE user_id=? AND problem_id=? ORDER BY id DESC LIMIT 10', user.id, pid);
    return d ? { ...d, saved } : { code: pp.starter || DEFAULT_STARTER, stdin: pp.examples?.[0]?.input || '', rev: 0, saved };
  });
  R('PUT', '/api/drafts/:pid', ({ user, params, body }) => {
    need(user, 'student'); const pid = Number(params.pid); publicProblem(pid);
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
      if (body.problem_id) { const { data } = versionData(Number(body.problem_id)); if (data) lim = { timeMs: data.timeMs, memoryMb: data.memoryMb }; }
      const r = await runOnce(String(body.code ?? ''), String(body.stdin ?? ''), lim);
      return { ...r, compileExplain: explainCompile(r.compile), explain: explainRuntime(r) };
    } finally { running.delete(user.id); }
  });
  R('POST', '/api/submissions', ({ user, body }) => {
    need(user, 'student');
    const pid = Number(body.problem_id); const pp = publicProblem(pid);
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
    publish(groupAudience(h.group_id).slice(0, 1).concat([h.user_id]), { type: 'help', group_id: h.group_id });
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
    res.write(`data: ${JSON.stringify({ type: 'hello' })}\n\n`);
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
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': p === '/index.html' || p === '/sw.js' ? 'no-cache' : 'public, max-age=300' });
    fs.createReadStream(f).pipe(res);
  }
  const cookieOf = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(x => x[0]));

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url);
    const route = routes.find(r => r.method === req.method && r.rx.test(url.pathname));
    const send = (status, obj, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(obj)); };
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
