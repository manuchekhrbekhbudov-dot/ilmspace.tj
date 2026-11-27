// Санҷандаи C++17. Ду драйвер:
//   judge0 — хидмати ҷудошудаи Judge0 (тавсия барои кори воқеӣ)
//   local  — g++ дар ҳамин сервер бо маҳдудиятҳо (барои намоиш/санҷиш дар як компютер)
// Агар ҳеҷ кадом танзим нашуда бошад — ҳолати 'SE' бо сабаби равшан; натиҷаи сохта ҳеҷ гоҳ дода намешавад.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export const LIMITS = {
  timeMs: 2000,         // вақти CPU барои як тест (пешфарз; масъала метавонад иваз кунад)
  memoryMb: 256,
  outputBytes: 64 * 1024,
  compileMs: 30000,
};

export function judgeConfig() {
  const driver = (process.env.JUDGE_DRIVER || 'local').toLowerCase();
  return {
    driver,
    judge0Url: (process.env.JUDGE0_URL || '').replace(/\/$/, ''),
    judge0Key: process.env.JUDGE0_KEY || '',
    judge0KeyHeader: process.env.JUDGE0_KEY_HEADER || 'X-Auth-Token',
    judge0Host: process.env.JUDGE0_RAPIDAPI_HOST || '',
    judge0LangId: Number(process.env.JUDGE0_LANGUAGE_ID || 54),
  };
}

export function judgeStatus() {
  const c = judgeConfig();
  if (c.driver === 'judge0') {
    if (!c.judge0Url) return { ok: false, driver: 'judge0', reason: 'JUDGE0_URL танзим нашудааст.', steps: SETUP_STEPS };
    return { ok: true, driver: 'judge0', url: c.judge0Url };
  }
  if (c.driver === 'local') {
    if (!hasGpp()) return { ok: false, driver: 'local', reason: 'Дар сервер g++ ёфт нашуд.', steps: SETUP_STEPS };
    const I = isolation();
    const full = I.setpriv && I.prlimit && (I.unshare || I.noFiles);
    return { ok: true, driver: 'local', isolation: I, pch: pchStatus(), parallel: MAX_PARALLEL, memoryMb: MEM_MB, warning: full ? undefined : 'Санҷандаи маҳаллӣ бе ҷудокунии пурра кор мекунад — танҳо барои санҷиш дар компютери худ. Барои дарси воқеӣ Judge0 пайваст кунед.' };
  }
  return { ok: false, driver: c.driver, reason: 'Санҷандаи C++ танзим нашудааст (JUDGE_DRIVER).', steps: SETUP_STEPS };
}

const SETUP_STEPS = [
  'Judge0-ро бардоред (docker compose аз github.com/judge0/judge0) ё калиди хидмати Judge0-ро гиред.',
  'Дар файли .env нависед: JUDGE_DRIVER=judge0 ва JUDGE0_URL=http://<суроға>:2358',
  'Агар хидмат калид талаб кунад: JUDGE0_KEY=<калид> (ва JUDGE0_KEY_HEADER, агар лозим бошад).',
  'Серверро аз нав оғоз кунед ва дар саҳифаи «Танзимот» ҳолати санҷандаро бинед.',
];

let gppCache;
function hasGpp() {
  if (gppCache !== undefined) return gppCache;
  try { gppCache = spawnSync('g++', ['--version'], { stdio: 'ignore', timeout: 10000 }).status === 0; } catch { gppCache = false; }
  return gppCache;
}

// ---------- Муқоисаи баромад ----------
export function normalizeOutput(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n').replace(/\n+$/, '');
}
export function firstDiff(expected, actual) {
  const e = normalizeOutput(expected).split('\n');
  const a = normalizeOutput(actual).split('\n');
  for (let i = 0; i < Math.max(e.length, a.length); i++) {
    if ((e[i] ?? null) !== (a[i] ?? null)) {
      const el = e[i] ?? '', al = a[i] ?? '';
      let c = 0; while (c < el.length && c < al.length && el[c] === al[c]) c++;
      return { line: i + 1, col: c + 1, expected: e[i] ?? null, actual: a[i] ?? null };
    }
  }
  return null;
}

