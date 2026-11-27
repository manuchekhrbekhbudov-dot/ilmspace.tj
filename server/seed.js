// Пур кардани база: масъалаҳо, дарси намунавӣ, ҳисобҳои намоишӣ ва гурӯҳи омода
import fs from 'node:fs';
import { PROBLEMS, LESSON_PROBLEMS, TOPICS, DEFAULT_STARTER } from './seed/problems.js';
import { hashPassword, inviteCode, lessonDates, localToUtcIso } from './util.js';

const R = String.raw;

export const CONDITIONS_TEMPLATE = {
  title: 'Шартҳо дар C++',
  topic: 'cond',
  steps: [
    {
      kind: 'predict', title: 'Пешгӯӣ кун',
      payload: {
        question: 'Барои a = 5 ва b = 5 кадом сатр чоп мешавад? Пеш аз иҷро ҷавоби худро нависед.',
        input: '5 5\n',
        code: R`#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    if (a > b) {
        cout << "Якум калон аст" << endl;
    } else {
        cout << "Якум калон нест" << endl;
    }
    return 0;
}`,
      },
    },
    { kind: 'problem', title: 'Худат ҳал кун', problem_slug: 'cond-1', payload: {} },
    { kind: 'problem', title: 'Хаторо ёб', problem_slug: 'cond-fix', payload: { mode: 'fix' } },
    {
      kind: 'quiz', title: 'Санҷиши охири дарс',
      payload: {
        question: 'Кадом вуруд фарқи байни > ва >=-ро нишон медиҳад?',
        options: ['a = 7, b = 3', 'a = 5, b = 5', 'a = 2, b = 9', 'Ҳар кадоме аз инҳо'],
        correct: 1,
        explain: 'Танҳо вақте a == b, шарти a > b нодуруст, вале a >= b дуруст аст.',
      },
    },
  ],
};

export function problemData(p) {
  return {
    title: p.title, level: p.level, statement: p.statement, input: p.input, output: p.output,
    constraints: p.constraints, examples: p.examples, hints: p.hints, solution: p.solution,
    starter: p.starter || DEFAULT_STARTER, tests: p.tests, timeMs: p.timeMs || 2000, memoryMb: p.memoryMb || 256,
    lessonOnly: !!p.lessonOnly,
  };
}

export function seedProblems(Q, ownerId) {
  const all = [...PROBLEMS, ...LESSON_PROBLEMS];
  for (const [i, p] of all.entries()) {
    if (Q.get('SELECT id FROM problems WHERE slug=?', p.slug)) continue;
    const pos = PROBLEMS.indexOf(p) >= 0 ? PROBLEMS.indexOf(p) : 100 + i;
    const r = Q.run('INSERT INTO problems (slug, owner_id, topic, position, current_version, practice_tags) VALUES (?,?,?,?,1,?)',
      p.slug, ownerId, p.topic, pos, JSON.stringify(p.practice_tags || []));
    Q.run('INSERT INTO problem_versions (problem_id, version, data) VALUES (?,1,?)', r.lastInsertRowid, JSON.stringify(problemData(p)));
  }
}

// Курси 1-моҳа аз content/*.py → seed/course.json (220 масъала, 24 рӯз)
//   Ҳафтаи 1: + − × / %, чоп · Ҳафтаи 2: if/else · Ҳафтаи 3: while ва тақсим · Ҳафтаи 4: for
// Ҳар рӯзи дарс: 4 синфӣ, 3 хонагӣ, 3 иловагӣ. Имтиҳон: A (2), B (2), мураккаб (1).
export const COURSE = JSON.parse(fs.readFileSync(new URL('./seed/course.json', import.meta.url), 'utf8'));
export const COURSE_VERSION = '2';

