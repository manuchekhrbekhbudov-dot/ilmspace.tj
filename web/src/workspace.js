// Муҳити коднависии шогирд
import { html, useState, useEffect, useRef, useCallback, api, store, uuid, deviceId, toast, useEvents, Verdict, fTime, fDateTime, Loading, ErrorBox, Modal, CodeView, DiffView, TOPIC } from './lib.js';
import { CodeEditor, search, gotoLine } from './editor.js';
import { RunResult, SubmissionResult } from './result.js';

function useResizer(varName, key, def, axis, min, max) {
  const [size, setSize] = useState(store.get(key, def));
  const start = e => {
    e.preventDefault();
    const el = e.currentTarget; el.classList.add('drag');
    const startPos = axis === 'x' ? e.clientX : e.clientY, s0 = size;
    const move = ev => { const p = axis === 'x' ? ev.clientX : ev.clientY; const d = axis === 'x' ? p - startPos : startPos - p; setSize(Math.min(max(), Math.max(min, s0 + d))); };
    const up = () => { el.classList.remove('drag'); removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };
  useEffect(() => { store.set(key, size); }, [size]);
  const onKey = e => { const k = { ArrowLeft: -20, ArrowUp: 20, ArrowRight: 20, ArrowDown: -20 }[e.key]; if (k) setSize(s => Math.min(max(), Math.max(min, s + (axis === 'x' ? k : (e.key === 'ArrowUp' ? 20 : -20))))); };
  return [size, start, onKey, varName];
}

export function Workspace({ user, pid, lessonId, exam }) {
  const [problem, setProblem] = useState(() => store.get(`prob:${pid}`));
  const [loadErr, setLoadErr] = useState(null);
  const [code, setCode] = useState(null);
  const [stdin, setStdin] = useState('');
  const [save, setSave] = useState('saved');
  const [conflict, setConflict] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selId, setSelId] = useState(null);
  const [bottom, setBottom] = useState('run');
  const [mtab, setMtab] = useState('statement');
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [expected, setExpected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fs, setFs] = useState(store.get('fontSize', 15));
  const [full, setFull] = useState(false);
  const [hints, setHints] = useState(store.get(`hints:${user.id}:${pid}`, 0));
  const [help, setHelp] = useState(false);
  const [cmp, setCmp] = useState([]);
  const view = useRef(null);
  const key = `draft:${user.id}:${pid}`;
  const st = useRef({ code: '', stdin: '', baseRev: 0, dirty: false, timer: null, token: null });

  const [leftW, startL, keyL] = useResizer('--left', 'ws:left', 440, 'x', 280, () => innerWidth - 420);
  const [botH, startB, keyB] = useResizer('--bottom', 'ws:bottom', 300, 'y', 120, () => innerHeight - 220);

  // Масъала (бо нусхаи маҳаллӣ барои кор бе интернет)
  useEffect(() => {
    api(`/api/problems/${pid}`).then(p => { setProblem(p); store.set(`prob:${pid}`, p); setLoadErr(null); })
      .catch(e => { if (!store.get(`prob:${pid}`)) setLoadErr(e); });
  }, [pid]);

  // Нусхаи машқӣ: сервер + дастгоҳ
  useEffect(() => {
    let alive = true;
    const local = store.get(key);
    (async () => {
      try {
        const srv = await api(`/api/drafts/${pid}`);
        if (!alive) return;
        if (local && local.dirty && local.code !== srv.code) {
          if (local.baseRev === srv.rev) { adopt(local.code, local.stdin, srv.rev, true); doSave(); }
          else { adopt(local.code, local.stdin, local.baseRev, true); setConflict({ server: srv, local }); setSave('conflict'); }
        } else adopt(srv.code, srv.stdin ?? '', srv.rev, false);
      } catch (e) {
        if (!alive) return;
        const p = store.get(`prob:${pid}`);
        if (local) adopt(local.code, local.stdin, local.baseRev, local.dirty);
        else adopt(p?.starter || '', p?.examples?.[0]?.input || '', 0, true);
        setSave('local');
      }
    })();
    loadAttempts();
    const online = () => { if (st.current.dirty) doSave(); };
    addEventListener('online', online);
    return () => { alive = false; removeEventListener('online', online); clearTimeout(st.current.timer); };
  }, [pid]);

  function adopt(c, i, rev, dirty) {
    Object.assign(st.current, { code: c, stdin: i, baseRev: rev, dirty });
    store.set(key, { code: c, stdin: i, baseRev: rev, dirty });
    setCode(c); setStdin(i);
    if (!dirty) setSave('saved');
  }
  const persistLocal = () => store.set(key, { code: st.current.code, stdin: st.current.stdin, baseRev: st.current.baseRev, dirty: st.current.dirty });

  async function doSave(force = false) {
    clearTimeout(st.current.timer);
    const sent = st.current.code, sentIn = st.current.stdin;
    setSave('saving');
    try {
      const r = await api(`/api/drafts/${pid}`, { method: 'PUT', body: { code: sent, stdin: sentIn, baseRev: st.current.baseRev, device: deviceId(), force } });
      st.current.baseRev = r.rev;
      if (st.current.code === sent && st.current.stdin === sentIn) { st.current.dirty = false; setSave('saved'); }
      persistLocal();
    } catch (e) {
      if (e.status === 409) { setConflict({ server: e.data.server, local: { code: st.current.code, stdin: st.current.stdin } }); setSave('conflict'); }
      else setSave('local');
      persistLocal();
    }
  }
  const onCode = useCallback(c => {
    st.current.code = c; st.current.dirty = true; persistLocal(); setCode(c);
    if (save === 'conflict') return;
    setSave(navigator.onLine ? 'saving' : 'local');
    clearTimeout(st.current.timer); st.current.timer = setTimeout(() => doSave(), 900);
  }, [save]);
  const onStdin = v => { st.current.stdin = v; st.current.dirty = true; setStdin(v); persistLocal(); clearTimeout(st.current.timer); st.current.timer = setTimeout(() => doSave(), 900); };

  async function resolve(choice) {
    const c = conflict; setConflict(null);
    if (choice === 'local') { await doSave(true); toast('Нусхаи ин дастгоҳ нигоҳ дошта шуд. Нусхаи дигар ҳам захира аст.'); }
    else {
      try { await api(`/api/drafts/${pid}/keep`, { method: 'POST', body: { code: c.local.code, device: deviceId() } }); } catch {}
      adopt(c.server.code, c.server.stdin ?? st.current.stdin, c.server.rev, false);
      toast('Нусхаи дигар гирифта шуд. Нусхаи ин дастгоҳ ҳам захира аст.');
    }
  }

  // Кӯшишҳо
  async function loadAttempts() {
    try { const a = await api(`/api/submissions?problem_id=${pid}`); setAttempts(a); return a; } catch { return null; }
  }
  useEvents(ev => { if ((ev.type === 'submission' || ev.type === 'comment') && Number(ev.problem_id) === Number(pid)) loadAttempts(); }, [pid]);
  useEffect(() => {
    if (!attempts.some(a => a.status !== 'done')) return;
    const t = setInterval(loadAttempts, 2000); return () => clearInterval(t);
  }, [attempts]);

  async function doRun(input = stdin, exp = null) {
    if (running) return;
    setRunning(true); setBottom('run'); setMtab('result'); setExpected(exp); setRun(null);
    try { setRun(await api('/api/run', { method: 'POST', body: { problem_id: pid, code: st.current.code, stdin: input } })); }
    catch (e) { setRun({ status: 'SE', detail: e.message }); }
    finally { setRunning(false); }
  }
  async function doSubmit() {
    if (submitting) return;
    setSubmitting(true);
    const tok = st.current.token || (st.current.token = uuid());
    try {
      const s = await api('/api/submissions', { method: 'POST', body: { problem_id: pid, code: st.current.code, client_token: tok, lesson_id: lessonId || undefined } });
      st.current.token = null;
      setAttempts(a => [s, ...a.filter(x => x.id !== s.id)]); setSelId(s.id); setBottom('attempt'); setMtab('result');
    } catch (e) {
      toast(e.data?.offline ? 'Фиристода нашуд: интернет нест. Код дар дастгоҳ нигоҳ дошта шуд — баъдтар «Фирист»-ро пахш кунед.' : e.message);
    } finally { setSubmitting(false); }
  }
  const tryExample = ex => { onStdin(ex.input); doRun(ex.input, ex.output); };
  const openHint = () => { const n = hints + 1; setHints(n); store.set(`hints:${user.id}:${pid}`, n); };
  const setFont = d => { const n = Math.min(26, Math.max(11, fs + d)); setFs(n); store.set('fontSize', n); };
  const jump = n => { setMtab('code'); setTimeout(() => gotoLine(view.current, n), 30); };

  if (loadErr) return html`<div class="page"><${ErrorBox} error=${loadErr} /></div>`;
  if (!problem || code === null) return html`<${Loading} />`;
  const sel = attempts.find(a => a.id === selId) || attempts[0];
  const solved = attempts.some(a => a.grading?.verdict === 'AC');
  const SAVE = { saved: ['ok', '✓ Захира шуд'], saving: ['saving', 'Захира мешавад…'], local: ['local', '● Дар ин дастгоҳ нигоҳ дошта шуд'], conflict: ['conflict', '⚠ Ҳамоҳангсозӣ лозим аст'] }[save];

  const actions = html`
    <button class="btn" onClick=${() => doRun()} disabled=${running} aria-label="Иҷро кун">${running ? html`<span class="spin"></span>` : '▶'} Иҷро кун</button>
    <button class="btn p" onClick=${doSubmit} disabled=${submitting} data-testid="submit">${submitting ? html`<span class="spin"></span>` : ''} <span class="long">Барои санҷиш фирист</span><span class="short">Фирист</span></button>`;

  return html`<div class=${'ws t-' + mtab} style=${`--left:${leftW}px;--bottom:${botH}px`}>
    <div class="mtabs" role="tablist">
      ${[['statement', 'Шарт'], ['code', 'Код'], ['result', 'Натиҷа']].map(([k, t]) => html`<button role="tab" aria-selected=${mtab === k} class=${mtab === k ? 'on' : ''} onClick=${() => setMtab(k)}>${t}${k === 'result' && sel && !sel.grading ? ' ◷' : ''}</button>`)}
    </div>
    <section class="ws-left" aria-label="Шарти масъала">
      <div class="row" style="margin-bottom:6px">
        <span class=${'save ' + SAVE[0]} role="status" data-testid="save-state">${SAVE[1]}</span>
        ${solved && html`<span class="v v-ok">✓ Ҳал шуд</span>`}
      </div>
      <h1>${problem.title}</h1>
      <div class="row" style="margin:8px 0 14px;gap:6px">
        <span class="chip">${TOPIC[problem.topic] || problem.topic}</span><span class="chip">${problem.level}</span>
        <span class="chip">${(problem.timeMs || 2000) / 1000} с · ${problem.memoryMb || 256} МБ</span><span class="chip">версияи ${problem.version}</span>
      </div>
      <p style="white-space:pre-wrap">${problem.statement}</p>
      ${problem.input && html`<h3 style="margin-top:14px">Вуруд</h3><p>${problem.input}</p>`}
      ${problem.output && html`<h3>Баромад</h3><p>${problem.output}</p>`}
      ${problem.constraints && html`<h3>Маҳдудиятҳо</h3><p class="mono">${problem.constraints}</p>`}
      <h3 style="margin-top:14px">Мисолҳо</h3>
      ${problem.examples.map((ex, i) => html`<div class="ex">
        <div class="row" style="margin-bottom:6px"><b>Мисоли ${i + 1}</b><div class="spacer"></div><button class="btn sm" onClick=${() => tryExample(ex)} disabled=${running}>Бо ҳамин вуруд санҷ</button></div>
        <div class="io3" style="grid-template-columns:1fr 1fr"><div><div class="kicker">Вуруд</div><pre>${ex.input}</pre></div><div><div class="kicker">Баромад</div><pre>${ex.output}</pre></div></div>
        ${ex.explain && html`<div class="small muted" style="margin-top:6px">${ex.explain}</div>`}
      </div>`)}
      ${!exam && problem.hints?.filter(Boolean).length > 0 && html`<h3 style="margin-top:14px">Ишораҳо</h3>
        ${problem.hints.filter(Boolean).slice(0, hints).map((t, i) => html`<div class="notice" style="margin-bottom:8px"><b>${i + 1}.</b> ${t}</div>`)}
        ${hints < problem.hints.filter(Boolean).length ? html`<button class="btn" onClick=${openHint}>Ишораи ${hints + 1}-ро кушо</button>` : html`<div class="small muted">Ҳамаи ишораҳо кушода шуданд.</div>`}`}

    </section>
    <div class="resizer" role="separator" aria-orientation="vertical" aria-label="Бари панелҳо" tabindex="0" onPointerDown=${startL} onKeyDown=${keyL}></div>
    <section class="ws-right" aria-label="Код ва натиҷа">
      <div class="toolbar">
        <span class="chip mono">C++17</span>
        <span class="spacer"></span>
        <button class="btn icon-btn" title="Ҷустуҷӯ (Ctrl+F)" aria-label="Ҷустуҷӯ" onClick=${() => search(view.current)}>🔍</button>
        <button class="btn icon-btn" title="Шрифти хурдтар" aria-label="Шрифти хурдтар" onClick=${() => setFont(-1)}>A−</button>
        <button class="btn icon-btn" title="Шрифти калонтар" aria-label="Шрифти калонтар" onClick=${() => setFont(1)}>A+</button>
        <button class="btn icon-btn" title="Пурраэкран (Esc — баромадан)" aria-label="Пурраэкран" onClick=${() => setFull(f => !f)}>⛶</button>
        <span class="desk row" style="gap:6px">${actions}</span>
      </div>
      <div class=${'editor-host' + (full ? ' full' : '')} onKeyDown=${e => e.key === 'Escape' && full && setFull(false)}>
        ${full && html`<div class="toolbar"><b>${problem.title}</b><span class=${'save ' + SAVE[0]}>${SAVE[1]}</span><span class="spacer"></span>${actions}<button class="btn" onClick=${() => setFull(false)}>Баромадан</button></div>`}
        <div style=${full ? 'height:calc(100% - 53px)' : 'height:100%'}>
          <${CodeEditor} value=${code} onChange=${onCode} fontSize=${fs} onReady=${v => (view.current = v)} />
        </div>
      </div>
      <div class="resizer h" role="separator" aria-orientation="horizontal" aria-label="Баландии натиҷа" tabindex="0" onPointerDown=${startB} onKeyDown=${keyB}></div>
      <div class="out" aria-live="polite">
        <div class="tabs" role="tablist">
          <button class=${bottom === 'run' ? 'on' : ''} onClick=${() => setBottom('run')}>Иҷро</button>
          <button class=${bottom === 'attempt' ? 'on' : ''} onClick=${() => setBottom('attempt')}>Натиҷаи санҷиш${sel && !sel.grading ? ' ◷' : ''}</button>
          <button class=${bottom === 'history' ? 'on' : ''} onClick=${() => setBottom('history')}>Кӯшишҳо (${attempts.length})</button>
        </div>
        ${bottom === 'run' && html`<div class="col" style="gap:10px">
          <label class="f">Вуруд (stdin)<textarea class="i mono" rows="3" value=${stdin} onInput=${e => onStdin(e.target.value)} placeholder="Масалан: 5 5"></textarea></label>
          ${running && html`<div class="muted"><span class="spin"></span> Иҷро мешавад…</div>`}
          ${!running && !run && html`<div class="muted small">«Иҷро кун» кодро бо ҳамин вуруд иҷро мекунад. «Барои санҷиш фирист» нусхаи ҳозираи кодро бо ҳамаи тестҳо месанҷад.</div>`}
          <${RunResult} r=${run} expected=${expected} onLine=${jump} />
        </div>`}
        ${bottom === 'attempt' && (sel ? html`<div class="col">
            <${SubmissionResult} s=${sel} onLine=${jump} currentCode=${code} />
            ${sel.comments?.length > 0 && html`<div><h3>Шарҳи устод ба кӯшиши №${sel.number}</h3><${CodeView} code=${sel.code} comments=${sel.comments} /></div>`}
            ${!sel.comments?.length && html`<details><summary class="small muted" style="cursor:pointer">Коди ҳамин кӯшиш</summary><${CodeView} code=${sel.code} /></details>`}
          </div>` : html`<div class="muted">Ҳанӯз кӯшиш нест. Вақте омода шудед, «Барои санҷиш фирист»-ро пахш кунед.</div>`)}
        ${bottom === 'history' && html`<${History} attempts=${attempts} cmp=${cmp} setCmp=${setCmp} open=${id => { setSelId(id); setBottom('attempt'); }} />`}
      </div>
    </section>
    <div class="mbar">${actions}</div>
    ${conflict && html`<${ConflictModal} c=${conflict} onPick=${resolve} />`}
  </div>`;
}

