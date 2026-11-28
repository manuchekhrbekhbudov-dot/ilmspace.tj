// Саҳифаҳои шогирд
import { html, useState, api, useLoad, useEvents, Loading, ErrorBox, Empty, fTime, fDate, fDateTime, fWeekday, TOPIC, Verdict, toast } from './lib.js';
import { CodeView } from './lib.js';

const STATE = {
  submitted: ['Супорида шуд', 'v-ok'], late: ['Дер супорида шуд', 'v-warn'],
  started: ['Оғоз шуд, ҳанӯз ҳал нашуд', 'v-info'], not_started: ['Оғоз нашудааст', 'v-none'],
};
export const AsgState = ({ s }) => html`<span class=${'v ' + STATE[s][1]}>${STATE[s][0]}</span>`;

export function StudentHome({ user }) {
  const [{ data, loading, error }, reload] = useLoad(() => api('/api/student/home'));
  useEvents(ev => { if (['lesson', 'membership', 'assignment', 'submission'].includes(ev.type)) reload(true); });
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const active = data.groups.filter(g => g.status === 'active');
  const pending = data.groups.filter(g => g.status === 'pending');
  if (!active.length) return html`<div class="page" style="max-width:640px"><${JoinCard} pending=${pending} onDone=${reload} login=${user.login} /></div>`;
  const L = data.todayLesson, C = data.continue, A = data.nearestAssignment;
  return html`<div class="page">
    ${error && html`<${ErrorBox} error=${error} retry=${reload} />`}
    <div class="grid2">
      <div class="col" style="gap:18px">
        ${L && !L.opened ? html`<div class="card" style="padding:22px">
          <div class="kicker">🔒 ${L.isToday ? 'Дарси имрӯз' : 'Дарси навбатӣ'} · ${fWeekday(L.scheduled_at)}, ${fDate(L.scheduled_at)}, ${fTime(L.scheduled_at)}</div>
          <h1 style="margin:6px 0">${L.title}</h1>
          <div class="muted">Ин рӯз ҳанӯз пӯшида аст. Вақте устод онро мекушояд, масъалаҳо пайдо мешаванд.</div>
        </div>` : L && L.kind === 'exam' ? html`<div class="card hl" style="padding:22px">
          <div class="kicker">🛡️ Имтиҳон · ${fWeekday(L.scheduled_at)}, ${fDate(L.scheduled_at)}, ${fTime(L.scheduled_at)}</div>
          <h1 style="margin:6px 0">${L.title}</h1>
          <div class="muted">${L.exam?.blocked ? 'Шумо аз ин имтиҳон блок шудед — ба устод муроҷиат кунед.' : L.exam?.finished ? 'Шумо имтиҳонро тамом кардед. Натиҷаро бинед.' : `3 қисм: A, B ва мураккаб — ҳамагӣ ${L.sets.class.total + L.sets.home.total + L.sets.extra.total} масъала, ҳар кадом 10 хол.`}</div>
          <div style="margin-top:16px"><a class="btn p lg" href=${`#/set/${L.id}/class`}>${L.exam?.finished ? 'Натиҷа' : L.exam?.accepted ? 'Идомаи имтиҳон' : 'Ба имтиҳон'} →</a></div>
        </div>` : L ? html`<div class="card hl" style="padding:22px">
          <div class="kicker">${L.status === 'live' ? '● Дарс ҳозир меравад' : L.isToday ? 'Дарси имрӯз' : 'Дарси навбатӣ'} · ${fWeekday(L.scheduled_at)}, ${fDate(L.scheduled_at)}, ${fTime(L.scheduled_at)}</div>
          <h1 style="margin:6px 0">${L.title}</h1>
          <div class="muted">${L.currentStep ? html`Масъалаи навбатӣ: <b>${L.currentStep}. ${L.steps[L.currentStep - 1].title}</b>` : L.steps.length ? '🎉 Ҳамаи масъалаҳои синфӣ ҳал шуданд!' : ''}</div>
          <div class="todaysets">${[['class', 'Синфӣ'], ['home', 'Хонагӣ'], ['extra', 'Иловагӣ']].filter(([k]) => L.sets?.[k]?.total).map(([k, n]) => html`<a class=${'tset' + (L.sets[k].solved === L.sets[k].total ? ' done' : '')} href=${`#/set/${L.id}/${k}`}><b>${n}</b><span>${L.sets[k].solved}/${L.sets[k].total}</span></a>`)}</div>
          <div style="margin-top:14px">${L.status === 'live'
            ? html`<a class="btn p lg" href=${'#/lesson/' + L.id}>${L.currentStep > 1 ? 'Идома деҳ' : 'Оғоз кун'}</a>`
            : html`<a class="btn p lg" href=${`#/set/${L.id}/class/${Math.max(0, (L.currentStep || 1) - 1)}`}>${L.currentStep > 1 ? 'Идома деҳ' : 'Кушо'}</a>`}</div>
        </div>` : html`<div class="card"><div class="kicker">Дарси имрӯз</div><p style="margin-top:6px">Имрӯз дарс нест. Аз ҷои охирин идома деҳ ё машқ кун.</p></div>`}
        <a class="card setcard" href="#/course"><div class="row"><span class="seticon">▦</span><div style="flex:1"><b>Нақшаи курс</b><div class="muted small">Ҳафтаҳо, рӯзҳо ва вазифаҳои синфӣ, хонагӣ ва иловагӣ</div></div><span>→</span></div></a>
        <div class="card">
          <div class="kicker">Аз ҷои охирин идома деҳ</div>
          ${C ? html`<div class="row" style="margin-top:6px"><b>${C.title}</b><span class="muted small">${C.topic} · ${C.last ? `кӯшиши №${C.last.number}${C.last.verdict ? ' — ' + (C.last.verdict === 'AC' ? 'дуруст' : 'нодуруст') : ''}` : 'ҳанӯз фиристода нашуд'}</span><div class="spacer"></div><a class="btn" href=${'#/p/' + C.problem_id}>Идома деҳ</a></div>`
            : html`<div class="muted" style="margin-top:6px">Ҳанӯз масъала накушодаӣ.</div>`}
        </div>
        <div class="card">
          <div class="kicker">Вазифаи хонагӣ</div>
          ${(data.homework || []).map(h => html`<a class="hwrow" href=${`#/set/${h.lesson_id}/home`}><span><b>Ҳ${h.week} · Рӯзи ${h.day}</b> <span class="muted">${h.title}</span></span><span class="hwn">${h.solved}/${h.total}</span><span aria-hidden="true">→</span></a>`)}
          ${A && html`<div style="margin-top:8px"><div class="row"><b>${A.title}</b><span class="chip warn">муҳлат: ${fWeekday(A.due_at)}, ${fDateTime(A.due_at)} (вақти Душанбе)</span></div>
              <table class="t" style="margin-top:8px"><tbody>${A.problems.map(p => html`<tr><td><a href=${'#/p/' + p.problem_id}>${p.title}</a></td><td style="text-align:right"><${AsgState} s=${p.state} /></td></tr>`)}</tbody></table></div>`}
          ${!A && !(data.homework || []).length && html`<div class="muted" style="margin-top:6px">Ҳамаи вазифаҳои хонагии рӯзҳои кушода иҷро шудаанд. 👍</div>`}
        </div>
      </div>
      <div class="col" style="gap:18px">
        <div class="card"><h3>Пешрафт аз рӯи мавзӯъ</h3>
          <table class="t"><tbody>${data.progress.map(p => html`<tr><td>${p.title}<div class="bar" style="margin-top:5px"><i style=${`width:${p.total ? (100 * p.solved) / p.total : 0}%`}></i></div></td><td style="text-align:right;white-space:nowrap"><b>${p.solved}</b> аз ${p.total} ҳал шуд</td></tr>`)}</tbody></table>
          <a href="#/problems" class="small">Ҳамаи масъалаҳо →</a>
        </div>
        ${data.recommendation && html`<div class="card"><h3>Машқи навбатӣ</h3><b>${data.recommendation.title}</b><p class="muted" style="margin:4px 0 10px">${data.recommendation.reason}</p><a class="btn" href=${'#/p/' + data.recommendation.problem_id}>Кушо</a></div>`}
        ${data.assignments.length > 1 && html`<div class="card"><h3>Ҳамаи вазифаҳо</h3>${data.assignments.map(a => html`<div style="margin-bottom:8px"><b>${a.title}</b> <span class="muted small">то ${fDateTime(a.due_at)}</span><div class="row" style="gap:6px;margin-top:4px">${a.problems.map(p => html`<a href=${'#/p/' + p.problem_id} class="small">${p.title}</a> <${AsgState} s=${p.state} />`)}</div></div>`)}</div>`}
        ${pending.length > 0 && html`<div class="notice info">Дархост ба гурӯҳи <b>${pending.map(p => p.name).join(', ')}</b> интизори тасдиқи устод аст.</div>`}
      </div>
    </div>
  </div>`;
}

function JoinCard({ pending, onDone, login }) {
  const [code, setCode] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const join = async e => { e.preventDefault(); setBusy(true); setErr(null); try { await api('/api/join', { method: 'POST', body: { code } }); toast('Дархост фиристода шуд. Устод шуморо ба гурӯҳ илова мекунад.'); onDone(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return html`<div class="card hl" style="padding:22px">
    <h1>Ба гурӯҳ ҳамроҳ шав</h1>
    ${pending.length ? html`<div class="notice info" style="margin:12px 0">Дархости шумо ба гурӯҳи <b>${pending.map(p => p.name).join(', ')}</b> фиристода шуд. Вақте устод тасдиқ кунад, дарси имрӯз дар ҳамин ҷо пайдо мешавад.</div>`
      : html`<p class="muted" style="margin-top:8px">Рамзи даъватро аз устод гиред ё ба устод логини худро <b class="mono">${login}</b> гӯед — устод шуморо худаш илова мекунад.</p>`}
    <form onSubmit=${join} class="row" style="margin-top:12px">
      <input class="i mono" style="max-width:200px;text-transform:uppercase" placeholder="Рамзи даъват" value=${code} onInput=${e => setCode(e.target.value)} aria-label="Рамзи даъват" />
      <button class="btn p" disabled=${busy || code.trim().length < 4}>Ҳамроҳ шав</button>
    </form>
    ${err && html`<div class="err" style="margin-top:8px">${err}</div>`}
    <div class="sep"></div><a href="#/problems">То он вақт масъалаҳоро машқ кунед →</a>
  </div>`;
}

export function ProblemsList({ user }) {
  const [{ data, loading, error }, reload] = useLoad(() => api('/api/problems'));
  const [q, setQ] = useState(''); const [topic, setTopic] = useState(''); const [todo, setTodo] = useState(false); const [more, setMore] = useState({});
  if (loading) return html`<${Loading} />`;
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const teacher = user.role === 'teacher';
  const nq = q.trim().toLowerCase();
  const shown = data.filter(p => (!topic || p.topic === topic) && (!todo || !p.solved) && (!nq || p.title.toLowerCase().includes(nq) || String(p.id) === nq));
  const groups = Object.keys(TOPIC).filter(k => !topic || k === topic).map(k => [k, shown.filter(p => p.topic === k)]).filter(([, ps]) => ps.length);
  const LIM = 30;
  return html`<div class="page">
    <div class="row" style="margin-bottom:12px"><h1>Масъалаҳо</h1><span class="chip">${data.length}</span><div class="spacer"></div>
      ${teacher && html`<button class="btn p" onClick=${async () => { const r = await api('/api/problems', { method: 'POST', body: { topic: 'io' } }); location.hash = '#/problem/' + r.id + '/edit'; }}>+ Масъалаи нав</button>`}</div>
    <div class="pfilter">
      <input class="i" type="search" placeholder="Ҷустуҷӯ: номи масъала…" value=${q} onInput=${e => setQ(e.target.value)} aria-label="Ҷустуҷӯи масъала" data-testid="psearch" />
      <div class="pchips" role="group" aria-label="Мавзӯъ">
        <button class=${'chipbtn' + (!topic ? ' on' : '')} aria-pressed=${!topic} onClick=${() => setTopic('')}>Ҳама</button>
        ${Object.keys(TOPIC).filter(k => data.some(p => p.topic === k)).map(k => html`<button class=${'chipbtn' + (topic === k ? ' on' : '')} aria-pressed=${topic === k} onClick=${() => setTopic(topic === k ? '' : k)}>${TOPIC[k]}</button>`)}
        ${!teacher && html`<label class="chipbtn"><input type="checkbox" checked=${todo} onChange=${e => setTodo(e.target.checked)} /> Танҳо ҳалнашуда</label>`}
      </div>
    </div>
    ${!groups.length && html`<div class="card"><${Empty} title="Чизе ёфт нашуд">Калимаи дигарро санҷед ё филтрро тоза кунед.<//></div>`}
    <div class="grid3">${groups.map(([k, ps]) => { const lim = more[k] || nq ? ps.length : LIM; return html`<div class="card">
      <div class="row"><h3 style="margin:0">${TOPIC[k]}</h3><div class="spacer"></div><span class="muted small">${teacher ? `${ps.length} масъала` : `${ps.filter(p => p.solved).length} аз ${ps.length}`}</span></div>
      <div class="sep"></div>
      ${ps.slice(0, lim).map(p => html`<div class="row" style="padding:5px 0;gap:8px">
        <a href=${teacher ? `#/problem/${p.id}/edit` : `#/p/${p.id}`}>${p.title}</a>
        <span class="chip">${p.level || '—'}</span>
        ${p.solved && html`<span class="v v-ok">✓</span>`}
        ${teacher && !p.version && html`<span class="chip warn">нашр нашудааст</span>`}
        ${teacher && p.hasDraft && p.version > 0 && html`<span class="chip warn">тағйироти нашрнашуда</span>`}
        ${teacher && p.lessonOnly && html`<span class="chip">дарсӣ</span>`}
      </div>`)}
      ${ps.length > lim && html`<button class="btn sm" style="margin-top:8px" onClick=${() => setMore({ ...more, [k]: true })}>Боз ${ps.length - lim} масъала нишон деҳ</button>`}
    </div>`; })}</div>
  </div>`;
}

// Дарс аз назари шогирд: қадамҳо
export function StudentLesson({ id }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/lessons/${id}`), [id]);
  const [cur, setCur] = useState(null);
  useEvents(ev => { if (ev.type === 'lesson' && Number(ev.lesson_id) === Number(id)) reload(true); if (ev.type === 'submission') reload(true); }, [id]);
  if (loading) return html`<${Loading} />`;
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const { lesson, steps, group } = data;
  if (!steps.length) return html`<div class="page"><${Empty} title="Дар ин дарс ҳанӯз қадам нест">Устод қадамҳоро ба зудӣ илова мекунад.<//></div>`;
  const done = s => s.kind === 'problem' ? s.solved : !!s.response;
  const firstOpen = steps.findIndex(s => !done(s));
  const idx = cur ?? (firstOpen < 0 ? steps.length - 1 : firstOpen);
  const s = steps[Math.min(idx, steps.length - 1)];
  return html`<div class="page" style="max-width:980px">
    <div class="kicker">${group.name} · ${lesson.status === 'live' ? '● Дарс ҳозир меравад' : lesson.status === 'finished' ? 'Дарс анҷом ёфт' : 'Дарс ҳанӯз оғоз нашудааст'}</div>
    <h1 style="margin:4px 0 14px">${lesson.title}</h1>
    <div class="steps" role="tablist" style="margin-bottom:18px">${steps.map((x, i) => html`<button role="tab" aria-selected=${i === idx} class=${'step' + (i === idx ? ' on' : '') + (done(x) ? ' done' : '')} onClick=${() => setCur(i)}><span class="n">${done(x) ? '✓' : i + 1}</span>${x.title}</button>`)}</div>
    <div class="card" key=${s.id}>
      ${s.kind === 'predict' && html`<${PredictStep} s=${s} onDone=${() => { setCur(idx); reload(true); }} />`}
      ${s.kind === 'quiz' && html`<${QuizStep} s=${s} onDone=${() => { setCur(idx); reload(true); }} />`}
      ${s.kind === 'problem' && html`<div class="col">
        <h2>${s.title}: ${s.problem?.title}</h2>
        <p class="muted">${s.payload.mode === 'fix' ? 'Дар ин қадам барномаи тайёр хато дорад. Онро ислоҳ кунед, бо ҳамон тестҳо фиристед ва ду кӯшиши худро муқоиса кунед (ҷадвали «Кӯшишҳо»).' : 'Масъаларо худатон ҳал кунед. Аввал бо мисолҳо санҷед, баъд барои санҷиш фиристед.'}</p>
        <div class="row">${s.solved ? html`<span class="v v-ok">✓ Ҳал шуд</span>` : ''}<a class="btn p lg" href=${`#/p/${s.problem.id}?lesson=${lesson.id}`}>${s.solved ? 'Боз кушо' : 'Оғоз кун'}</a></div>
      </div>`}
    </div>
    <div class="row" style="margin-top:14px">
      ${idx > 0 && html`<button class="btn" onClick=${() => setCur(idx - 1)}>← Қадами пешина</button>`}<div class="spacer"></div>
      ${idx < steps.length - 1 && html`<button class="btn" onClick=${() => setCur(idx + 1)}>Қадами навбатӣ →</button>`}
    </div>
  </div>`;
}

function PredictStep({ s, onDone }) {
  const [a, setA] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [res, setRes] = useState(null);
  const r = res || (s.response ? { answer: s.response.answer, correct: s.response.correct, reveal: s.reveal } : null);
  const send = async () => { setBusy(true); setErr(null); try { setRes(await api(`/api/steps/${s.id}/respond`, { method: 'POST', body: { answer: a } })); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return html`<div class="col">
    <h2>${s.title}</h2><p>${s.payload.question}</p>
    <${CodeView} code=${s.payload.code} />
    ${s.payload.input && html`<div class="small">Вуруд: <code>${s.payload.input.trim()}</code></div>`}
    ${!r ? html`<label class="f">Пешгӯии ту: барнома чӣ чоп мекунад?<input class="i mono" value=${a} onInput=${e => setA(e.target.value)} placeholder="Сатреро, ки чоп мешавад, нависед" /></label>
      ${err && html`<div class="notice warn">${err}</div>`}
      <div><button class="btn p" disabled=${busy || !a.trim()} onClick=${send}>${busy ? html`<span class="spin"></span> Код иҷро мешавад…` : 'Фирист'}</button></div>`
    : html`<div class="io3" style="grid-template-columns:1fr 1fr">
        <div><div class="kicker">Пешгӯии ту</div><pre class="box">${r.answer}</pre></div>
        <div><div class="kicker">Натиҷаи воқеии иҷро</div><pre class="box">${r.reveal?.stdout || '(барнома натиҷа чоп накард)'}</pre></div>
      </div>
      <div class=${'notice ' + (r.correct ? 'ok' : 'warn')}>${r.correct ? 'Пешгӯии ту дуруст баромад!' : 'Пешгӯӣ бо натиҷаи воқеӣ фарқ мекунад. Ба шарти a > b барои a = b диққат деҳ: он нодуруст аст, бинобар ин шохаи else иҷро мешавад.'}</div>`}
  </div>`;
}

function QuizStep({ s, onDone }) {
  const [a, setA] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [res, setRes] = useState(null);
  const r = res || (s.response ? { answer: s.response.answer, correct: s.response.correct, reveal: s.reveal } : null);
  const send = async () => { setBusy(true); setErr(null); try { setRes(await api(`/api/steps/${s.id}/respond`, { method: 'POST', body: { answer: String(a) } })); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return html`<div class="col">
    <h2>${s.title}</h2><p style="font-size:17px">${s.payload.question}</p>
    <div class="col" style="gap:8px" role="radiogroup">${s.payload.options.map((o, i) => {
      const chosen = r ? Number(r.answer) === i : a === i; const right = r && r.reveal?.correct === i;
      return html`<label class="card" style=${`padding:10px 14px;cursor:${r ? 'default' : 'pointer'};${right ? 'border-color:var(--ok)' : chosen && r ? 'border-color:var(--bad)' : chosen ? 'border-color:var(--acc)' : ''}`}>
        <input type="radio" name=${'q' + s.id} disabled=${!!r} checked=${chosen} onChange=${() => setA(i)} /> <span class="mono">${o}</span> ${right ? html`<span class="v v-ok">дуруст</span>` : ''}</label>`;
    })}</div>
    ${!r && html`<div><button class="btn p" disabled=${a === null || busy} onClick=${send}>Фирист</button></div>`}
    ${err && html`<div class="err">${err}</div>`}
    ${r && html`<div class=${'notice ' + (r.correct ? 'ok' : 'warn')}>${r.correct ? 'Дуруст!' : 'Ҷавоби дуруст дигар аст.'} ${r.reveal?.explain || ''}</div>`}
  </div>`;
}