export function seedCourse(Q, ownerId) {
  const hintsOf = new Map();
  for (const d of COURSE.days) for (const id of d.ids) hintsOf.set(id, d.hints);
  COURSE.problems.forEach((p, i) => {
    if (Q.get('SELECT id FROM problems WHERE slug=?', p.slug)) return;
    const r = Q.run('INSERT INTO problems (slug, owner_id, topic, position, current_version, practice_tags) VALUES (?,?,?,?,1,?)', p.slug, ownerId, p.topic, 1000 + i, '[]');
    Q.run('INSERT INTO problem_versions (problem_id, version, data) VALUES (?,1,?)', r.lastInsertRowid, JSON.stringify(problemData({ ...p, hints: hintsOf.get(p.slug) || [] })));
  });
}

export function coursePlan() {
  return COURSE.days.map(d => d.kind === 'exam'
    ? { kind: 'exam', week: d.week, day: d.day, title: d.title, topic: d.topic, class: d.ids.slice(0, 2), home: d.ids.slice(2, 4), extra: d.ids.slice(4) }
    : { kind: 'lesson', week: d.week, day: d.day, title: d.title, topic: d.topic, class: d.ids.slice(0, 4), home: d.ids.slice(4, 7), extra: d.ids.slice(7) });
}

// Як дарсро аз рӯи нақша пур мекунад (маҷмӯаҳо ва қадамҳои масъала)
export function fillLesson(Q, lessonId, p) {
  const ids = slugs => slugs.map(sl => Q.get('SELECT id FROM problems WHERE slug=?', sl)?.id).filter(Boolean);
  Q.run('DELETE FROM lesson_steps WHERE lesson_id=?', lessonId);
  Q.run('UPDATE lessons SET title=?, topic=?, kind=?, homework_problem_ids=?, extra_problem_ids=? WHERE id=?',
    p.title, p.topic, p.kind, JSON.stringify(ids(p.home)), JSON.stringify(ids(p.extra)), lessonId);
  ids(p.class).forEach((pid, j) => Q.run("INSERT INTO lesson_steps (lesson_id, position, kind, title, problem_id) VALUES (?,?,'problem',?,?)",
    lessonId, j + 1, p.kind === 'exam' ? 'Имтиҳон A' : 'Масъалаи синфӣ', pid));
}

// Муҳоҷират: курси навро ба базаи мавҷуда (Supabase) мегузорад. Дарсҳои оғознашуда ва пӯшида аз нав пур мешаванд.
export function migrateCourse(Q) {
  Q.run('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)');
  if (Q.get("SELECT value FROM meta WHERE key='course_version'")?.value === COURSE_VERSION) return false;
  Q.tx(() => {
    const owner = Q.get("SELECT id FROM users WHERE role='teacher' ORDER BY id LIMIT 1")?.id ?? null;
    seedCourse(Q, owner);
    const plan = coursePlan();
    for (const g of Q.all('SELECT id FROM groups')) {
      Q.all('SELECT * FROM lessons WHERE group_id=? ORDER BY scheduled_at, number', g.id).forEach((l, i) => {
        if (l.status === 'planned' && !l.opened) fillLesson(Q, l.id, plan[i % plan.length]);
      });
    }
    Q.run("INSERT INTO meta (key, value) VALUES ('course_version', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", COURSE_VERSION);
  });
  return true;
}

export function createGroup(Q, { teacherId, name, startDate, lessonTime = '14:00', weekdays = '1,2,3,4,5,6', count = 24 }) {
  let code; do { code = inviteCode(); } while (Q.get('SELECT 1 FROM groups WHERE invite_code=?', code));
  const g = Q.run('INSERT INTO groups (teacher_id, name, invite_code, start_date, lesson_time, weekdays) VALUES (?,?,?,?,?,?)',
    teacherId, name, code, startDate, lessonTime, weekdays);
  const gid = Number(g.lastInsertRowid);
  const dates = lessonDates(startDate, weekdays, count);
  const plan = coursePlan();
  dates.forEach((d, i) => {
    const p = plan[i % plan.length];
    const l = Q.run('INSERT INTO lessons (group_id, number, title, topic, scheduled_at, kind) VALUES (?,?,?,?,?,?)', gid, i + 1, p.title, p.topic, localToUtcIso(d, lessonTime), p.kind);
    fillLesson(Q, Number(l.lastInsertRowid), p);
  });
  return gid;
}

