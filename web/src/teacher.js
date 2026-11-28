// Саҳифаҳои устод: гурӯҳҳо, қолабҳо, ҳисобот, вазифаҳо
import { html, useState, useEffect, api, useLoad, useEvents, Loading, ErrorBox, Empty, Modal, fTime, fDate, fDateTime, fWeekday, dushanbeToday, dushanbeDateOf, TOPIC, TOPIC_KEYS, Verdict, toast, CodeView, since } from './lib.js';
import { AsgState } from './student.js';
import { CourseMap } from './course.js';

// Шогирдони блокшуда дар ҳамаи гурӯҳҳо — бо тугмаи «Блокро бардор»
function BlockedPanel() {
  const [{ data }, reload] = useLoad(() => api('/api/teacher/alerts'));
  useEvents(ev => { if (ev.type === 'exam') reload(true); });
  if (!data?.blocked?.length) return null;
  const unblock = async b => { try { await api(`/api/lessons/${b.lesson_id}/unblock`, { method: 'POST', body: { user_id: b.user_id } }); toast(`Блоки ${b.name} бардошта шуд — ӯ боз ба имтиҳон медарояд.`); reload(true); } catch (e) { toast(e.message); } };
  return html`<section class="blockpanel" role="alert" aria-label="Шогирдони блокшуда">
    <h2>⛔ Шогирдони блокшуда: ${data.blocked.length}</h2>
    <div class="small" style="margin-bottom:6px">Ин шогирдон дар имтиҳон 3 вайронкунӣ карданд. Танҳо шумо блокро бардошта метавонед.</div>
    ${data.blocked.map(b => html`<div class="bprow">
      <div class="bpwho"><b>${b.name}</b> <span class="mono small muted">${b.login}</span><div class="small muted">${b.group_name} · ${b.lesson_title} · ${since(b.updated_at) === '0 дақ.' ? 'ҳозир' : since(b.updated_at) + ' пеш'}</div></div>
      <a class="btn sm" href=${'#/g/' + b.group_id + '?tab=students'}>Гурӯҳ</a>
      <button class="btn p" onClick=${() => unblock(b)}>Блокро бардор</button>
    </div>`)}
  </section>`;
}

