// Муҳити коднависии шогирд
import { html, useState, useEffect, useRef, useCallback, api, store, uuid, deviceId, toast, useEvents, Verdict, fTime, fDateTime, Loading, ErrorBox, Modal, CodeView, DiffView, TOPIC } from './lib.js';
import { CodeEditor, search, gotoLine } from './editor.js';
import { RunResult, SubmissionResult } from './result.js';

export function Workspace({ user, pid, lessonId, exam, num, nav, exitHref }) {
  const [problem, setProblem] = useState(() => store.get(`prob:${pid}`));
  const [loadErr, setLoadErr] = useState(null);
  const [code, setCode] = useState(null);   // танҳо матни боршуда; ҳар ҳарфи навишташуда дар st.current.code (бе рендер)
  const [ver, setVer] = useState(0);
  const [stdin, setStdin] = useState('');
  const [save, setSave] = useState('saved');
  const [conflict, setConflict] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selId, setSelId] = useState(null);
  const [bottom, setBottom] = useState('run');
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [expected, setExpected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fs, setFs] = useState(store.get('fontSize', 15));
  const [full, setFull] = useState(false);
  const [hints, setHints] = useState(store.get(`hints:${user.id}:${pid}`, 0));
  const [allEx, setAllEx] = useState(false);
  const outRef = useRef(null);
  const [cmp, setCmp] = useState([]);
  const view = useRef(null);
  const key = `draft:${user.id}:${pid}`;
  const st = useRef({ code: '', stdin: '', baseRev: 0, dirty: false, timer: null, token: null });


  // Масъала (бо нусхаи маҳаллӣ барои кор бе интернет)
  useEffect(() => {
    api(`/api/problems/${pid}`).then(p => {
      // Масъалаи имтиҳон бе назорат кушода намешавад — ба саҳифаи имтиҳон мегузаронем
      if (p.exam_lesson && !exam) { location.replace(`#/set/${p.exam_lesson}/class`); return; }
      setProblem(p); if (!p.exam_lesson) store.set(`prob:${pid}`, p); setLoadErr(null);
    })
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
    setCode(c); setVer(v => v + 1); setStdin(i);
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
    st.current.code = c; st.current.dirty = true; persistLocal();
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
    setRunning(true); setBottom('run'); setExpected(exp); setRun(null);
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
      setAttempts(a => [s, ...a.filter(x => x.id !== s.id)]); setSelId(s.id); setBottom('attempt');
    } catch (e) {
      toast(e.data?.offline ? 'Фиристода нашуд: интернет нест. Код дар дастгоҳ нигоҳ дошта шуд — баъдтар «Фирист»-ро пахш кунед.' : e.message);
    } finally { setSubmitting(false); }
  }
  const tryExample = ex => { onStdin(ex.input); doRun(ex.input, ex.output); setTimeout(() => outRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); };
  const openHint = () => { const n = hints + 1; setHints(n); store.set(`hints:${user.id}:${pid}`, n); };
  const setFont = d => { const n = Math.min(26, Math.max(11, fs + d)); setFs(n); store.set('fontSize', n); };
  const jump = n => { view.current?.dom?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => gotoLine(view.current, n), 30); };

  if (loadErr) return html`<div class="page"><${ErrorBox} error=${loadErr} /></div>`;
  if (!problem || code === null) return html`<${Loading} />`;
  const sel = attempts.find(a => a.id === selId) || attempts[0];
  const solved = attempts.some(a => a.grading?.verdict === 'AC');
  const SAVE = { saved: ['ok', '✓ Захира шуд'], saving: ['saving', 'Захира мешавад…'], local: ['local', '● Дар ин дастгоҳ нигоҳ дошта шуд'], conflict: ['conflict', '⚠ Ҳамоҳангсозӣ лозим аст'] }[save];

  const exs = problem.examples || [];
  const ex0 = exs[0];
  const hintList = (problem.hints || []).filter(Boolean);
  const showOut = () => setTimeout(() => outRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  const runNow = (input, exp) => { doRun(input, exp); showOut(); };
  const submitNow = () => { doSubmit(); showOut(); };
  const runBtn = cls => html`<button class=${'btn ' + cls} onClick=${() => runNow()} disabled=${running} data-testid="run">${running ? html`<span class="spin"></span>` : html`<${Ico} n="term" />`} Иҷро кун</button>`;
  const sendBtn = cls => html`<button class=${'btn p ' + cls} onClick=${submitNow} disabled=${submitting} data-testid="submit">${submitting ? html`<span class="spin"></span>` : html`<${Ico} n="send" />`} <span class="long">Барои санҷиш фирист</span><span class="short">Фирист</span></button>`;

  return html`<div class="wsx-wrap">
  <article class="wsx" aria-label="Масъала">
    <header class="wsx-head">
      <h1 class="wsx-title">${num ? html`<span class="num">${num}.</span> ` : ''}<span class="ttl">${problem.title}</span></h1>
      ${solved ? html`<span class="pill pill-ok">✓ Ҳал шуд</span>` : attempts.length ? html`<span class="pill pill-warn">Ҳал нашуд · ${attempts.length} кӯшиш</span>` : html`<span class="pill">Ҳанӯз кӯшиш нест</span>`}
      ${exam && html`<span class="pill pill-exam">🛡️ Имтиҳон</span>`}
      <span class=${'save ' + SAVE[0]} role="status" data-testid="save-state">${SAVE[1]}</span>
      <div class="spacer"></div>
      ${exitHref && html`<a class="wsx-exit" href=${exitHref}>Баромадан <span aria-hidden="true">✕</span></a>`}
    </header>
    <div class="wsx-meta">
      <span class="chip">${TOPIC[problem.topic] || problem.topic}</span><span class="chip">${problem.level}</span>
      <span class="chip">${(problem.timeMs || 2000) / 1000} с · ${problem.memoryMb || 256} МБ</span>
    </div>
    <div class="stmt">${problem.statement}</div>
    ${(problem.input || problem.output) && html`<div class="io-desc">
      ${problem.input && html`<div><div class="lbl">Вуруд</div><p>${problem.input}</p></div>`}
      ${problem.output && html`<div><div class="lbl">Баромад</div><p>${problem.output}</p></div>`}
    </div>`}
    ${problem.constraints && html`<div class="io-desc"><div><div class="lbl">Маҳдудиятҳо</div><p class="mono">${problem.constraints}</p></div></div>`}
    ${ex0 && html`<section class="sample ex" aria-label="Мисол">
      <div class="row sample-h"><b>Мисоли вуруд:</b><div class="spacer"></div>${exs.length > 1 && html`<button class="linkbtn" onClick=${() => setAllEx(true)}>Ҳамаи мисолҳо (${exs.length}) →</button>`}</div>
      <pre class="sample-pre">${ex0.input.trim() ? ex0.input : html`<span class="muted">(вуруд нест)</span>`}</pre>
      <b>Мисоли баромад:</b>
      <pre class="sample-pre">${ex0.output}</pre>
      ${ex0.explain && html`<div class="sample-why">💡 ${ex0.explain}</div>`}
      <button class="btn sm" onClick=${() => tryExample(ex0)} disabled=${running}>▶ Бо ҳамин вуруд санҷ</button>
    </section>`}
    ${!exam && hintList.length > 0 && html`<section class="hints"><div class="lbl">Ишораҳо</div>
      ${hintList.slice(0, hints).map((t, i) => html`<div class="notice" style="margin-bottom:8px"><b>${i + 1}.</b> ${t}</div>`)}
      ${hints < hintList.length ? html`<button class="btn sm" onClick=${openHint}>💡 Ишораи ${hints + 1}-ро кушо</button>` : html`<div class="small muted">Ҳамаи ишораҳо кушода шуданд.</div>`}
    </section>`}

    <h2 class="wsx-sec">Барномаро нависед</h2>
    <div class=${'edbox' + (full ? ' full' : '')} onKeyDown=${e => e.key === 'Escape' && full && setFull(false)}>
      <div class="edbar">
        <span class="chip mono">C++17</span>
        ${full && html`<b class="edbar-t">${problem.title}</b>`}
        <span class="spacer"></span>
        <button class="btn icon-btn" title="Ҷустуҷӯ (Ctrl+F)" aria-label="Ҷустуҷӯ" onClick=${() => search(view.current)}>🔍</button>
        <button class="btn icon-btn" title="Ҳарфи хурдтар" aria-label="Ҳарфи хурдтар" onClick=${() => setFont(-1)}>A−</button>
        <button class="btn icon-btn" title="Ҳарфи калонтар" aria-label="Ҳарфи калонтар" onClick=${() => setFont(1)}>A+</button>
        <button class="btn icon-btn" title=${full ? 'Хурд кун (Esc)' : 'Муҳаррири калон'} aria-label="Муҳаррири калон" onClick=${() => setFull(f => !f)}>⛶</button>
        ${full && html`${runBtn('')}${sendBtn('')}`}
      </div>
      <div class="edwrap"><${CodeEditor} value=${code} version=${ver} onChange=${onCode} fontSize=${fs} onReady=${v => (view.current = v)} /></div>
    </div>
    <div class="wsx-actions">
      ${sendBtn('big')}${runBtn('big ghostline')}
      <div class="spacer"></div>
      ${nav && html`<a class=${'navbtn' + (nav.prev ? '' : ' off')} href=${nav.prev || undefined} aria-label="Масъалаи пешина" title="Масъалаи пешина">‹</a>
        <a class=${'navbtn' + (nav.next ? '' : ' off')} href=${nav.next || undefined} aria-label="Масъалаи навбатӣ" title="Масъалаи навбатӣ">›</a>`}
    </div>

    <section class="out" aria-live="polite" ref=${outRef}>
      <div class="tabs" role="tablist">
        <button class=${bottom === 'run' ? 'on' : ''} onClick=${() => setBottom('run')}>Иҷро</button>
        <button class=${bottom === 'attempt' ? 'on' : ''} onClick=${() => setBottom('attempt')}>Натиҷаи санҷиш${sel && !sel.grading ? ' ◷' : ''}</button>
        <button class=${bottom === 'history' ? 'on' : ''} onClick=${() => setBottom('history')}>Кӯшишҳо (${attempts.length})</button>
      </div>
      ${bottom === 'run' && html`<div class="col" style="gap:10px">
        <label class="f">Вуруд (stdin)<textarea class="i mono" rows="3" value=${stdin} onInput=${e => onStdin(e.target.value)} placeholder="Масалан: 5 5"></textarea></label>
        ${running && html`<div class="muted"><span class="spin"></span> Иҷро мешавад…</div>`}
        ${!running && !run && html`<div class="muted small">«Иҷро кун» кодро бо ҳамин вуруд иҷро мекунад. «Барои санҷиш фирист» кодро бо ҳамаи тестҳо месанҷад.</div>`}
        <${RunResult} r=${run} expected=${expected} onLine=${jump} />
      </div>`}
      ${bottom === 'attempt' && (sel ? html`<div class="col">
          <${SubmissionResult} s=${sel} onLine=${jump} currentCode=${st.current.code} />
          ${sel.comments?.length > 0 && html`<div><h3>Шарҳи устод ба кӯшиши №${sel.number}</h3><${CodeView} code=${sel.code} comments=${sel.comments} /></div>`}
          ${!sel.comments?.length && html`<details><summary class="small muted" style="cursor:pointer">Коди ҳамин кӯшиш</summary><${CodeView} code=${sel.code} /></details>`}
        </div>` : html`<div class="muted">Ҳанӯз кӯшиш нест. Вақте омода шудед, «Барои санҷиш фирист»-ро пахш кунед.</div>`)}
      ${bottom === 'history' && html`<${History} attempts=${attempts} cmp=${cmp} setCmp=${setCmp} open=${id => { setSelId(id); setBottom('attempt'); }} />`}
    </section>
  </article>
  <div class="mbar">${runBtn('')}${sendBtn('')}</div>
  ${allEx && html`<${Modal} title=${`Ҳамаи мисолҳо (${exs.length})`} onClose=${() => setAllEx(false)} wide>
    <div class="col">${exs.map((ex, i) => html`<div class="ex excard">
      <div class="row" style="margin-bottom:8px"><b>Мисоли ${i + 1}</b><div class="spacer"></div><button class="btn sm" onClick=${() => { setAllEx(false); tryExample(ex); }} disabled=${running}>▶ Бо ҳамин вуруд санҷ</button></div>
      <div class="io3" style="grid-template-columns:1fr 1fr"><div><div class="kicker">Вуруд</div><pre>${ex.input}</pre></div><div><div class="kicker">Баромади интизорӣ</div><pre>${ex.output}</pre></div></div>
      ${ex.explain && html`<div class="small muted" style="margin-top:6px">💡 ${ex.explain}</div>`}
    </div>`)}</div>
  <//>`}
  ${conflict && html`<${ConflictModal} c=${conflict} onPick=${resolve} />`}
</div>`;
}

const ICONS = {
  send: html`<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>`,
  term: html`<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3M12.5 15H17"/>`,
};
function Ico({ n }) {
  return html`<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
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
