// «Дарси зинда» — асбоби устод назди тахта, ва ҳолати проектор
import { html, useState, useEffect, useRef, api, useLoad, useEvents, Loading, ErrorBox, Modal, fTime, fDateTime, since, Verdict, toast, CodeView } from './lib.js';
import { AttemptsModal } from './teacher.js';
import { SubmissionResult } from './result.js';

function Cell({ step, c }) {
  if (step.kind !== 'problem') {
    if (!c) return html`<span class="v v-none">Ҷавоб надод</span>`;
    return c.correct === 1 ? html`<span class="v v-ok">✓ Дуруст</span>` : c.correct === 0 ? html`<span class="v v-bad">✗ Нодуруст</span>` : html`<span class="v v-ok">✓ Ҷавоб дод</span>`;
  }
  if (!c || (!c.attempts && !c.pending && !c.lastSE)) return html`<span class="v v-none">Оғоз нашуд</span>`;
  if (c.solved) return html`<span class="v v-ok">✓ Ҳал шуд · ${c.solvedAttempts} кӯшиш</span>`;
  if (c.pending) return html`<span class="v v-info">◷ Дар санҷиш</span>`;
  const g = c.lastGraded;
  if (!g) return html`<span class="v v-se">⚠ Хидмат ҷавоб надод</span>`;
  if (g.verdict === 'CE') return html`<span class="v v-warn">⚠ Хатои компилятсия · ${c.attempts}</span>`;
  const tag = g.failedTags[0];
  return html`<span class="v v-bad">✗ ${g.passed}/${g.total}${tag ? ' · ' + tag : ''}</span>${c.attempts > 1 ? html` <span class="muted small">${c.attempts} кӯшиш</span>` : ''}`;
}