function History({ attempts, cmp, setCmp, open }) {
  if (!attempts.length) return html`<div class="muted">Ҳанӯз кӯшиш нест.</div>`;
  const toggle = id => setCmp(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id].slice(-2));
  const pair = cmp.length === 2 ? cmp.map(id => attempts.find(a => a.id === id)).sort((a, b) => a.number - b.number) : null;
  return html`<div class="col">
    <div class="small muted">Ду кӯшишро қайд кунед, то сатрҳои тағйирёфтаро бинед.</div>
    <table class="t"><thead><tr><th></th><th>№</th><th>Вақт</th><th>Натиҷа</th><th>Версия</th><th></th></tr></thead><tbody>
      ${attempts.map(a => html`<tr>
        <td><input type="checkbox" aria-label=${'Кӯшиши ' + a.number} checked=${cmp.includes(a.id)} onChange=${() => toggle(a.id)} /></td>
        <td>${a.number}</td><td>${fDateTime(a.created_at)}</td>
        <td>${a.grading ? html`<${Verdict} v=${a.grading.verdict} extra=${['CE', 'SE'].includes(a.grading.verdict) ? '' : `${a.grading.passed}/${a.grading.total}`} />` : html`<${Verdict} v=${a.status} />`}${a.comments?.length ? html` <span class="chip warn">💬 ${a.comments.length}</span>` : ''}</td>
        <td>${a.problem_version}</td>
        <td><button class="btn sm" onClick=${() => open(a.id)}>Бин</button></td>
      </tr>`)}
    </tbody></table>
    ${pair && html`<div><h3>Кӯшиши №${pair[0].number} → №${pair[1].number}</h3><${DiffView} a=${pair[0].code} b=${pair[1].code} /></div>`}
  </div>`;
}