// ---------- Навбат (маҳдудияти ҳамзамонӣ) ----------
// Хотираи контейнер (cgroup): дар Render-и ройгон 512 МБ — он гоҳ санҷишҳо як ба як ва хотираи барнома маҳдуд
export function containerMemMb() {
  for (const f of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
    try { const v = fs.readFileSync(f, 'utf8').trim(); if (/^\d+$/.test(v)) { const mb = Number(v) / 1048576; if (mb > 0 && mb < 1e6) return Math.round(mb); } } catch {}
  }
  return Math.round(os.totalmem() / 1048576);
}
const MEM_MB = containerMemMb();
const MAX_PARALLEL = Number(process.env.JUDGE_PARALLEL || (MEM_MB < 1100 ? 1 : 2));
const RUN_MEM_CAP_MB = Number(process.env.JUDGE_MAX_MEMORY_MB || Math.max(64, Math.floor(MEM_MB / 4)));
let active = 0; const waiting = [];
function slot() {
  return new Promise(res => {
    const go = () => { active++; res(() => { active--; const n = waiting.shift(); if (n) n(); }); };
    if (active < MAX_PARALLEL) go(); else waiting.push(go);
  });
}
export function queueDepth() { return waiting.length; }

// ---------- Драйвери маҳаллӣ ----------
const WORK = path.join(os.tmpdir(), 'codelab-judge');
const EXE = process.platform === 'win32' ? 'prog.exe' : 'prog';
fs.mkdirSync(WORK, { recursive: true, mode: 0o755 });

