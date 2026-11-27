// «Нақшаи курс»: ҳафта → рӯз → маҷмӯаҳо, саҳифаи маҷмӯа ва ҳифзи имтиҳон
import { html, useState, useEffect, useRef, api, useLoad, useEvents, Loading, ErrorBox, Empty, Modal, fTime, fDate, fWeekday, TOPIC, TOPIC_KEYS, toast } from './lib.js';
import { Workspace } from './workspace.js';

const SET = { class: 'Синфӣ', home: 'Хонагӣ', extra: 'Иловагӣ' };
const SET_LONG = { class: 'Вазифаи синфӣ', home: 'Вазифаи хонагӣ', extra: 'Вазифаи иловагӣ' };
const EXAM = { class: 'Имтиҳон A', home: 'Имтиҳон B', extra: 'Имтиҳони мураккаб' };
const setName = (kind, k, long) => kind === 'exam' ? EXAM[k] : (long ? SET_LONG : SET)[k];
const STATE = {
  live: ['● Дарс меравад', 'st-live'], today: ['Имрӯз', 'st-today'], done: ['Иҷро шуд', 'st-done'],
  progress: ['Дар ҷараён', 'st-progress'], planned: ['Кушода', 'st-open'], locked: ['Пӯшида', 'st-locked'], closed: ['Пӯшида', 'st-locked'],
};
const Icon = ({ name }) => html`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
  clock: html`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  lock: html`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  star: html`<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>`,
  check: html`<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
  live: html`<circle cx="12" cy="12" r="4"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>`,
  chevron: html`<path d="M9 6l6 6-6 6"/>`,
}[name]}</svg>`;
const dayIcon = d => d.state === 'live' ? 'live' : d.state === 'done' ? 'check' : d.locked || d.state === 'closed' ? 'lock' : d.kind === 'exam' ? 'star' : 'clock';

function SetChip({ k, s, role, kind }) {
  if (!s.total) return null;
  const txt = role === 'student' ? `${s.solved}/${s.total}` : `${s.total} · ${s.complete}/${s.students} ҳал`;
  const full = role === 'student' && s.solved === s.total;
  return html`<span class=${`setchip set-${kind === 'exam' ? 'exam' : k}${full ? ' full' : ''}`}>${kind === 'exam' ? html`<${Icon} name="lock" /> ` : ''}${setName(kind, k)} (${txt})</span>`;
}

export function CourseMap({ gid, embedded }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(gid ? `/api/groups/${gid}/course` : '/api/course'), [gid]);
  const [open, setOpen] = useState(null);
  useEvents(ev => { if (['lesson', 'submission', 'activity', 'exam'].includes(ev.type)) reload(true); }, [gid]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class=${embedded ? '' : 'page'}><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const { group, weeks, role } = data;
  const all = weeks.flatMap(w => w.days);
  const live = all.find(d => d.state === 'live');
  const openCount = all.filter(d => d.opened).length;
  return html`<div class=${embedded ? '' : 'page'}>
    <div class="course-head">
      <div>
        ${!embedded && html`<h1 class="course-title">${group.name}</h1>`}
        <div class="row" style="gap:8px;margin-top:6px">
          <span class="pill pill-acc">C++</span>
          ${live ? html`<span class="pill pill-live"><${Icon} name="live" /> Дарс меравад</span>` : html`<span class="pill">${openCount} аз ${all.length} рӯз кушода</span>`}
        </div>
      </div>
      <div class="timecard"><${Icon} name="clock" /><div><div class="kicker">Вақти дарс</div><b>${group.lesson_time}</b> <span class="muted small">(Душанбе)</span></div></div>
    </div>
    ${role === 'teacher' && html`<p class="muted small" style="margin:-4px 0 18px">Рӯзҳо барои шогирдон пӯшидаанд, то шумо онҳоро кушоед: рӯзро пахш кунед → «Рӯзро кушо». Оғози «Дарси зинда» ҳам рӯзро мекушояд.</p>`}
    ${role === 'student' && !openCount && html`<div class="notice info" style="margin-bottom:18px">Ҳанӯз ягон рӯз кушода нашудааст. Устод рӯзи дарсро мекушояд — он гоҳ масъалаҳо дар ин ҷо пайдо мешаванд.</div>`}
    <div class="col" style="gap:30px">${weeks.map(w => html`<section>
      <div class="weekhead"><span class="weekicon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg></span>
        <div><b>Ҳафтаи ${w.week}</b><div class="muted small">${fDate(w.days[0].scheduled_at)} – ${fDate(w.days.at(-1).scheduled_at)}</div></div>
        <span class="pill pill-acc">${w.days.length} рӯз</span></div>
      <div class="days">${w.days.map(d => html`<button type="button" class=${'daycard' + (d.state === 'live' || d.state === 'today' ? ' hot' : '') + (d.locked ? ' locked' : '')} onClick=${() => setOpen(d)}
          aria-label=${`Ҳафтаи ${w.week}, ${d.kind === 'exam' ? 'имтиҳон' : 'рӯзи ' + d.day}`}>
        <div class="daytop">
          <span class=${'dayicon' + (d.kind === 'exam' ? ' exam' : '') + (d.state === 'done' ? ' done' : '')}><${Icon} name=${dayIcon(d)} /></span>
          <div class="daymeta"><div class="dayname">${d.kind === 'exam' ? `Ҳ${w.week} · Имтиҳон` : `Ҳ${w.week} · Рӯзи ${d.day}`}</div>
            <div class="muted small">${d.title}</div>
            <div class="muted small">${fWeekday(d.scheduled_at)}, ${fDate(d.scheduled_at)}</div></div>
          <span class=${'state ' + STATE[d.state][1]}>${STATE[d.state][0]}</span>
        </div>
        <div class="daybottom">
          <div class="chips">${['class', 'home', 'extra'].map(k => html`<${SetChip} k=${k} s=${d.sets[k]} role=${role} kind=${d.kind} />`)}</div>
          <span class="chev"><${Icon} name="chevron" /></span>
        </div>
      </button>`)}</div>
    </section>`)}</div>
    ${open && html`<${DayPanel} d=${all.find(x => x.id === open.id) || open} role=${role} onClose=${() => setOpen(null)} onChanged=${() => reload(true)} />`}
  </div>`;
}

function DayPanel({ d, role, onClose, onChanged }) {
  const [{ data, loading, error }, reload] = useLoad(() => d.locked ? Promise.resolve(null) : api(`/api/lessons/${d.id}/sets`), [d.id, d.locked]);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const toggleOpen = async () => { setBusy(true); try { await api(`/api/lessons/${d.id}/open`, { method: 'POST', body: { opened: !d.opened } }); toast(d.opened ? 'Рӯз пӯшида шуд.' : 'Рӯз кушода шуд — шогирдон масъалаҳоро мебинанд.'); onChanged(); reload(true); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  return html`<div class="drawer" role="dialog" aria-label="Маҷмӯаҳои рӯз">
    <div class="row" style="margin-bottom:6px;align-items:flex-start"><div style="flex:1"><div class="kicker">${d.kind === 'exam' ? `Ҳафтаи ${d.week} · Имтиҳон` : `Ҳафтаи ${d.week} · Рӯзи ${d.day}`} · ${fWeekday(d.scheduled_at)}, ${fDate(d.scheduled_at)}, ${fTime(d.scheduled_at)}</div><h2>${d.title}</h2></div>
      <button class="btn ghost icon-btn" onClick=${onClose} aria-label="Пӯшидан">✕</button></div>
    ${role === 'teacher' && html`<div class=${'opencard' + (d.opened ? ' on' : '')}>
      <div><b>${d.opened ? 'Рӯз барои шогирдон кушода аст' : 'Рӯз барои шогирдон пӯшида аст'}</b><div class="small muted">${d.opened ? 'Шогирдон масъалаҳоро мебинанд ва ҳал мекунанд.' : 'То кушодан шогирдон ба ин рӯз даромада наметавонанд.'}</div></div>
      <button class=${'btn ' + (d.opened ? '' : 'p')} disabled=${busy} onClick=${toggleOpen}>${d.opened ? 'Рӯзро пӯш' : 'Рӯзро кушо'}</button></div>`}
    ${d.locked ? html`<div class="notice" style="margin-top:12px">🔒 Ин рӯз ҳанӯз пӯшида аст. Устод онро мекушояд.</div>`
      : loading ? html`<${Loading} />` : error ? html`<${ErrorBox} error=${error} retry=${reload} />` : html`<div class="col" style="margin-top:14px">
      ${role === 'teacher' && html`<div class="row"><a class="btn" href=${'#/live/' + d.id}>Дарси зинда</a><a class="btn" href=${'#/report/' + d.id}>Ҳисобот</a><button class="btn" onClick=${() => setEdit(true)}>Маҷмӯаҳоро таҳрир кун</button></div>`}
      ${data.exam && html`<div class="notice warn"><b>Имтиҳон.</b> Нусхабардорӣ (copy/paste) ва рафтан ба равзанаи дигар манъ аст. Пас аз 3 вайронкунӣ шумо блок мешавед. Ҳозир: ${data.exam.count}/3.</div>`}
      ${['class', 'home', 'extra'].map(k => { const ps = data.sets[k]; if (!ps.length) return null; const sv = ps.filter(p => p.solved).length;
        return html`<a class="card setcard" href=${`#/set/${d.id}/${k}`}>
          <div class="row"><span class=${'seticon set-' + (d.kind === 'exam' ? 'exam' : k)}>${k === 'class' ? '✓' : k === 'home' ? '⌂' : '+'}</span>
            <div style="flex:1;min-width:0"><b>${setName(d.kind, k, true)}</b><div class="muted small">${ps.length} масъала</div></div>
            <span class="chev"><${Icon} name="chevron" /></span></div>
          ${role === 'student' && html`<div class="row" style="margin-top:10px"><span class="small">Ҳал шуд <b>${sv} / ${ps.length}</b></span><div class="bar" style="flex:1"><i style=${`width:${(100 * sv) / ps.length}%`}></i></div></div>`}
        </a>`; })}
      ${role === 'teacher' && d.kind === 'exam' && html`<${ExamMonitor} lid=${d.id} />`}
    </div>`}
    ${edit && html`<${SetEditor} d=${d} sets=${data.sets} onClose=${() => setEdit(false)} onSaved=${() => { setEdit(false); reload(true); onChanged(); }} />`}
  </div>`;
}

// Устод: вайронкуниҳои имтиҳон ва бардоштани блок
function ExamMonitor({ lid }) {
  const [{ data }, reload] = useLoad(() => api(`/api/lessons/${lid}/exam`), [lid]);
  useEvents(ev => { if (ev.type === 'exam' && Number(ev.lesson_id) === Number(lid)) reload(true); }, [lid]);
  if (!data) return null;
  const TYPE = { copy: 'нусхабардорӣ', paste: 'гузоштан (paste)', cut: 'буридан', leave: 'рафтан ба равзанаи дигар' };
  const unblock = async uid => { try { await api(`/api/lessons/${lid}/unblock`, { method: 'POST', body: { user_id: uid } }); toast('Блок бардошта шуд.'); reload(true); } catch (e) { toast(e.message); } };
  const shown = data.filter(r => r.count > 0 || r.blocked);
  return html`<div class="card"><h3>Назорати имтиҳон</h3>
    ${!shown.length ? html`<div class="muted small">Ҳанӯз вайронкунӣ нест.</div>` : shown.map(r => html`<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)">
      <b style="flex:1">${r.user.name}</b><span class=${'v ' + (r.blocked ? 'v-bad' : 'v-warn')}>${r.blocked ? '⛔ Блок' : `⚠ ${r.count}/3`}</span>
      <span class="small muted">${TYPE[r.last_type] || ''}</span>
      ${r.blocked && html`<button class="btn sm p" onClick=${() => unblock(r.user.id)}>Блокро бардор</button>`}</div>`)}
  </div>`;
}

function SetEditor({ d, sets, onClose, onSaved }) {
  const [{ data }] = useLoad(() => api('/api/problems'));
  const [sel, setSel] = useState({ class: sets.class.map(p => p.id), home: sets.home.map(p => p.id), extra: sets.extra.map(p => p.id) });
  const [busy, setBusy] = useState(false);
  const toggle = (k, id) => setSel(s => ({ ...s, [k]: s[k].includes(id) ? s[k].filter(x => x !== id) : [...s[k], id] }));
  const save = async () => { setBusy(true); try { await api(`/api/lessons/${d.id}/sets`, { method: 'PUT', body: sel }); toast('Маҷмӯаҳо захира шуданд.'); onSaved(); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  return html`<${Modal} title=${`Маҷмӯаҳо: ${d.title}`} onClose=${onClose} wide>
    ${!data ? html`<${Loading} />` : html`<div class="grid3">${['class', 'home', 'extra'].map(k => html`<div class="card" style="max-height:60vh;overflow:auto">
      <h3>${setName(d.kind, k, true)} (${sel[k].length})</h3>
      ${TOPIC_KEYS.map(t => { const ps = data.filter(p => p.topic === t && p.version > 0); return ps.length ? html`<div class="kicker" style="margin-top:8px">${TOPIC[t]}</div>${ps.map(p => html`<label style="display:block;padding:2px 0;font-size:14px"><input type="checkbox" checked=${sel[k].includes(p.id)} onChange=${() => toggle(k, p.id)} /> ${p.title}</label>`)}` : null; })}
    </div>`)}</div>
    <div class="row" style="margin-top:12px"><button class="btn p" disabled=${busy} onClick=${save}>Захира кун</button><button class="btn ghost" onClick=${onClose}>Бекор кун</button></div>`}
  <//>`;
}

