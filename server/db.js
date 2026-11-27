// SQLite база (node:sqlite, бе вобастагии беруна)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher','student')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  start_date TEXT NOT NULL,          -- YYYY-MM-DD (Душанбе)
  lesson_time TEXT NOT NULL,         -- HH:MM (Душанбе)
  weekdays TEXT NOT NULL,            -- '1,2,3,4,5,6' (1=душанбе)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','active')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  topic TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  current_version INTEGER NOT NULL DEFAULT 0,  -- 0 = ҳанӯз нашр нашудааст
  draft TEXT,                                   -- JSON-и таҳрири нашрнашуда
  practice_tags TEXT NOT NULL DEFAULT '[]'      -- барои кадом тамғаҳо машқ аст
);

CREATE TABLE IF NOT EXISTS problem_versions (
  id INTEGER PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,                -- JSON: title, level, statement, ..., tests, solution
  published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (problem_id, version)
);

CREATE TABLE IF NOT EXISTS lesson_templates (
  id INTEGER PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  steps TEXT NOT NULL,               -- JSON
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,        -- UTC ISO
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','live','finished')),
  started_at TEXT,
  ended_at TEXT,
  homework_problem_ids TEXT NOT NULL DEFAULT '[]'   -- пешниҳоди вазифаи хонагӣ
);

CREATE TABLE IF NOT EXISTS lesson_steps (
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('predict','problem','quiz')),
  title TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  problem_id INTEGER REFERENCES problems(id),
  skipped INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS step_responses (
  id INTEGER PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  answer TEXT NOT NULL,
  correct INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (step_id, user_id)
);

-- Ҳосили иҷрои воқеии коди қадами «Пешгӯӣ кун» (як бор иҷро, кэш)
CREATE TABLE IF NOT EXISTS predict_outputs (
  step_id INTEGER PRIMARY KEY REFERENCES lesson_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  stdout TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Нусхаи машқӣ (draft) — алоҳида аз кӯшишҳо
CREATE TABLE IF NOT EXISTS drafts (
  user_id INTEGER NOT NULL REFERENCES users(id),
  problem_id INTEGER NOT NULL REFERENCES problems(id),
  code TEXT NOT NULL,
  stdin TEXT NOT NULL DEFAULT '',
  rev INTEGER NOT NULL DEFAULT 1,
  device TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, problem_id)
);

-- Нусхаҳое, ки ҳангоми ихтилоф нигоҳ дошта шуданд (ҳеҷ чиз гум намешавад)
CREATE TABLE IF NOT EXISTS draft_conflicts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  device TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Кӯшиши фиристодашуда: нусхаи дақиқи код дар лаҳзаи фиристодан
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  problem_id INTEGER NOT NULL REFERENCES problems(id),
  problem_version INTEGER NOT NULL,
  number INTEGER NOT NULL,                 -- рақами кӯшиш барои ин шогирд/масъала
  lesson_id INTEGER REFERENCES lessons(id),
  assignment_id INTEGER,
  code TEXT NOT NULL,
  client_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, client_token)
);

-- Натиҷаи баҳогузорӣ — алоҳида аз кӯшиш
CREATE TABLE IF NOT EXISTS gradings (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL,   -- AC WA CE RE TLE MLE OLE SE
  passed INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  failed_tags TEXT NOT NULL DEFAULT '[]',
  details TEXT NOT NULL DEFAULT '{}',
  driver TEXT,
  finished_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Шарҳи устод ба сатри муайяни як кӯшиш
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  line INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  group_id INTEGER NOT NULL REFERENCES groups(id),
  lesson_id INTEGER REFERENCES lessons(id),
  problem_id INTEGER REFERENCES problems(id),
  submission_id INTEGER REFERENCES submissions(id),
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','taken','done')),
  taken_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  done_at TEXT
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id),
  title TEXT NOT NULL,
  problem_ids TEXT NOT NULL,      -- JSON
  due_at TEXT NOT NULL,           -- UTC ISO
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS projector_state (
  lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,          -- JSON-и аллакай тозашуда
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_sub_user_problem ON submissions(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_sub_lesson ON submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_help_group ON help_requests(group_id, status);
`;

export function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  // Муҳоҷират: сохтори «ҳафта → рӯз → маҷмӯаҳо»
  const cols = db.prepare('PRAGMA table_info(lessons)').all().map(c => c.name);
  if (!cols.includes('kind')) db.exec("ALTER TABLE lessons ADD COLUMN kind TEXT NOT NULL DEFAULT 'lesson'");
  if (!cols.includes('extra_problem_ids')) db.exec("ALTER TABLE lessons ADD COLUMN extra_problem_ids TEXT NOT NULL DEFAULT '[]'");
  return db;
}

// Ёрирасонҳои хурд
export function q(db) {
  return {
    get: (sql, ...p) => db.prepare(sql).get(...p),
    all: (sql, ...p) => db.prepare(sql).all(...p),
    run: (sql, ...p) => db.prepare(sql).run(...p),
    tx(fn) {
      db.exec('BEGIN');
      try { const r = fn(); db.exec('COMMIT'); return r; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}