export function TeacherHome() {
  const [{ data, loading, error }, reload] = useLoad(() => Promise.all([api('/api/groups'), api('/api/templates')]));
  const [creating, setCreating] = useState(false);
  useEvents(ev => { if (['members', 'help', 'lesson'].includes(ev.type)) reload(true); });
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const [groups, templates] = data;
  const today = dushanbeToday();
  const sorted = [...groups].sort((a, b) => (b.live ? 2 : b.hasLessonToday ? 1 : 0) - (a.live ? 2 : a.hasLessonToday ? 1 : 0));
  return html`<div class="page">
    <${BlockedPanel} />
    <div class="row" style="margin-bottom:16px"><h1>Гурӯҳҳои ман</h1><div class="spacer"></div><button class="btn" onClick=${() => setCreating(true)}>+ Гурӯҳи нав</button></div>
    ${!groups.length && html`<div class="card"><${Empty} title="Ҳанӯз гурӯҳ нест">Гурӯҳи аввалро созед — 24 дарс (ҳафтае 6 бор) худкор ба нақша гирифта мешаванд.<div style="margin-top:12px"><button class="btn p" onClick=${() => setCreating(true)}>Гурӯҳ соз</button></div><//></div>`}
    <div class="col" style="gap:14px">${sorted.map((g, gi) => {
      const n = g.live || g.next; const isToday = n && dushanbeDateOf(n.scheduled_at) === today; const main = gi === 0;
      return html`<div class=${'card' + (g.live || isToday ? ' hl' : '')} style="padding:18px">
        <div class="row">
          <div style="min-width:240px;flex:1">
            <div class="kicker">${g.live ? '● Дарс ҳозир меравад' : isToday ? `Имрӯз дарс дорад · ${fTime(n.scheduled_at)}` : n ? `Дарси навбатӣ · ${fWeekday(n.scheduled_at)}, ${fDate(n.scheduled_at)}, ${fTime(n.scheduled_at)}` : 'Ҳамаи дарсҳо гузаштанд'}</div>
            <h2 style="margin:4px 0">${g.name}</h2>
            <div class="muted small">${n ? html`Дарси ${n.number}: <b>${n.title}</b> · ` : ''}${g.students} шогирд · ${g.lessonsDone}/${g.lessonsTotal} дарс гузашт</div>
          </div>
          ${g.blocked > 0 && html`<a class="chip bad" href=${'#/g/' + g.id + '?tab=students'}>⛔ ${g.blocked} блок</a>`}
          ${g.helpOpen > 0 && html`<span class="chip warn">✋ ${g.helpOpen} дархости ёрӣ</span>`}
          ${g.pendingCount > 0 && html`<a class="chip acc" href=${'#/g/' + g.id + '?tab=students'}>${g.pendingCount} шогирд интизори тасдиқ</a>`}
          ${n && html`<a class="btn" href=${'#/live/' + n.id}>${g.live ? 'Дарси зинда' : 'Дарси зинда'}</a>`}
          <a class=${'btn p' + (main ? ' lg' : '')} href=${'#/g/' + g.id}>Гурӯҳро кушо</a>
        </div>
      </div>`;
    })}</div>
    <h2 style="margin:28px 0 12px">Дарсҳои омода</h2>
    <div class="grid3">${templates.map(t => html`<${TemplateCard} t=${t} groups=${groups} onChange=${reload} />`)}</div>
    ${creating && html`<${GroupForm} onClose=${() => setCreating(false)} onDone=${id => { setCreating(false); location.hash = '#/g/' + id; }} />`}
  </div>`;
}

function TemplateCard({ t, groups, onChange }) {
  const [gid, setGid] = useState(groups[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const give = async () => {
    setBusy(true);
    try { const r = await api(`/api/templates/${t.id}/assign`, { method: 'POST', body: { group_id: Number(gid) } }); toast('Дарс ба гурӯҳ дода шуд.'); location.hash = '#/live/' + r.lesson_id; }
    catch (e) { toast(e.message); } finally { setBusy(false); }
  };
  return html`<div class="card">
    <div class="kicker">${TOPIC[t.topic] || t.topic} · ${t.steps.length} қадам</div>
    <h3 style="margin:4px 0 8px">${t.title}</h3>
    <ol class="small muted" style="margin:0 0 12px 18px;padding:0">${t.steps.map(s => html`<li>${s.title}</li>`)}</ol>
    ${groups.length > 0 && html`<div class="row" style="gap:6px">
      <select class="i" style="flex:1;min-width:140px" value=${gid} onChange=${e => setGid(e.target.value)} aria-label="Гурӯҳ">${groups.map(g => html`<option value=${g.id}>${g.name}</option>`)}</select>
      <button class="btn p" disabled=${busy || !gid} onClick=${give} title="Ба дарси навбатии ин гурӯҳ гузошта мешавад">Ба гурӯҳ деҳ</button>
    </div>`}
    <div style="margin-top:8px"><a class="small" href=${'#/template/' + t.id}>Таҳрир кун ё нусха бардор →</a></div>
  </div>`;
}

function GroupForm({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', start_date: dushanbeToday(), lesson_time: '14:00', weekdays: [1, 2, 3, 4, 5, 6], count: 24 });
  const [err, setErr] = useState(null);
  const WD = ['Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб', 'Яш'];
  const submit = async e => { e.preventDefault(); setErr(null); try { const r = await api('/api/groups', { method: 'POST', body: { ...f, weekdays: f.weekdays.join(',') } }); onDone(r.id); } catch (x) { setErr(x.message); } };
  return html`<${Modal} title="Гурӯҳи нав" onClose=${onClose}>
    <form class="col" onSubmit=${submit}>
      <label class="f">Номи гурӯҳ<input class="i" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="C++ асосӣ — гурӯҳи 3" required /></label>
      <div class="row"><label class="f" style="flex:1">Санаи оғоз<input class="i" type="date" value=${f.start_date} onInput=${e => setF({ ...f, start_date: e.target.value })} /></label>
        <label class="f" style="flex:1">Вақти дарс (Душанбе)<input class="i" type="time" value=${f.lesson_time} onInput=${e => setF({ ...f, lesson_time: e.target.value })} /></label>
        <label class="f" style="width:120px">Шумораи дарс<input class="i" type="number" min="1" max="60" value=${f.count} onInput=${e => setF({ ...f, count: Number(e.target.value) })} /></label></div>
      <div><div class="small" style="font-weight:600;margin-bottom:5px">Рӯзҳои дарс</div><div class="row" style="gap:6px">${WD.map((w, i) => { const d = i + 1; const on = f.weekdays.includes(d); return html`<button type="button" class=${'btn sm' + (on ? ' p' : '')} aria-pressed=${on} onClick=${() => setF({ ...f, weekdays: on ? f.weekdays.filter(x => x !== d) : [...f.weekdays, d].sort() })}>${w}</button>`; })}</div></div>
      <div class="small muted">Пешфарз: 1 моҳ, ҳафтае 6 дарс (душанбе–шанбе) = 24 дарс. Дарсҳо аз рӯи 6 мавзӯъ ба нақша гирифта мешаванд; ҳар дарсро баъдтар иваз кардан мумкин аст.</div>
      ${err && html`<div class="err">${err}</div>`}
      <div class="row"><button class="btn p">Соз</button><button type="button" class="btn ghost" onClick=${onClose}>Бекор кун</button></div>
    </form>
  <//>`;
}