function ConflictModal({ c, onPick }) {
  return html`<${Modal} title="Ҳамоҳангсозӣ лозим аст" onClose=${() => {}} wide>
    <p>Ин масъала дар дастгоҳи дигар ${c.server.device ? html`(<b>${c.server.device}</b>)` : ''} ${c.server.updated_at ? `соати ${fTime(c.server.updated_at)}` : ''} тағйир ёфтааст. Кадом нусхаро идома медиҳед? <b>Нусхаи дигар гум намешавад</b> — он дар «Нусхаҳои нигоҳдошта» мемонад.</p>
    <div class="grid2" style="grid-template-columns:1fr 1fr">
      <div><h3>Нусхаи ин дастгоҳ</h3><${CodeView} code=${c.local.code} /><button class="btn p" style="margin-top:8px" onClick=${() => onPick('local')}>Ин нусхаро идома деҳ</button></div>
      <div><h3>Нусхаи дастгоҳи дигар</h3><${CodeView} code=${c.server.code} /><button class="btn" style="margin-top:8px" onClick=${() => onPick('server')}>Ин нусхаро идома деҳ</button></div>
    </div>
  <//>`;
}

function HelpModal({ pid, lessonId, attempts, onClose }) {
  const [q, setQ] = useState('');
  const [sid, setSid] = useState(attempts[0]?.id || '');
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true); setErr(null);
    try { const r = await api('/api/help', { method: 'POST', body: { question: q, problem_id: pid, lesson_id: lessonId, submission_id: sid || undefined } }); toast(r.updated ? 'Дархости шумо нав шуд. Устод онро мебинад.' : 'Дархост фиристода шуд. Устод онро дар навбат мебинад.'); onClose(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return html`<${Modal} title="Устод, ёрӣ лозим" onClose=${onClose}>
    <div class="col">
      <label class="f">Саволи шумо<textarea class="i" rows="3" value=${q} onInput=${e => setQ(e.target.value)} placeholder="Масалан: Чаро барои 5 5 B чоп мешавад?"></textarea></label>
      <label class="f">Кадом кӯшишро нишон диҳем?
        <select class="i" value=${sid} onChange=${e => setSid(Number(e.target.value) || '')}>
          <option value="">Бе кӯшиш</option>
          ${attempts.map(a => html`<option value=${a.id}>Кӯшиши №${a.number} · ${fTime(a.created_at)} · ${a.grading?.verdict || 'санҷида мешавад'}</option>`)}
        </select></label>
      ${err && html`<div class="err">${err}</div>`}
      <div class="row"><button class="btn p" onClick=${send} disabled=${busy || !q.trim()}>Фирист</button><button class="btn ghost" onClick=${onClose}>Бекор кун</button></div>
    </div>
  <//>`;
}