export function LiveLesson({ id }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/lessons/${id}/board`), [id]);
  const [cell, setCell] = useState(null);    // {student, step}
  const [drill, setDrill] = useState(null);
  const [steps, setSteps] = useState(false);
  const [proj, setProj] = useState(null);
  const [, tick] = useState(0);
  const t = useRef();
  useEvents(ev => {
    if (['activity', 'help', 'lesson', 'members'].includes(ev.type)) { clearTimeout(t.current); t.current = setTimeout(() => reload(true), 300); }
  }, [id]);
  useEffect(() => { const i = setInterval(() => { tick(x => x + 1); reload(true); }, 20000); return () => clearInterval(i); }, [id]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const { lesson: l, group, students, steps: st, cols, summary, help } = data;
  const colOf = sid => cols.find(c => c.stepId === sid)?.cells || {};
  const helpBy = new Set(help.map(h => h.user_id));
  const act = async (url, body) => { try { await api(url, { method: 'POST', body: body || {} }); reload(true); } catch (e) { toast(e.message); } };
  const quiz = st.filter(s => s.kind === 'quiz' || s.kind === 'predict');

  return html`<div style="display:flex;flex-direction:column;flex:1">
    <div class="live-head">
      <div><div class="k">Гурӯҳ</div><div class="vv">${group.name}</div></div>
      <div><div class="k">Мавзӯъ</div><div class="vv">${l.title}</div></div>
      <div><div class="k">Оғоз</div><div class="vv">${l.started_at ? `${fTime(l.started_at)} · ${since(l.started_at)} гузашт` : `ба нақша: ${fTime(l.scheduled_at)}`}</div></div>
      <div><div class="k">Шогирдон</div><div class="vv">${students.length}</div></div>
      <div><div class="k">Дархости ёрӣ</div><div class="vv" style=${help.length ? 'color:var(--warn)' : ''} data-testid="help-count">${help.length ? `✋ ${help.length}` : '0'}</div></div>
      <div class="spacer"></div>
      <div class="row" style="gap:8px">
        <button class="btn" onClick=${() => setSteps(true)}>Қадамҳо</button>
        <button class="btn" onClick=${() => setProj({})}>Ҳолати проектор</button>
        <a class="btn" href=${'#/report/' + l.id}>Ҳисобот</a>
        ${l.status === 'live' ? html`<button class="btn" onClick=${() => confirm('Дарсро анҷом диҳем?') && act(`/api/lessons/${l.id}/finish`).then(() => (location.hash = '#/report/' + l.id))}>Дарсро анҷом деҳ</button>`
          : html`<button class="btn p" onClick=${() => act(`/api/lessons/${l.id}/start`)} data-testid="start-lesson">${l.status === 'finished' ? 'Дубора оғоз кун' : 'Дарсро оғоз кун'}</button>`}
      </div>
    </div>
    ${l.status === 'planned' && html`<div class="notice info" style="margin:14px 20px 0">Дарс ҳанӯз оғоз нашудааст. Шогирдон қадамҳоро мебинанд, вақте шумо «Дарсро оғоз кун»-ро пахш кунед, дарс дар саҳифаи аввали онҳо ҳамчун «Дарс ҳозир меравад» пайдо мешавад.</div>`}
    <div class="live">
      <div class="card" style="padding:0">
        ${!students.length ? html`<div class="empty"><h3>Дар гурӯҳ ҳанӯз шогирд нест</h3><a href=${'#/g/' + group.id + '?tab=students'}>Шогирдонро илова кунед →</a></div>` : html`
        <div class="board-wrap"><table class="t board">
          <thead><tr><th>Шогирд</th>${st.map((s, i) => html`<th class=${s.skipped ? 'skip' : ''}>${i + 1}. ${s.title}${s.problem ? html`<div class="small muted" style="font-weight:500">${s.problem.title}</div>` : ''}${s.skipped ? ' (гузаронида шуд)' : ''}</th>`)}</tr></thead>
          <tbody>${students.map(u => html`<tr>
            <td class="name">${u.name}${helpBy.has(u.id) ? html` <span class="chip warn">ёрӣ</span>` : ''}</td>
            ${st.map(s => html`<td class=${'cell' + (s.skipped ? ' skip' : '')} onClick=${() => setCell({ student: u, step: s })} title="Пахш кунед: кӯшиши охир ва код"><${Cell} step=${s} c=${colOf(s.id)[u.id]} /></td>`)}
          </tr>`)}</tbody>
        </table></div>`}
        <div class="muted small" style="padding:8px 12px">Бо пахш ба хона кӯшиши охир, натиҷа, вақт ва код кушода мешавад. Ҷадвал худкор нав мешавад.</div>
      </div>
      <div class="col" style="gap:16px">
        <div class="card"><h3>Хулоса аз тестҳо</h3>
          ${!summary.tags.length && !summary.compileErrors.count ? html`<div class="muted small">Ҳоло ҳеҷ кас дар тестҳо намеафтад ё кӯшиш нест.</div>` : ''}
          ${summary.tags.map(t => html`<div style="padding:4px 0;font-size:15px"><button class="num" onClick=${() => setDrill({ ids: t.subIds, title: `Тамға «${t.tag}»: кӯшишҳои охирин` })}>${t.count} шогирд</button> ҳоло аз тестҳои бахши «${t.tag}» нагузаштаанд.<div class="small muted">${t.problems.join(', ')}</div></div>`)}
          ${summary.compileErrors.count > 0 && html`<div style="padding:4px 0"><button class="num" onClick=${() => setDrill({ ids: summary.compileErrors.subIds, title: 'Хатои компилятсия' })}>${summary.compileErrors.count} шогирд</button> хатои компилятсия доранд.</div>`}
          <div class="small muted" style="margin-top:6px">Ҳар шогирд як бор ҳисоб мешавад; пас аз ҳал аз рӯйхат мебарояд.</div>
        </div>
        <div class="card helpq"><h3>Навбати ёрӣ</h3>
          ${!help.length && html`<div class="muted small">Дархост нест.</div>`}
          ${help.map(h => html`<div class=${'item ' + h.status}>
            <b>${h.name}</b> <span class="muted small">· ${fTime(h.created_at)}${h.status === 'taken' ? ' · гирифта шуд' : ''}</span>
            <div>«${h.question}»</div>
            <div class="row" style="gap:6px;margin-top:6px">
              ${h.status === 'open' && html`<button class="btn sm p" onClick=${async () => { await act(`/api/help/${h.id}/take`); const s = st.find(x => x.problem?.id === h.problem_id); setCell({ student: students.find(u => u.id === h.user_id) || { id: h.user_id, name: h.name }, step: s, submissionId: h.submission_id, problemId: h.problem_id }); }}>Гир</button>`}
              ${h.submission_id && html`<button class="btn sm" onClick=${() => setCell({ student: { id: h.user_id, name: h.name }, step: st.find(x => x.problem?.id === h.problem_id), submissionId: h.submission_id, problemId: h.problem_id })}>Кӯшишро бин</button>`}
              <button class="btn sm" onClick=${() => act(`/api/help/${h.id}/done`)}>Анҷом ёфт</button>
            </div></div>`)}
        </div>
        ${quiz.length > 0 && html`<div class="card"><h3>Ҷавобҳо</h3>${quiz.map(s => { const cs = Object.values(colOf(s.id)); return html`<div class="row" style="padding:4px 0"><span>${s.title}</span><div class="spacer"></div><span class="muted small">${cs.length}/${students.length} ҷавоб · ${cs.filter(c => c.correct === 1).length} дуруст</span><button class="btn sm" onClick=${() => setProj({ kind: 'votes', step_id: s.id })}>Ба проектор</button></div>`; })}</div>`}
      </div>
    </div>
    ${cell && html`<${CellDrawer} cell=${cell} lessonId=${l.id} onClose=${() => setCell(null)} onProject=${b => setProj(b)} />`}
    ${drill && html`<${AttemptsModal} title=${drill.title} ids=${drill.ids} onClose=${() => setDrill(null)} />`}
    ${steps && html`<${StepsDrawer} l=${l} steps=${st} onClose=${() => setSteps(false)} reload=${reload} />`}
    ${proj && html`<${ProjectorControl} l=${l} steps=${st} init=${proj} onClose=${() => setProj(null)} />`}
  </div>`;
}

function CellDrawer({ cell, lessonId, onClose, onProject }) {
  const { student, step } = cell;
  const pid = cell.problemId || step?.problem?.id;
  const [subs, setSubs] = useState(null);
  const [selId, setSelId] = useState(cell.submissionId || null);
  const [line, setLine] = useState(null); const [text, setText] = useState('');
  const [range, setRange] = useState(null);
  const [votes, setVotes] = useState(null);
  const load = () => pid ? api(`/api/submissions?user_id=${student.id}&problem_id=${pid}`).then(setSubs).catch(e => toast(e.message)) : null;
  useEffect(() => { if (pid) load(); else if (step) api(`/api/lessons/${lessonId}/votes/${step.id}`).then(setVotes); }, [pid]);
  useEvents(ev => { if (ev.type === 'activity' && ev.user_id === student.id) load(); }, [pid]);
  const sel = subs?.find(s => s.id === selId) || subs?.[0];
  const comment = async e => {
    e.preventDefault();
    try { await api(`/api/submissions/${sel.id}/comments`, { method: 'POST', body: { line, text } }); setText(''); setLine(null); toast(`Шарҳ ба сатри ${line}-и кӯшиши №${sel.number} гузошта шуд.`); load(); }
    catch (x) { toast(x.message); }
  };
  useEffect(() => { const k = e => e.key === 'Escape' && !e.target.closest?.('textarea') && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const pick = n => { if (range && range[0] === range[1] && n > range[0]) setRange([range[0], n]); else setRange([n, n]); setLine(n); };
  return html`<div class="drawer" role="dialog" aria-label="Кӯшиши шогирд">
    <div class="row" style="margin-bottom:12px"><div><div class="kicker">${step?.title || 'Кӯшиш'}</div><h2>${student.name}</h2></div><div class="spacer"></div><button class="btn ghost icon-btn" onClick=${onClose} aria-label="Пӯшидан">✕</button></div>
    ${!pid && votes && html`<div>${(() => { const r = votes.responses.find(x => x.name === student.name); return r ? html`<p>Ҷавоб: <b class="mono">${step.kind === 'quiz' ? votes.options[Number(r.answer)]?.label : r.answer}</b> ${r.correct ? html`<span class="v v-ok">дуруст</span>` : html`<span class="v v-bad">нодуруст</span>`}</p>` : html`<p class="muted">Ҳанӯз ҷавоб надодааст.</p>`; })()}</div>`}
    ${pid && !subs && html`<${Loading} />`}
    ${subs && !subs.length && html`<div class="muted">Ҳанӯз кӯшиш нафиристодааст.</div>`}
    ${sel && html`<div class="col">
      <div class="row" style="gap:6px">${subs.map(s => html`<button class=${'btn sm' + (s.id === sel.id ? ' p' : '')} onClick=${() => { setSelId(s.id); setRange(null); setLine(null); }}>№${s.number}</button>`)}</div>
      <${SubmissionResult} s=${sel} />
      <div class="row"><h3 style="margin:0">Коди кӯшиши №${sel.number}</h3><span class="muted small">${fDateTime(sel.created_at)}</span><div class="spacer"></div>
        ${range && html`<button class="btn sm" onClick=${() => onProject({ kind: 'code', submission_id: sel.id, from: range[0], to: range[1] })}>Сатрҳои ${range[0]}–${range[1]} ба проектор</button>`}</div>
      <div class="small muted">Рақами сатрро пахш кунед, то шарҳ гузоред (барои проектор — сатри аввал ва охирро пахш кунед).</div>
      <${CodeView} code=${sel.code} comments=${sel.comments} onLine=${pick} selected=${range} />
      ${line && html`<form class="card" onSubmit=${comment} style="border-color:var(--acc)">
        <label class="f">Шарҳ ба сатри ${line} (кӯшиши №${sel.number})<textarea class="i" rows="2" value=${text} onInput=${e => setText(e.target.value)} placeholder="Масалан: Ин шарт ҳолати a == b-ро намегирад." autofocus /></label>
        <div class="row" style="margin-top:8px"><button class="btn p" disabled=${!text.trim()}>Шарҳ гузор</button><button type="button" class="btn ghost" onClick=${() => setLine(null)}>Бекор кун</button></div>
      </form>`}
    </div>`}
  </div>`;
}

function StepsDrawer({ l, steps, onClose, reload }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const move = async (i, d) => { const ids = steps.map(s => s.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await api(`/api/lessons/${l.id}`, { method: 'PATCH', body: { order: ids } }); reload(true); };
  const skip = async s => { await api(`/api/steps/${s.id}/skip`, { method: 'POST', body: { skipped: !s.skipped } }); reload(true); };
  return html`<div class="drawer" role="dialog" aria-label="Қадамҳои дарс">
    <div class="row" style="margin-bottom:12px"><h2>Қадамҳои дарс</h2><div class="spacer"></div><button class="btn ghost icon-btn" onClick=${onClose} aria-label="Пӯшидан">✕</button></div>
    <p class="small muted">Тартибро иваз кунед ё қадамро гузаронед. Шогирдон тағйиротро фавран мебинанд; натиҷаҳои сабтшуда нигоҳ дошта мешаванд.</p>
    ${steps.map((s, i) => html`<div class="card row" style=${'margin-bottom:8px;' + (s.skipped ? 'opacity:.55' : '')}>
      <b>${i + 1}.</b><div style="flex:1"><b>${s.title}</b><div class="small muted">${{ predict: 'Пешгӯӣ', problem: 'Масъала', quiz: 'Санҷиш' }[s.kind]}${s.problem ? ' · ' + s.problem.title : ''}</div></div>
      <button class="btn sm icon-btn" onClick=${() => move(i, -1)} disabled=${i === 0} aria-label="Боло">↑</button>
      <button class="btn sm icon-btn" onClick=${() => move(i, 1)} disabled=${i === steps.length - 1} aria-label="Поён">↓</button>
      <button class="btn sm" onClick=${() => skip(s)}>${s.skipped ? 'Баргардон' : 'Гузарон'}</button>
    </div>`)}
  </div>`;
}

// Идоракунии проектор бо пешнамоиш
function ProjectorControl({ l, steps, init, onClose }) {
  const probs = steps.filter(s => s.problem);
  const [b, setB] = useState(init.kind ? init : { kind: 'example', problem_id: probs[0]?.problem.id, index: 0 });
  const [pv, setPv] = useState(null); const [err, setErr] = useState(null);
  const [exCount, setExCount] = useState(3);
  useEffect(() => { if (b.kind === 'example' && b.problem_id) api(`/api/problems/${b.problem_id}`).then(p => setExCount((p.published || p.public)?.examples?.length || 1)); }, [b.problem_id, b.kind]);
  useEffect(() => { setErr(null); api(`/api/lessons/${l.id}/projector/preview`, { method: 'POST', body: b }).then(setPv).catch(e => { setPv(null); setErr(e.message); }); }, [JSON.stringify(b)]);
  const show = async () => { try { await api(`/api/lessons/${l.id}/projector`, { method: 'POST', body: b }); toast('Ба экрани проектор бароварда шуд.'); } catch (e) { toast(e.message); } };
  const openScreen = () => window.open(`#/projector/${l.id}`, 'ilmspace-projector', 'width=1280,height=800');
  return html`<${Modal} title="Ҳолати проектор" onClose=${onClose} wide>
    <div class="grid2" style="grid-template-columns:320px 1fr">
      <div class="col">
        <label class="f">Чӣ нишон диҳем?<select class="i" value=${b.kind} onChange=${e => setB({ kind: e.target.value, problem_id: probs[0]?.problem.id, index: 0, step_id: steps.find(s => s.kind !== 'problem')?.id })}>
          <option value="example">Мисоли кушодаи масъала</option><option value="votes">Натиҷаи умумии овоздиҳӣ</option><option value="code" disabled=${b.kind !== 'code'}>Порчаи код (аз кӯшиш интихоб кунед)</option><option value="clear">Экрани холӣ</option></select></label>
        ${b.kind === 'example' && html`<label class="f">Масъала<select class="i" value=${b.problem_id} onChange=${e => setB({ ...b, problem_id: Number(e.target.value), index: 0 })}>${probs.map(s => html`<option value=${s.problem.id}>${s.problem.title}</option>`)}</select></label>
          <label class="f">Мисол<select class="i" value=${b.index} onChange=${e => setB({ ...b, index: Number(e.target.value) })}>${Array.from({ length: exCount }, (_, i) => html`<option value=${i}>Мисоли ${i + 1}</option>`)}</select></label>`}
        ${b.kind === 'votes' && html`<label class="f">Қадам<select class="i" value=${b.step_id} onChange=${e => setB({ ...b, step_id: Number(e.target.value) })}>${steps.filter(s => s.kind !== 'problem').map(s => html`<option value=${s.id}>${s.title}</option>`)}</select></label>`}
        ${b.kind === 'code' && html`<div class="small muted">Сатрҳои ${b.from}–${b.to}. Номи шогирд нишон дода намешавад.</div>`}
        <div class="notice info small">Дар проектор ҳеҷ гоҳ номи шогирд, баҳо, паёмҳои хусусӣ ва тестҳои пинҳонӣ нишон дода намешаванд.</div>
        <button class="btn p" onClick=${show} disabled=${!pv}>Ба экран барор</button>
        <button class="btn" onClick=${openScreen}>Экрани проекторро кушо ↗</button>
      </div>
      <div><div class="kicker" style="margin-bottom:6px">Пешнамоиш</div>${err ? html`<div class="notice warn">${err}</div>` : html`<div class="proj-frame"><${ProjView} c=${pv} /></div>`}</div>
    </div>
  <//>`;
}