function QuickStudents({ g, reload, openTab }) {
  const [login, setLogin] = useState(''); const [err, setErr] = useState(null);
  const active = g.members.filter(m => m.status === 'active'), pending = g.members.filter(m => m.status === 'pending');
  const add = async e => { e.preventDefault(); setErr(null); try { await api(`/api/groups/${g.group.id}/members`, { method: 'POST', body: { login } }); setLogin(''); toast('Шогирд илова шуд. Масъалаҳо ҳозир дар саҳифаи ӯ пайдо мешаванд.'); reload(true); } catch (x) { setErr(x.message); } };
  const approve = async id => { try { await api(`/api/groups/${g.group.id}/members`, { method: 'POST', body: { user_id: id } }); toast('Қабул шуд.'); reload(true); } catch (x) { setErr(x.message); } };
  return html`<div class="card hl" style="margin-bottom:18px">
    <div class="row" style="align-items:flex-start;gap:24px">
      <div style="flex:1;min-width:260px">
        <h3>1. Шогирдонро илова кунед</h3>
        <p class="small muted">Шогирд дар сайт «Сабти ном» мекунад ва логинашро ба шумо мегӯяд. Логинро ин ҷо нависед — тамом: ҳамаи масъалаҳои курс худкор дар саҳифаи ӯ пайдо мешаванд.</p>
        <form class="row" onSubmit=${add}><input class="i mono" style="flex:1" placeholder="логини шогирд" value=${login} onInput=${e => setLogin(e.target.value)} aria-label="Логини шогирд" /><button class="btn p" disabled=${!login.trim()}>Илова кун</button></form>
        ${err && html`<div class="err" style="margin-top:6px">${err}</div>`}
        ${pending.length > 0 && html`<div style="margin-top:10px">${pending.map(m => html`<div class="row" style="padding:3px 0"><span class="chip warn">нав</span><b>${m.name}</b><span class="mono small muted">${m.login}</span><button class="btn sm p" onClick=${() => approve(m.id)}>Қабул кун</button></div>`)}</div>`}
      </div>
      <div style="min-width:200px">
        <h3>Ё рамзи даъват</h3>
        <div class="mono" style="font-size:28px;font-weight:800;letter-spacing:.12em">${g.group.invite_code}</div>
        <div class="small muted">Шогирд пас аз сабти ном ин рамзро ворид мекунад.</div>
      </div>
      <div style="min-width:160px">
        <h3>Дар гурӯҳ</h3>
        <div class="bigstat">${active.length}</div><a href="#" class="small" onClick=${e => { e.preventDefault(); openTab(); }}>рӯйхати шогирдон →</a>
      </div>
    </div>
  </div>`;
}