// Ҳифзи имтиҳон: нусхабардорӣ ва рафтан ба равзанаи дигар — вайронкунӣ (3 → блок)
function useExamGuard(lid, enabled, onState) {
  const last = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const report = async type => {
      const now = Date.now(); if (now - last.current < 2500) return; last.current = now;
      try { const r = await api(`/api/lessons/${lid}/violation`, { method: 'POST', body: { type } }); onState(r); }
      catch {}
    };
    const block = type => e => { e.preventDefault(); e.stopPropagation(); report(type); };
    const onCopy = block('copy'), onCut = block('cut'), onPaste = block('paste');
    const onCtx = e => e.preventDefault();
    const onVis = () => { if (document.visibilityState === 'hidden') report('leave'); };
    const onBlur = () => report('leave');
    document.addEventListener('copy', onCopy, true); document.addEventListener('cut', onCut, true); document.addEventListener('paste', onPaste, true);
    document.addEventListener('contextmenu', onCtx, true); document.addEventListener('visibilitychange', onVis); window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('copy', onCopy, true); document.removeEventListener('cut', onCut, true); document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('contextmenu', onCtx, true); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('blur', onBlur);
    };
  }, [lid, enabled]);
}

/** Саҳифаи маҷмӯа: рӯйхати масъалаҳо дар чап, шарт ва муҳаррир дар рост */
export function SetPage({ user, lid, kind, idx }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/lessons/${lid}/sets`), [lid]);
  const [exam, setExam] = useState(null);
  useEvents(ev => { if ((ev.type === 'submission' && ev.state === 'done') || (ev.type === 'lesson' && Number(ev.lesson_id) === Number(lid))) reload(true); }, [lid]);
  const isExam = data?.lesson?.kind === 'exam' && user.role === 'student';
  useExamGuard(lid, isExam && !exam?.blocked, r => { setExam(r); if (r.blocked) reload(true); else toast(`⚠ Вайронкунӣ ${r.count} аз 3: нусхабардорӣ ва рафтан ба равзанаи дигар манъ аст.`); });
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page">${error.data?.blocked ? html`<div class="blocked"><div class="blocked-ico">⛔</div><h1>Шумо аз имтиҳон блок шудед</h1><p>3 вайронкунӣ (нусхабардорӣ ё рафтан ба равзанаи дигар). Танҳо устод метавонад шуморо боз кунад.</p><a class="btn" href="#/course">← Ба нақшаи курс</a></div>` : html`<${ErrorBox} error=${error} retry=${reload} />`}</div>`;
  if (error?.data?.blocked) return html`<div class="page"><div class="blocked"><div class="blocked-ico">⛔</div><h1>Шумо аз имтиҳон блок шудед</h1><p>Танҳо устод метавонад шуморо боз кунад.</p><a class="btn" href="#/course">← Ба нақшаи курс</a></div></div>`;
  const ps = data.sets[kind] || [];
  if (!ps.length) return html`<div class="page"><${Empty} title="Дар ин маҷмӯа масъала нест"><a href="#/course">Ба нақшаи курс</a><//></div>`;
  const i = Math.min(Math.max(0, Number(idx) || 0), ps.length - 1);
  const sv = ps.filter(p => p.solved).length;
  const L = data.lesson;
  const count = exam?.count ?? data.exam?.count ?? 0;
  if (user.role === 'teacher') return html`<div class="page"><a href=${'#/g/' + L.group_id}>← Гурӯҳ</a><h1 style="margin:8px 0">${setName(L.kind, kind, true)}: ${L.title}</h1>${ps.map((p, j) => html`<div class="row" style="padding:6px 0"><span class="chip">${j + 1}</span><a href=${'#/problem/' + p.id + '/edit'}>${p.title}</a></div>`)}</div>`;
  return html`<div class=${'setlay' + (isExam ? ' examlay' : '')}>
    <aside class="setside" aria-label="Масъалаҳои маҷмӯа">
      <a class="small" href="#/course">← Нақшаи курс</a>
      <div class="kicker" style="margin-top:8px">${setName(L.kind, kind, true)}</div>
      <div class="small muted setlesson">${L.title}</div>
      ${isExam && html`<div class=${'examguard' + (count ? ' warn' : '')}>🛡 Имтиҳон · вайронкунӣ <b>${count}/3</b><div class="small">Copy/paste ва рафтан ба равзанаи дигар манъ аст.</div></div>`}
      <div class="progcard"><div class="row"><b>Пешрафт</b><div class="spacer"></div><b>${sv}/${ps.length}</b></div><div class="bar" style="margin-top:8px"><i style=${`width:${(100 * sv) / ps.length}%`}></i></div>${sv === ps.length ? html`<div class="small" style="color:var(--ok);margin-top:6px">🎉 Ҳамаи масъалаҳо ҳал шуданд!</div>` : ''}</div>
      <div class="small muted" style="margin-top:4px">Гузашт: ${sv} / ${ps.length}</div>
      <nav class="setlist">${ps.map((p, j) => html`<a href=${`#/set/${lid}/${kind}/${j}`} class=${'setitem' + (j === i ? ' on' : '') + (p.solved ? ' solved' : '')} aria-current=${j === i ? 'page' : undefined}>
        <span class="n">${j + 1}</span><span class="t">${p.title}</span>${p.solved ? html`<span class="ok">✓</span>` : ''}</a>`)}</nav>
    </aside>
    <${Workspace} key=${ps[i].id} user=${user} pid=${ps[i].id} lessonId=${Number(lid)} exam=${isExam} />
  </div>`;
}