export function ProjView({ c, title }) {
  if (!c) return html`<div class="proj"><${Loading} /></div>`;
  if (c.kind === 'clear') return html`<div class="proj" style="display:flex;align-items:center;justify-content:center"><div class="logo" style="font-size:2em">ILMSPACE <b>CodeLab</b></div></div>`;
  if (c.kind === 'example') return html`<div class="proj"><h1>${c.title}</h1><p>${c.statement}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1em;margin-top:1em"><div><div class="kicker">Вуруд</div><pre>${c.example.input}</pre></div><div><div class="kicker">Баромад</div><pre>${c.example.output}</pre></div></div>
    ${c.example.explain && html`<p class="muted" style="margin-top:1em">${c.example.explain}</p>`}</div>`;
  if (c.kind === 'code') return html`<div class="proj"><h1>${c.title}</h1><pre>${c.code.split('\n').map((t, i) => html`<span class="muted">${String(c.from + i).padStart(3, ' ')}  </span>${t}\n`)}</pre></div>`;
  if (c.kind === 'votes') {
    const max = Math.max(1, ...c.options.map(o => o.count));
    return html`<div class="proj"><h1>${c.question}</h1><div class="muted" style="margin-bottom:.6em">${c.total} ҷавоб</div>
      ${c.options.map(o => html`<div class="vote"><span class="mono">${o.label}${o.correct ? ' ✓' : ''}</span><div class="bar"><i style=${`width:${(100 * o.count) / max}%;${o.correct ? 'background:var(--ok)' : ''}`}></i></div><b>${c.total ? Math.round((100 * o.count) / c.total) : 0}%</b></div>`)}</div>`;
  }
  return null;
}

export function ProjectorScreen({ id }) {
  const [{ data, error }, reload] = useLoad(() => api(`/api/lessons/${id}/projector`), [id]);
  useEvents(ev => { if (ev.type === 'projector' || ev.type === 'activity') reload(true); }, [id]);
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  return html`<${ProjView} c=${data?.content} />`;
}