export function GroupPage({ id, tab: tab0 }) {
  const [{ data, loading, error }, reload] = useLoad(() => Promise.all([api(`/api/groups/${id}`), api('/api/templates'), api('/api/problems')]), [id]);
  const [tab, setTab] = useState(tab0 || 'course');
  useEffect(() => { if (tab0) setTab(tab0); }, [tab0]);
  useEvents(ev => { if (['members', 'assignment', 'activity', 'exam'].includes(ev.type) && Number(ev.group_id) === Number(id)) reload(true); }, [id]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const [g, templates, problems] = data;
  const pending = g.members.filter(m => m.status === 'pending');
  return html`<div class="page">
    <a href="#/" class="small">← Гурӯҳҳо</a>
    <div class="row" style="margin:6px 0 14px"><h1>${g.group.name}</h1></div>
    <${QuickStudents} g=${g} reload=${reload} openTab=${() => setTab('students')} />
    <div class="tabs" style="margin:0 0 16px;position:static;padding:0">
      ${[['course', 'Нақшаи курс'], ['lessons', `Ҷадвали дарсҳо (${g.lessons.length})`], ['students', `Шогирдон (${g.members.filter(m => m.status === 'active').length})${pending.length ? ` · ${pending.length} нав` : ''}`], ['homework', `Вазифаҳо (${g.assignments.length})`]].map(([k, t]) => html`<button class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${t}</button>`)}
    </div>
    ${tab === 'course' && html`<${CourseMap} gid=${Number(id)} embedded />`}
    ${tab === 'lessons' && html`<${LessonsTab} g=${g} templates=${templates} reload=${reload} />`}
    ${tab === 'students' && html`<${StudentsTab} g=${g} reload=${reload} />`}
    ${tab === 'homework' && html`<${HomeworkTab} g=${g} problems=${problems} reload=${reload} />`}
  </div>`;
}

function LessonsTab({ g, templates, reload }) {
  const today = dushanbeToday();
  const apply = async (lid, tid) => { if (!tid) return; try { await api(`/api/templates/${tid}/assign`, { method: 'POST', body: { lesson_id: lid } }); toast('Қолаб гузошта шуд.'); reload(true); } catch (e) { toast(e.message); } };
  return html`<div class="card" style="padding:0;overflow:auto"><table class="t">
    <thead><tr><th>№</th><th>Сана (Душанбе)</th><th>Мавзӯъ</th><th>Ҳолат</th><th></th></tr></thead>
    <tbody>${g.lessons.map(l => { const d = dushanbeDateOf(l.scheduled_at); return html`<tr style=${d === today ? 'background:var(--acc-soft)' : ''}>
      <td>${l.number}</td><td style="white-space:nowrap">${fWeekday(l.scheduled_at)}, ${fDate(l.scheduled_at)} · ${fTime(l.scheduled_at)}${d === today ? html` <span class="chip acc">имрӯз</span>` : ''}</td>
      <td><b>${l.title}</b><div class="muted small">${l.steps} қадам</div></td>
      <td>${l.status === 'live' ? html`<span class="v v-info">● Меравад</span>` : l.status === 'finished' ? html`<span class="v v-ok">Гузашт</span>` : html`<span class="v v-none">Ба нақша</span>`}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap">
        <a class="btn sm p" href=${'#/live/' + l.id}>Кушо</a>
        ${l.status !== 'planned' && html`<a class="btn sm" href=${'#/report/' + l.id}>Ҳисобот</a>`}
        <select class="i" style="width:auto;min-height:30px;padding:3px 6px" onChange=${e => { apply(l.id, e.target.value); e.target.value = ''; }} aria-label="Қолаби дарс гузор"><option value="">Қолаб гузор…</option>${templates.map(t => html`<option value=${t.id}>${t.title}</option>`)}</select>
      </div></td></tr>`; })}</tbody></table></div>`;
}

function StudentsTab({ g, reload }) {
  const [login, setLogin] = useState(''); const [err, setErr] = useState(null); const [pw, setPw] = useState(null);
  const resetPw = async m => { if (!confirm(`Барои ${m.name} пароли нав созем? Пароли кӯҳна дигар кор намекунад.`)) return; try { const r = await api(`/api/groups/${g.group.id}/members/${m.id}/password`, { method: 'POST' }); setPw({ ...r, name: m.name }); } catch (e) { setErr(e.message); } };
  const act = async (fn, msg) => { setErr(null); try { await fn(); msg && toast(msg); reload(true); } catch (e) { setErr(e.message); } };
  const pending = g.members.filter(m => m.status === 'pending'), active = g.members.filter(m => m.status === 'active');
  return html`<div class="grid2">
    <div class="card"><h3>Шогирдони гурӯҳ</h3>
      ${active.some(m => m.exam_blocked?.length) && html`<div class="notice bad" style="margin-bottom:10px" role="alert"><b>⛔ Дар имтиҳон блок шудаанд:</b>
        ${active.filter(m => m.exam_blocked?.length).flatMap(m => m.exam_blocked.map(b => html`<div class="row" style="margin-top:6px"><b>${m.name}</b><span class="small">${b.title}</span><div class="spacer"></div>
          <button class="btn sm p" onClick=${() => act(() => api(`/api/lessons/${b.lesson_id}/unblock`, { method: 'POST', body: { user_id: m.id } }), `Блоки ${m.name} бардошта шуд.`)}>Блокро бардор</button></div>`))}</div>`}
      ${!active.length ? html`<div class="muted">Ҳанӯз шогирд нест.</div>` : html`<table class="t"><tbody>${active.map(m => html`<tr><td><b>${m.name}</b> <span class="muted mono small">${m.login}</span>${(m.exams || []).map(e => html` <span class=${'v ' + (e.blocked ? 'v-bad' : 'v-warn')} title=${e.title}>${e.blocked ? '⛔ Блок' : `⚠ ${e.count}/3`} · ${e.title}</span>`)}</td><td style="text-align:right;white-space:nowrap"><a class="btn sm" href=${`#/g/${g.group.id}/s/${m.id}`}>Пешрафт</a> <button class="btn sm" onClick=${() => resetPw(m)}>Пароли нав</button> <button class="btn sm danger" onClick=${() => confirm(`${m.name}-ро аз гурӯҳ хориҷ кунем?`) && act(() => api(`/api/groups/${g.group.id}/members/${m.id}`, { method: 'DELETE' }))}>Хориҷ кун</button></td></tr>`)}</tbody></table>`}
      ${pw && html`<${Modal} title=${'Пароли нав: ' + pw.name} onClose=${() => setPw(null)}>
        <div class="pwcard" role="status" data-testid="newpw">
          <div class="pwrow"><span>Логин</span><b class="mono">${pw.login}</b></div>
          <div class="pwrow"><span>Парол</span><b class="mono">${pw.password}</b></div>
        </div>
        <p class="muted">Инро ба шогирд гӯед ё нависед. Пароли кӯҳна дигар кор намекунад. Шогирд баъд дар «👤 Ҳисоби ман» пароли худро гузошта метавонад.</p>
        <div class="row"><button class="btn p" onClick=${() => { navigator.clipboard?.writeText(`Логин: ${pw.login}\nПарол: ${pw.password}`).then(() => toast('Нусха бардошта шуд.'), () => {}); }}>Нусха бардор</button><button class="btn" onClick=${() => setPw(null)}>Пӯшидан</button></div>
      <//>`}
      <div class="sep"></div>
      <div class="row"><a class="btn" href=${`/api/groups/${g.group.id}/export.csv`} download>⬇ Натиҷаҳо ба Excel</a><div class="spacer"></div>
        <button class="btn sm danger" onClick=${async () => { if (prompt(`Барои нест кардан номи гурӯҳро нависед: ${g.group.name}`) !== g.group.name) return; try { await api('/api/groups/' + g.group.id, { method: 'DELETE' }); toast('Гурӯҳ нест карда шуд.'); location.hash = '#/'; } catch (e) { toast(e.message); } }}>Гурӯҳро нест кун</button></div>
    </div>
    <div class="col">
      ${pending.length > 0 && html`<div class="card hl"><h3>Дархостҳои нав</h3>${pending.map(m => html`<div class="row" style="padding:6px 0"><b>${m.name}</b><span class="mono small muted">${m.login}</span><div class="spacer"></div>
        <button class="btn sm p" onClick=${() => act(() => api(`/api/groups/${g.group.id}/members`, { method: 'POST', body: { user_id: m.id } }), 'Шогирд ба гурӯҳ илова шуд.')}>Қабул кун</button>
        <button class="btn sm" onClick=${() => act(() => api(`/api/groups/${g.group.id}/members/${m.id}`, { method: 'DELETE' }))}>Рад кун</button></div>`)}</div>`}
      <div class="card"><h3>Илова кардани шогирд</h3>
        <p class="small muted">Шогирд аввал худаш дар саҳифаи воридшавӣ «Сабти ном» мекунад. Баъд логини ӯро ин ҷо нависед.</p>
        <form class="row" onSubmit=${e => { e.preventDefault(); act(() => api(`/api/groups/${g.group.id}/members`, { method: 'POST', body: { login } }), 'Шогирд ба гурӯҳ илова шуд.').then(() => setLogin('')); }}>
          <input class="i mono" style="flex:1" placeholder="логини шогирд" value=${login} onInput=${e => setLogin(e.target.value)} aria-label="Логини шогирд" /><button class="btn p" disabled=${!login.trim()}>Илова кун</button></form>
        <div class="sep"></div>
        <h3>Рамзи даъват</h3>
        <div class="row"><span class="mono" style="font-size:26px;font-weight:800;letter-spacing:.12em">${g.group.invite_code}</span><div class="spacer"></div>
          <button class="btn" onClick=${() => confirm('Рамзи кӯҳна дигар кор намекунад. Иваз кунем?') && act(() => api(`/api/groups/${g.group.id}/invite`, { method: 'POST' }), 'Рамзи нав сохта шуд.')}>Рамзро иваз кун</button></div>
        <p class="small muted" style="margin-top:6px">Шогирд бо ин рамз дархост мефиристад; шумо онро дар «Дархостҳои нав» қабул мекунед.</p>
        ${err && html`<div class="err">${err}</div>`}
      </div>
    </div>
  </div>`;
}

export function AssignmentForm({ g, problems, preset = [], lessonId, onDone }) {
  const tomorrow = new Date(Date.now() + 5 * 3600000 + 86400000).toISOString().slice(0, 10);
  const [f, setF] = useState({ title: 'Вазифаи хонагӣ', ids: preset, date: tomorrow, time: '20:00' });
  const [err, setErr] = useState(null);
  const [q, setQ] = useState(''); const nq = q.trim().toLowerCase();
  const pub = problems.filter(p => p.version > 0 && !p.lessonOnly);
  const toggle = id => setF(x => ({ ...x, ids: x.ids.includes(id) ? x.ids.filter(i => i !== id) : [...x.ids, id] }));
  const send = async e => { e.preventDefault(); setErr(null); try { await api(`/api/groups/${g.group?.id || g.id}/assignments`, { method: 'POST', body: { title: f.title, problem_ids: f.ids, due_local: `${f.date}T${f.time}`, lesson_id: lessonId } }); toast('Вазифа ба гурӯҳ фиристода шуд.'); onDone?.(); } catch (x) { setErr(x.message); } };
  return html`<form class="col" onSubmit=${send}>
    <div class="row"><label class="f" style="flex:2">Ном<input class="i" value=${f.title} onInput=${e => setF({ ...f, title: e.target.value })} /></label>
      <label class="f" style="flex:1">Муҳлат: сана<input class="i" type="date" value=${f.date} onInput=${e => setF({ ...f, date: e.target.value })} /></label>
      <label class="f" style="flex:1">соат (Душанбе)<input class="i" type="time" value=${f.time} onInput=${e => setF({ ...f, time: e.target.value })} /></label></div>
    <input class="i" type="search" placeholder="Ҷустуҷӯи масъала аз рӯи ном…" value=${q} onInput=${e => setQ(e.target.value)} aria-label="Ҷустуҷӯи масъала" />
    <div class="grid3 pickgrid" style="gap:10px">${TOPIC_KEYS.map(k => { const ps = pub.filter(p => p.topic === k && (!nq || p.title.toLowerCase().includes(nq) || f.ids.includes(p.id))); return ps.length ? html`<div><div class="kicker">${TOPIC[k]} (${ps.length})</div>${ps.map(p => html`<label style="display:block;padding:3px 0"><input type="checkbox" checked=${f.ids.includes(p.id)} onChange=${() => toggle(p.id)} /> ${p.title}</label>`)}</div>` : null; })}</div>
    ${err && html`<div class="err">${err}</div>`}
    <div><button class="btn p" disabled=${!f.ids.length}>Ба гурӯҳ фирист (${f.ids.length})</button></div>
  </form>`;
}

function HomeworkTab({ g, problems, reload }) {
  const [open, setOpen] = useState(false);
  return html`<div class="col">
    <div class="row"><div class="spacer"></div><button class="btn p" onClick=${() => setOpen(true)}>+ Вазифаи нав</button></div>
    ${!g.assignments.length && html`<div class="card"><${Empty} title="Вазифа нест">Пас аз дарс масъалаҳоро бо муҳлат ба гурӯҳ фиристед.<//></div>`}
    ${g.assignments.map(a => html`<div class="card" style="overflow:auto">
      <div class="row"><h3 style="margin:0">${a.title}</h3><span class="chip warn">муҳлат: ${fWeekday(a.due_at)}, ${fDateTime(a.due_at)} (Душанбе)</span></div>
      <table class="t" style="margin-top:10px"><thead><tr><th>Шогирд</th>${a.students[0]?.problems.map(p => html`<th>${p.title}</th>`)}</tr></thead>
      <tbody>${a.students.map(s => html`<tr><td><b>${s.name}</b></td>${s.problems.map(p => html`<td><${AsgState} s=${p.state} />${p.solved_at ? html`<div class="small muted">${fDateTime(p.solved_at)}</div>` : ''}</td>`)}</tr>`)}</tbody></table>
    </div>`)}
    ${open && html`<${Modal} title="Вазифаи хонагӣ" onClose=${() => setOpen(false)} wide><${AssignmentForm} g=${g} problems=${problems} onDone=${() => { setOpen(false); reload(true); }} /><//>`}
  </div>`;
}

// Рӯйхати кӯшишҳое, ки рақам аз онҳо ҳисоб шудааст
export function AttemptsModal({ title, ids, onClose }) {
  const [{ data, loading, error }] = useLoad(() => api(`/api/attempts?ids=${ids.join(',')}`), [ids.join(',')]);
  const [open, setOpen] = useState(null);
  const [sub, setSub] = useState(null);
  useEffect(() => { if (open) api(`/api/submissions/${open}`).then(setSub); else setSub(null); }, [open]);
  return html`<${Modal} title=${title} onClose=${onClose} wide>
    ${loading ? html`<${Loading} />` : error ? html`<${ErrorBox} error=${error} />` : !data.length ? html`<div class="muted">Кӯшиш нест.</div>` : html`
      <div class="small muted" style="margin-bottom:8px">${data.length} кӯшиш. Барои дидани код сатрро пахш кунед.</div>
      <table class="t"><thead><tr><th>Шогирд</th><th>Масъала</th><th>Кӯшиш</th><th>Вақт</th><th>Натиҷа</th><th>Тестҳои афтода</th></tr></thead>
      <tbody>${data.map(a => html`<tr class="click" onClick=${() => setOpen(open === a.id ? null : a.id)}><td><b>${a.user?.name}</b></td><td>${a.problem_title} <span class="muted small">в.${a.problem_version}</span></td><td>№${a.number}</td><td>${fTime(a.created_at)}</td><td>${a.verdict ? html`<${Verdict} v=${a.verdict} extra=${['CE', 'SE'].includes(a.verdict) ? '' : `${a.passed}/${a.total}`} />` : '…'}</td><td>${(a.failedTags || []).map(t => html`<span class="chip">${t}</span> `)}</td></tr>`)}</tbody></table>
      ${sub && html`<div style="margin-top:12px"><h3>${sub.user?.name} · кӯшиши №${sub.number}</h3><${CodeView} code=${sub.code} comments=${sub.comments} /></div>`}`}
  <//>`;
}

export function Report({ id }) {
  const [{ data, loading, error }, reload] = useLoad(() => Promise.all([api(`/api/lessons/${id}/report`), api('/api/problems')]), [id]);
  const [drill, setDrill] = useState(null);
  const [hw, setHw] = useState(false);
  useEvents(ev => { if (ev.type === 'activity' || ev.type === 'help') reload(true); }, [id]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const [r, problems] = data;
  const N = ({ ids, children, title }) => ids?.length ? html`<button class="num" onClick=${() => setDrill({ ids, title })}>${children}</button>` : html`<b>${children}</b>`;
  const hwPreset = JSON.parse(r.lesson.homework_problem_ids || '[]');
  return html`<div class="page">
    <a href=${'#/live/' + id} class="small">← Ба дарс</a>
    <div class="row" style="margin:6px 0 16px"><h1>Ҳисоботи дарс: ${r.lesson.title}</h1><div class="spacer"></div><button class="btn p" onClick=${() => setHw(true)}>Вазифаи хонагӣ фирист</button></div>
    <div class="grid3">
      <div class="card"><div class="kicker">1. Кадом масъала мушкил буд?</div>
        ${r.hardest ? html`<h2 style="margin:8px 0">${r.hardest.problem.title}</h2>
          <p><${N} ids=${r.hardest.subIds.stuck} title=${'Кӯшишҳои шогирдоне, ки «' + r.hardest.problem.title + '»-ро ҳал накарданд'}>${r.hardest.stuck}</${N}> аз ${r.hardest.attempted} шогирди кӯшишкарда ҳанӯз ҳал накардаанд.
          Ҳамагӣ <${N} ids=${r.hardest.subIds.failed} title="Ҳамаи кӯшишҳои нодуруст">${r.hardest.failed}</${N}> кӯшиши нодуруст.</p>` : html`<p class="muted" style="margin-top:8px">Ҳанӯз кӯшиш нест.</p>`}
      </div>
      <div class="card"><div class="kicker">2. Кӣ ҳанӯз ёрӣ мехоҳад?</div>
        ${r.needHelp.length ? html`<div class="bigstat" style="margin:8px 0"><${N} ids=${r.needHelp.flatMap(n => n.subIds)} title="Кӯшишҳои шогирдони ниёзманд ба ёрӣ">${r.needHelp.length}</${N}> <span style="font-size:15px;font-weight:600">шогирд</span></div>
          ${r.needHelp.map(n => html`<div style="padding:4px 0"><${N} ids=${n.subIds} title=${'Кӯшишҳои ' + n.user.name}>${n.user.name}</${N}><div class="small muted">${n.reasons.join('; ')}</div></div>`)}`
          : html`<p class="muted" style="margin-top:8px">Ҳама масъалаҳои кӯшишкардаро ҳал карданд ва дархости ёрӣ нест.</p>`}
      </div>
      <div class="card"><div class="kicker">3. Дарси оянда чиро такрор кунам?</div>
        ${r.repeat ? html`<h2 style="margin:8px 0">${r.repeat.topic}${r.repeat.tag ? html` — «${r.repeat.tag}»` : ''}</h2>
          <p><${N} ids=${r.repeat.subIds} title=${'Кӯшишҳое, ки тестҳои «' + (r.repeat.tag || '') + '»-ро нагузаштанд'}>${r.repeat.count}</${N}> шогирд ${r.repeat.tag ? html`аз тестҳои бахши «${r.repeat.tag}» нагузаштаанд` : 'масъаларо ҳал накардаанд'}.</p>
          ${r.repeat.practice.length > 0 && html`<div class="small">Машқ барои такрор: ${r.repeat.practice.map(p => html`<span class="chip acc">${p.title}</span> `)}</div>`}`
          : html`<p class="muted" style="margin-top:8px">Аз натиҷаҳо мушкилии такрорӣ дида намешавад.</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:18px;overflow:auto"><h3>Масъалаҳои дарс</h3>
      <table class="t"><thead><tr><th>Масъала</th><th>Кӯшиш карданд</th><th>Ҳал карданд</th><th>Ҳанӯз не</th><th>Кӯшишҳо</th><th>Нодуруст</th></tr></thead>
      <tbody>${r.problems.map(p => html`<tr><td><b>${p.problem.title}</b></td><td>${p.attempted} / ${p.participants}</td>
        <td><${N} ids=${p.subIds.solved} title="Кӯшишҳои дуруст">${p.solved}</${N}></td><td><${N} ids=${p.subIds.stuck} title="Кӯшишҳои шогирдони ҳалнакарда">${p.stuck}</${N}></td>
        <td><${N} ids=${p.subIds.all} title="Ҳамаи кӯшишҳо">${p.attempts}</${N}></td><td><${N} ids=${p.subIds.failed} title="Кӯшишҳои нодуруст">${p.failed}</${N}></td></tr>`)}</tbody></table>
      ${r.summary.tags.length > 0 && html`<div class="sep"></div><h3>Аз рӯи тамғаи тестҳо</h3>${r.summary.tags.map(t => html`<div style="padding:3px 0"><${N} ids=${t.subIds} title=${'Тамға: ' + t.tag}>${t.count}</${N}> шогирд ҳоло аз тестҳои бахши «${t.tag}» нагузаштаанд <span class="muted small">(${t.problems.join(', ')})</span></div>`)}`}
    </div>
    ${drill && html`<${AttemptsModal} title=${drill.title} ids=${drill.ids} onClose=${() => setDrill(null)} />`}
    ${hw && html`<${Modal} title="Вазифаи хонагӣ барои гурӯҳ" onClose=${() => setHw(false)} wide><${AssignmentForm} g=${{ id: r.lesson.group_id }} problems=${problems} preset=${hwPreset} lessonId=${r.lesson.id} onDone=${() => setHw(false)} /><//>`}
  </div>`;
}

const SP_SETS = [['class', 'Синфӣ'], ['home', 'Хонагӣ'], ['extra', 'Иловагӣ']];
const SP_EXAM = { class: 'A', home: 'B', extra: 'Мураккаб' };
const nSolved = ps => ps.filter(p => p.solved).length;
// Пешрафти як шогирд аз рӯи рӯзҳои курс: ҳафта → рӯз → синфӣ / хонагӣ / иловагӣ
export function StudentProgress({ gid, uid }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/groups/${gid}/students/${uid}`), [gid, uid]);
  const [open, setOpen] = useState(null);
  const [exp, setExp] = useState({});
  useEvents(ev => { if (ev.type === 'activity' && Number(ev.user_id) === Number(uid)) reload(true); if (ev.type === 'exam' && Number(ev.user_id) === Number(uid)) reload(true); }, [uid]);
  if (loading) return html`<${Loading} />`;
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const { student, days, other, help, assignments } = data;
  const all = d => SP_SETS.flatMap(([k]) => d.sets[k]);
  const openDays = days.filter(d => d.opened);
  const total = openDays.reduce((a, d) => a + all(d).length, 0);
  const solved = openDays.reduce((a, d) => a + nSolved(all(d)), 0);
  const lastOpen = [...days].reverse().find(d => d.opened);
  const isExp = d => exp[d.id] ?? d.id === lastOpen?.id;
  const weeks = [];
  for (const d of days) (weeks[d.week - 1] ||= { week: d.week, days: [] }).days.push(d);
  return html`<div class="page">
    <a href=${`#/g/${gid}?tab=students`} class="small">← Шогирдон</a>
    <div class="row" style="margin:6px 0 14px"><h1>${student.name}</h1><span class="chip mono">${student.login}</span>
      <span class="chip acc" data-testid="sp-total">${solved} аз ${total} ҳал шуд</span><span class="muted small">дар ${openDays.length} рӯзи кушода</span></div>
    <div class="grid2 spgrid">
      <div class="col" style="gap:10px">
        ${weeks.filter(Boolean).map(w => html`<div class="kicker" style="margin-top:8px">Ҳафтаи ${w.week}</div>
          ${w.days.map(d => { const ps = all(d), sv = nSolved(ps), pc = ps.length ? Math.round((100 * sv) / ps.length) : 0;
            return html`<div class=${'card spday' + (d.opened ? '' : ' closed')}>
              <button class="spday-h" aria-expanded=${isExp(d) ? 'true' : 'false'} onClick=${() => setExp({ ...exp, [d.id]: !isExp(d) })}>
                <span class="spday-t"><b>Ҳ${d.week} · ${d.kind === 'exam' ? 'Имтиҳон' : `Рӯзи ${d.day}`}</b> <span class="muted">${d.title}</span></span>
                <span class="spday-m">
                  ${!d.opened && html`<span class="chip">🔒 пӯшида</span>`}
                  ${d.exam?.blocked && html`<span class="chip bad">⛔ блок</span>`}
                  ${d.exam?.finished && html`<span class="chip acc">${sv * 10}/${ps.length * 10} хол · ${pc}%</span>`}
                  ${d.exam && !d.exam.finished && d.exam.accepted && !d.exam.blocked && html`<span class="chip warn">дар имтиҳон</span>`}
                  ${SP_SETS.map(([k, n]) => html`<span class=${'chip' + (d.sets[k].length && nSolved(d.sets[k]) === d.sets[k].length ? ' acc' : '')}>${d.kind === 'exam' ? SP_EXAM[k] : n} ${nSolved(d.sets[k])}/${d.sets[k].length}</span>`)}
                  <span class="caret" aria-hidden="true">${isExp(d) ? '▾' : '▸'}</span>
                </span>
                <span class="bar"><i style=${`width:${pc}%`}></i></span>
              </button>
              ${isExp(d) && html`<div class="spday-b">${SP_SETS.map(([k, n]) => html`<div class="kicker" style="margin-top:10px">${d.kind === 'exam' ? `Қисми ${SP_EXAM[k]}` : n} · ${nSolved(d.sets[k])}/${d.sets[k].length}</div>
                <${ProbRows} ps=${d.sets[k]} onOpen=${setOpen} />`)}</div>`}
            </div>`; })}`)}
        ${other.length > 0 && html`<div class="card"><h3>Масъалаҳои дигар (машқ)</h3><${ProbRows} ps=${other} onOpen=${setOpen} /></div>`}
      </div>
      <div class="col">
        <div class="card"><h3>Вазифаҳои хонагӣ</h3>${!assignments.length ? html`<div class="muted small">Вазифаи иловагӣ нест. Вазифаи хонагии ҳар рӯз дар чап, дар бахши «Хонагӣ».</div>` : assignments.map(a => html`<div style="margin-bottom:10px"><b>${a.title}</b> <span class="muted small">то ${fDateTime(a.due_at)}</span>${a.problems.map(p => html`<div class="row" style="padding:2px 0"><span class="small">${p.title}</span><div class="spacer"></div><${AsgState} s=${p.state} /></div>`)}</div>`)}</div>
        <div class="card"><h3>Дархостҳои ёрӣ</h3>${!help.length ? html`<div class="muted small">Дархост набуд.</div>` : help.map(h => html`<div class="small" style="padding:3px 0">${fDateTime(h.created_at)} · «${h.question}» <span class="muted">(${h.status === 'done' ? 'анҷом ёфт' : h.status === 'taken' ? 'гирифта шуд' : 'интизор'})</span></div>`)}</div>
      </div>
    </div>
    ${open && html`<${AttemptsModal} title=${'Кӯшиши охирин'} ids=${[open.id]} onClose=${() => setOpen(null)} />`}
  </div>`;
}
function ProbRows({ ps, onOpen }) {
  return html`<table class="t" style="table-layout:fixed"><tbody>${ps.map((p, j) => html`<tr class=${p.last_id ? 'click' : ''} onClick=${() => p.last_id && onOpen({ id: p.last_id })}>
    <td style="width:46%"><span class="muted small">${j + 1}.</span> ${p.title}</td>
    <td style="width:30%">${p.solved ? html`<span class="v v-ok">✓ Ҳал шуд</span>` : p.last ? html`<${Verdict} v=${p.last.verdict} extra=${['CE'].includes(p.last.verdict) ? '' : `${p.last.passed}/${p.last.total}`} />` : html`<span class="v v-none">Оғоз нашуд</span>`}</td>
    <td class="muted small">${p.attempts ? `${p.attempts} кӯшиш` : ''}${p.solved_at ? ` · ${fDateTime(p.solved_at)}` : ''}</td></tr>`)}</tbody></table>`;
}