function sh(cmd, args, { input = '', timeoutMs, maxOut = LIMITS.outputBytes, cwd, killAs = null } = {}) {
  return new Promise(resolve => {
    const t0 = Date.now();
    // Муҳити тоза: барномаи шогирд калидҳо ва DATABASE_URL-и серверро намебинад
    const env = { PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', HOME: os.tmpdir(), TMPDIR: os.tmpdir() };
    if (process.platform === 'win32') Object.assign(env, { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP });
    const p = spawn(cmd, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = Buffer.alloc(0), err = Buffer.alloc(0), overflow = false, timedOut = false, killed = false, done = false;
    // Қатъ кардан. Агар барнома аз номи корбари дигар бошад ва сервер ҳуқуқ надошта бошад (EPERM, масалан дар Render),
    // фармони kill аз номи ҳамон корбар иҷро мешавад.
    const kill = () => {
      if (killed || !p.pid) return; killed = true;
      try { process.kill(p.pid, 'SIGKILL'); return; } catch {}
      if (killAs) { try { spawn(killAs[0], [...killAs.slice(1), '/bin/sh', '-c', `kill -9 ${p.pid}`], { stdio: 'ignore' }).on('error', () => {}); } catch {} }
    };
    p.stdout.on('data', d => {
      if (out.length + d.length > maxOut) { overflow = true; out = Buffer.concat([out, d]).subarray(0, maxOut); kill(); }
      else out = Buffer.concat([out, d]);
    });
    p.stderr.on('data', d => { if (err.length < 65536) err = Buffer.concat([err, d]); });
    const timer = setTimeout(() => { timedOut = true; kill(); }, timeoutMs);
    // Агар kill-и аввал нагузарад, пас аз 3 сония боз кӯшиш (ҳеҷ барнома овезон намемонад)
    const guard = setTimeout(() => { if (!done) { killed = false; kill(); } }, timeoutMs + 3000);
    const finish = r => { if (done) return; done = true; clearTimeout(timer); clearTimeout(guard); resolve(r); };
    p.on('error', e => finish({ code: -1, signal: null, out: '', err: String(e), overflow, timedOut, ms: Date.now() - t0, spawnError: true }));
    p.on('close', (code, signal) => finish({ code, signal, out: out.toString('utf8'), err: err.toString('utf8'), overflow, timedOut, ms: Date.now() - t0 }));
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}

const compiled = new Map(); // hash -> {dir, ok, msg}
// Компилятсия: аз номи корбари бе ҳуқуқ ва бо маҳдудият (то #include "/proc/1/environ" ва ғайра кор накунад)
const NOBODY = ['setpriv', '--reuid=65534', '--regid=65534', '--clear-groups', '--'];
const COMPILE_FLAGS = ['-std=c++17', '-O2', '-pipe'];
const COMPILE_AS_MB = Math.max(256, Math.min(768, Math.floor(MEM_MB * 0.75)));
const COMPILE_WALL_MS = MEM_MB < 1100 ? 120000 : LIMITS.compileMs;   // протсессори суст — вақти девор зиёдтар
function compilePrefix() {
  const I = isolation(); const pre = [];
  if (I.setpriv) pre.push(...NOBODY);
  if (I.prlimit) pre.push('prlimit', `--as=${COMPILE_AS_MB * 1024 * 1024}`, '--cpu=60', `--fsize=${64 << 20}`, '--nproc=64');
  return pre;
}

// <bits/stdc++.h>-и пешакӣ компилятсияшуда: компилятсияро ~3 маротиба тез мекунад (махсусан дар Render)
const PCH_DIR = path.join(WORK, 'pch');
let pchReady = false, pchStarted = false;
export function pchStatus() { return pchReady ? 'ready' : pchStarted ? 'building' : 'off'; }
export function ensurePch() {
  if (pchStarted || process.env.JUDGE_PCH === '0' || judgeConfig().driver !== 'local' || !hasGpp()) return;
  pchStarted = true;
  (async () => {
    const release = await slot();
    try {
      const probe = await sh('g++', ['-std=c++17', '-x', 'c++', '-fsyntax-only', '-H', '-'], { input: '#include <bits/stdc++.h>\n', timeoutMs: 300000, maxOut: 1 << 16 });
      const line = probe.err.split('\n').map(l => l.trim()).find(l => /^\. .*stdc\+\+\.h$/.test(l));
      if (!line) return;
      const hdr = path.join(PCH_DIR, 'bits', 'stdc++.h');
      fs.mkdirSync(path.dirname(hdr), { recursive: true, mode: 0o755 });
      fs.copyFileSync(line.slice(2), hdr);
      const r = await sh('g++', [...COMPILE_FLAGS, '-x', 'c++-header', hdr, '-o', hdr + '.gch.tmp'], { timeoutMs: 900000, maxOut: 1 << 20 });
      if (r.code === 0) { fs.renameSync(hdr + '.gch.tmp', hdr + '.gch'); fs.chmodSync(hdr + '.gch', 0o644); pchReady = true; console.log(`Санҷанда: <bits/stdc++.h> пешакӣ компилятсия шуд (${Math.round(r.ms / 1000)} с).`); }
      else console.error('Санҷанда: PCH сохта нашуд —', r.err.slice(0, 200));
    } catch (e) { console.error('Санҷанда: PCH —', e.message); } finally { release(); }
  })();
}

async function localCompile(code) {
  const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 24);
  if (compiled.has(hash)) {
    const c = compiled.get(hash);
    if (!c.ok || fs.existsSync(path.join(c.dir, EXE))) return c;
  }
  const dir = path.join(WORK, hash);
  fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'main.cpp'), code, { mode: 0o644 });
  const I = isolation();
  if (I.setpriv) { try { fs.chownSync(dir, 65534, 65534); } catch {} }
  const pre = compilePrefix();
  const args = [...COMPILE_FLAGS, ...(pchReady ? ['-I', PCH_DIR] : []), ...(I.static ? ['-static'] : []), '-o', EXE, 'main.cpp'];
  const full = [...pre, 'g++', ...args];
  const r = await sh(full[0], full.slice(1), { cwd: dir, timeoutMs: COMPILE_WALL_MS, maxOut: 1 << 20, killAs: I.setpriv ? NOBODY : null });
  let res;
  if (r.spawnError) res = { ok: false, service: true, msg: 'g++ оғоз нашуд: ' + r.err };
  else if (r.timedOut || r.signal) res = { ok: false, msg: `Компилятсия аз маҳдудият гузашт (вақт ё хотира). Код хеле мураккаб аст ё компилятор бор аст — боз кӯшиш кунед.` };
  else if (r.code !== 0) res = { ok: false, msg: r.err.replaceAll(dir + path.sep, '').replaceAll(dir + '/', '').replaceAll(PCH_DIR + '/', '').slice(0, 20000) };
  else { try { fs.chmodSync(path.join(dir, EXE), 0o755); } catch {} res = { ok: true, dir }; }
  res.dir = dir;
  compiled.set(hash, res);
  if (compiled.size > 300) { const k = compiled.keys().next().value; const v = compiled.get(k); compiled.delete(k); fs.rm(v.dir, { recursive: true, force: true }, () => {}); }
  return res;
}

// Кадом воситаҳои ҷудокунӣ дар ин сервер кор мекунанд (як бор санҷида мешавад)
let iso;
// Оё g++ барномаи статикӣ месозад? (он гоҳ барнома ҳангоми оғоз китобхона намекушояд)
function staticWorks() {
  try {
    const dir = fs.mkdtempSync(path.join(WORK, 'probe-'));
    const out = path.join(dir, process.platform === 'win32' ? 'p.exe' : 'p');
    const c = spawnSync('g++', ['-std=c++17', '-static', '-x', 'c++', '-', '-o', out], { input: '#include <iostream>\nint main(){std::cout<<42;}', timeout: 60000 });
    const ok = c.status === 0 && spawnSync(out, [], { timeout: 5000 }).stdout?.toString() === '42';
    fs.rmSync(dir, { recursive: true, force: true });
    return ok;
  } catch { return false; }
}
export function isolation() {
  if (iso) return iso;
  const ok = (cmd, args) => { try { return spawnSync(cmd, args, { stdio: 'ignore', timeout: 3000 }).status === 0; } catch { return false; } };
  iso = {
    unshare: process.platform === 'linux' && ok('unshare', ['-n', 'true']),
    setpriv: process.platform === 'linux' && ok('setpriv', ['--reuid=65534', '--regid=65534', '--clear-groups', '--', 'true']),
    prlimit: process.platform === 'linux' && ok('prlimit', ['--cpu=1', 'true']),
    static: staticWorks(),
  };
  // Бе дескрипторҳои нав (RLIMIT_NOFILE=3): барнома файл ва пайвасти шабака кушода наметавонад
  iso.noFiles = iso.static && iso.prlimit;
  return iso;
}
async function localRun(dir, stdin, lim) {
  const cpuSec = Math.max(1, Math.ceil(lim.timeMs / 1000));
  const I = isolation();
  const cmd = [];
  const asNobody = ['setpriv', '--reuid=65534', '--regid=65534', '--clear-groups', '--'];
  const memMb = Math.min(lim.memoryMb, RUN_MEM_CAP_MB);
  if (I.unshare) cmd.push('unshare', '-n');                                   // бе шабака
  if (I.setpriv) cmd.push(...asNobody);                                        // корбари бе ҳуқуқ
  if (I.prlimit) cmd.push('prlimit', `--as=${memMb * 1024 * 1024}`, `--cpu=${cpuSec}`, `--fsize=${1 << 20}`, '--nproc=64', `--stack=${Math.min(64, memMb / 2) * 1024 * 1024}`, ...(I.noFiles ? ['--nofile=3'] : []));
  cmd.push(path.join(dir, EXE));
  // Вақти CPU-ро ядро (RLIMIT_CPU) назорат мекунад; вақти девор барои протсессори суст (Render) калонтар
  const wallMs = I.prlimit ? Math.max(10000, lim.timeMs * 5) : lim.timeMs * 2 + 500;
  const r = await sh(cmd[0], cmd.slice(1), { input: stdin, timeoutMs: wallMs, maxOut: lim.outputBytes, cwd: dir, killAs: I.setpriv ? asNobody : null });
  if (r.spawnError) return { status: 'SE', detail: r.err };
  if (r.overflow) return { status: 'OLE', stdout: r.out, ms: r.ms };
  if (r.timedOut || r.signal === 'SIGXCPU' || r.signal === 'SIGKILL' || (!I.prlimit && r.ms > lim.timeMs * 1.5 + 300)) return { status: 'TLE', stdout: r.out, ms: r.ms };
  if (/bad_alloc/.test(r.err)) return { status: 'MLE', stdout: r.out, stderr: r.err.slice(0, 2000), ms: r.ms };
  if (r.code !== 0 || r.signal) return { status: 'RE', stdout: r.out, stderr: r.err.slice(0, 2000), exitCode: r.code, signal: r.signal, ms: r.ms };
  return { status: 'OK', stdout: r.out, stderr: r.err.slice(0, 2000), ms: r.ms };
}

// ---------- Драйвери Judge0 ----------
const J0_STATUS = { 3: 'OK', 4: 'OK', 5: 'TLE', 6: 'CE', 7: 'RE', 8: 'RE', 9: 'RE', 10: 'RE', 11: 'RE', 12: 'RE', 13: 'SE', 14: 'SE' };
const b64 = s => Buffer.from(String(s ?? ''), 'utf8').toString('base64');
const unb64 = s => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

async function judge0Run(code, stdin, lim) {
  const c = judgeConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (c.judge0Key) headers[c.judge0KeyHeader] = c.judge0Key;
  if (c.judge0Host) headers['X-RapidAPI-Host'] = c.judge0Host;
  const body = {
    source_code: b64(code), language_id: c.judge0LangId, stdin: b64(stdin),
    compiler_options: '-std=c++17 -O2',
    cpu_time_limit: lim.timeMs / 1000, wall_time_limit: (lim.timeMs * 3) / 1000,
    memory_limit: lim.memoryMb * 1024, max_file_size: 1024,
    enable_network: false,
  };
  let resp;
  try {
    resp = await fetch(`${c.judge0Url}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory,message`, {
      method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    return { status: 'SE', detail: `Хидмати Judge0 ҷавоб надод (${e.cause?.code || e.name}).` };
  }
  if (!resp.ok) return { status: 'SE', detail: `Judge0 ҳолати HTTP ${resp.status} баргардонд.` };
  const j = await resp.json().catch(() => null);
  if (!j || !j.status) return { status: 'SE', detail: 'Ҷавоби Judge0 нофаҳмо буд.' };
  let status = J0_STATUS[j.status.id] || 'SE';
  const stdout = unb64(j.stdout), stderr = unb64(j.stderr);
  if (status === 'RE' && /bad_alloc/.test(stderr)) status = 'MLE';
  if (status === 'OK' && j.memory && j.memory > lim.memoryMb * 1024) status = 'MLE';
  if (Buffer.byteLength(stdout) > lim.outputBytes) status = 'OLE';
  return {
    status, stdout: stdout.slice(0, lim.outputBytes), stderr: stderr.slice(0, 2000),
    compile: unb64(j.compile_output).replaceAll('/box/', ''), ms: j.time ? Math.round(j.time * 1000) : null,
    detail: status === 'SE' ? (j.message ? unb64(j.message) : 'Хатои дохилии Judge0') : undefined,
  };
}

// ---------- Интерфейси умумӣ ----------
function lims(o = {}) { return { ...LIMITS, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v)) }; }

/** Як иҷро бо вуруди дилхоҳ («Иҷро кун»). */
export async function runOnce(code, stdin, limits) {
  const st = judgeStatus();
  if (!st.ok) return { status: 'SE', notConfigured: true, detail: st.reason, steps: st.steps };
  const lim = lims(limits);
  const release = await slot();
  try {
    if (st.driver === 'local') {
      const c = await localCompile(code);
      if (c.service) return { status: 'SE', detail: c.msg };
      if (!c.ok) return { status: 'CE', compile: c.msg };
      return await localRun(c.dir, stdin, lim);
    }
    return await judge0Run(code, stdin, lim);
  } catch (e) {
    return { status: 'SE', detail: 'Хатои санҷанда: ' + e.message };
  } finally { release(); }
}

/** Санҷиш бо ҳамаи тестҳо. tests: [{input, output, hidden, tags}] */
export async function judgeAll(code, tests, limits) {
  const st = judgeStatus();
  if (!st.ok) return { verdict: 'SE', notConfigured: true, detail: st.reason, steps: st.steps, tests: [], passed: 0, total: tests.length, driver: st.driver };
  const lim = lims(limits);
  const release = await slot();
  try {
    let runner;
    if (st.driver === 'local') {
      const c = await localCompile(code);
      if (c.service) return { verdict: 'SE', detail: c.msg, tests: [], passed: 0, total: tests.length, driver: 'local' };
      if (!c.ok) return { verdict: 'CE', compile: c.msg, tests: [], passed: 0, total: tests.length, driver: 'local' };
      runner = t => localRun(c.dir, t.input, lim);
    } else {
      runner = t => judge0Run(code, t.input, lim);
    }
    const results = [];
    for (const [i, t] of tests.entries()) {
      const r = await runner(t);
      if (r.status === 'CE') return { verdict: 'CE', compile: r.compile, tests: [], passed: 0, total: tests.length, driver: st.driver };
      if (r.status === 'SE') return { verdict: 'SE', detail: r.detail, tests: results, passed: 0, total: tests.length, driver: st.driver };
      let status = r.status;
      let diff = null;
      if (status === 'OK') {
        diff = firstDiff(t.output, r.stdout);
        status = diff ? 'WA' : 'AC';
      }
      results.push({ i: i + 1, hidden: !!t.hidden, tags: t.tags || [], status, input: t.input, expected: t.output, actual: r.stdout ?? '', stderr: r.stderr || '', diff, ms: r.ms ?? null });
    }
    const passed = results.filter(r => r.status === 'AC').length;
    const firstBad = results.find(r => r.status !== 'AC');
    return { verdict: firstBad ? firstBad.status : 'AC', tests: results, passed, total: tests.length, driver: st.driver };
  } catch (e) {
    return { verdict: 'SE', detail: 'Хатои санҷанда: ' + e.message, tests: [], passed: 0, total: tests.length, driver: st.driver };
  } finally { release(); }
}