export function applyTemplate(Q, lessonId, tpl) {
  Q.run('DELETE FROM lesson_steps WHERE lesson_id=?', lessonId);
  tpl.steps.forEach((s, i) => {
    let pid = s.problem_id || null;
    if (!pid && s.problem_slug) pid = Q.get('SELECT id FROM problems WHERE slug=?', s.problem_slug)?.id ?? null;
    Q.run('INSERT INTO lesson_steps (lesson_id, position, kind, title, payload, problem_id) VALUES (?,?,?,?,?,?)',
      lessonId, i + 1, s.kind, s.title, JSON.stringify(s.payload || {}), pid);
  });
  Q.run('UPDATE lessons SET title=?, topic=? WHERE id=?', tpl.title, tpl.topic, lessonId);
}

export function seedDemo(Q) {
  if (Q.get('SELECT 1 FROM users LIMIT 1')) return false;
  return Q.tx(() => {
    const pw = hashPassword('ilmspace');
    const t = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES ('ustod','Устоди намоишӣ',?, 'teacher')", pw).lastInsertRowid);
    const s1 = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES ('shogird','Шогирди намоишӣ',?, 'student')", pw).lastInsertRowid);
    const s2 = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES ('begona','Шогирди гурӯҳи дигар',?, 'student')", pw).lastInsertRowid);
    seedProblems(Q, t);
    seedCourse(Q, t);
    Q.run('INSERT INTO lesson_templates (owner_id, title, topic, steps) VALUES (?,?,?,?)', t, CONDITIONS_TEMPLATE.title, CONDITIONS_TEMPLATE.topic, JSON.stringify(CONDITIONS_TEMPLATE.steps));
    const start = process.env.COURSE_START || '2026-11-28';
    const g1 = createGroup(Q, { teacherId: t, name: 'C++ асосӣ — гурӯҳи 1', startDate: start });
    const g2 = createGroup(Q, { teacherId: t, name: 'C++ асосӣ — гурӯҳи 2', startDate: start, lessonTime: '16:00' });
    Q.run("INSERT INTO group_members (group_id, user_id, status) VALUES (?,?,'active')", g1, s1);
    Q.run("INSERT INTO group_members (group_id, user_id, status) VALUES (?,?,'active')", g2, s2);
    return true;
  });
}

// Ҳисоби устод аз танзимоти сервер (TEACHER_LOGIN, TEACHER_PASSWORD, TEACHER_NAME).
// Агар чунин логин набошад, ҳисоби намоишии «ustod» (бо гурӯҳҳо ва дарси омода) ба он табдил меёбад.
export function ensureTeacher(Q, env = process.env) {
  const login = String(env.TEACHER_LOGIN || '').trim().toLowerCase();
  const pw = String(env.TEACHER_PASSWORD || '');
  if (!login) return null;
  if (pw.length < 8) { console.log('TEACHER_PASSWORD бояд ҳадди ақал 8 аломат бошад — ҳисоби устод сохта нашуд.'); return null; }
  const name = String(env.TEACHER_NAME || '').trim() || 'Устод';
  const ex = Q.get('SELECT id, role FROM users WHERE login=?', login);
  if (ex) {
    Q.run("UPDATE users SET pass_hash=?, name=?, role='teacher' WHERE id=?", hashPassword(pw), name, ex.id);
    return { id: ex.id, login, created: false };
  }
  const demo = Q.get("SELECT id FROM users WHERE login='ustod' AND role='teacher'");
  if (demo) {
    Q.run('UPDATE users SET login=?, name=?, pass_hash=? WHERE id=?', login, name, hashPassword(pw), demo.id);
    Q.run('DELETE FROM sessions WHERE user_id=?', demo.id);
    return { id: demo.id, login, created: false, fromDemo: true };
  }
  const id = Number(Q.run("INSERT INTO users (login, name, pass_hash, role) VALUES (?,?,?,'teacher')", login, name, hashPassword(pw)).lastInsertRowid);
  return { id, login, created: true };
}
