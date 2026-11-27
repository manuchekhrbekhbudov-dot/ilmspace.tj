// «Нақшаи курс»: ҳафта → рӯз → маҷмӯаҳо (синфӣ, хонагӣ, иловагӣ), ва саҳифаи маҷмӯа
import { html, useState, useEffect, api, useLoad, useEvents, Loading, ErrorBox, Empty, Modal, fTime, fDate, fWeekday, TOPIC, TOPIC_KEYS, toast } from './lib.js';
import { Workspace } from './workspace.js';

export const SET = { class: 'Синфӣ', home: 'Хонагӣ', extra: 'Иловагӣ' };
const SET_LONG = { class: 'Вазифаи синфӣ', home: 'Вазифаи хонагӣ', extra: 'Вазифаи иловагӣ' };
const STATE = {
  live: ['● Дарс меравад', 'v-info'], today: ['Имрӯз', 'v-info'], done: ['Иҷро шуд', 'v-ok'],
  progress: ['Дар ҷараён', 'v-warn'], planned: ['Ба нақша', 'v-none'], locked: ['🔒 Қулф', 'v-none'],
};

function SetChip({ k, s, role, exam }) {
  if (!s.total) return null;
  const label = exam ? 'Имтиҳон' : SET[k];
  const txt = role === 'student' ? `${s.solved}/${s.total}` : `${s.total} масъала · ${s.complete}/${s.students} ҳал`;
  const full = role === 'student' && s.solved === s.total;
  return html`<span class=${'chip' + (full ? ' acc' : '')}>${label} ${txt}</span>`;
}

export function CourseMap({ gid, embedded }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(gid ? `/api/groups/${gid}/course` : '/api/course'), [gid]);
  const [open, setOpen] = useState(null);
  useEvents(ev => { if (['lesson', 'submission', 'activity'].includes(ev.type)) reload(true); }, [gid]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class=${embedded ? '' : 'page'}><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const { group, weeks, role } = data;
  const all = weeks.flatMap(w => w.days);
  const focus = all.find(d => d.state === 'live') || all.find(d => d.state === 'today') || all.find(d => d.state === 'progress') || all.find(d => !d.locked && d.state !== 'done');
  return html`<div class=${embedded ? '' : 'page'}>
    ${role === 'teacher' && html`<label class="row small" style="margin-bottom:10px;gap:8px"><input type="checkbox" checked=${group.lock_days} onChange=${async e => { await api('/api/groups/' + group.id, { method: 'PATCH', body: { lock_days: e.target.checked } }); reload(true); }} /> Рӯзҳои ояндаро барои шогирдон то санаи дарс пӯшида нигоҳ дор <span class="muted">(пешфарз: ҳамаи масъалаҳо кушодаанд)</span></label>`}
    ${!embedded && html`<div class="row" style="margin-bottom:6px"><h1>${group.name}</h1><span class="chip">${role === 'student' ? 'Нақшаи курс' : 'Нақшаи курс · устод'}</span></div>`}
    <p class="muted" style="margin-bottom:18px">${weeks.length} ҳафта · ҳар ҳафта 5 рӯзи дарс ва 1 имтиҳон · дарсҳо соати ${group.lesson_time} (вақти Душанбе)${focus ? html` · <a href="#" onClick=${e => { e.preventDefault(); setOpen(focus); }}>ба рӯзи ҷорӣ гузар →</a>` : ''}</p>
    <div class="col" style="gap:26px">${weeks.map(w => html`<section>
      <div class="row" style="margin-bottom:10px"><h2>Ҳафтаи ${w.week}</h2><span class="muted small">${fDate(w.days[0].scheduled_at)} – ${fDate(w.days.at(-1).scheduled_at)}</span></div>
      <div class="days">${w.days.map(d => html`<button type="button" class=${'day card' + (d.state === 'live' || d.state === 'today' ? ' hl' : '') + (d.locked ? ' locked' : '')} onClick=${() => setOpen(d)} aria-label=${`Ҳафтаи ${w.week}, ${d.kind === 'exam' ? 'имтиҳон' : 'рӯзи ' + d.day}`}>
        <div class="row" style="gap:8px;align-items:flex-start">
          <span class=${'daynum' + (d.kind === 'exam' ? ' exam' : '')}>${d.kind === 'exam' ? '★' : d.day}</span>
          <div style="flex:1;min-width:0;text-align:left">
            <b>${d.kind === 'exam' ? `Ҳафтаи ${w.week} · Имтиҳон` : `Ҳафтаи ${w.week} · Рӯзи ${d.day}`}</b>
            <div class="muted small">${fWeekday(d.scheduled_at)}, ${fDate(d.scheduled_at)}</div>
          </div>
          <span class=${'v ' + STATE[d.state][1]}>${STATE[d.state][0]}</span>
        </div>
        <div class="small daytitle">${d.title}</div>
        <div class="row" style="gap:6px">${['class', 'home', 'extra'].map(k => html`<${SetChip} k=${k} s=${d.sets[k]} role=${role} exam=${d.kind === 'exam' && k === 'class'} />`)}</div>
      </button>`)}</div>
    </section>`)}</div>
    ${open && html`<${DayPanel} d=${open} role=${role} onClose=${() => setOpen(null)} onChanged=${() => reload(true)} />`}
  </div>`;
}

function DayPanel({ d, role, onClose, onChanged }) {
  const [{ data, loading, error }, reload] = useLoad(() => d.locked ? Promise.resolve(null) : api(`/api/lessons/${d.id}/sets`), [d.id]);
  const [edit, setEdit] = useState(false);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return html`<div class="drawer" role="dialog" aria-label="Маҷмӯаҳои рӯз">
    <div class="row" style="margin-bottom:6px"><div><div class="kicker">${d.kind === 'exam' ? `Ҳафтаи ${d.week} · Имтиҳон` : `Ҳафтаи ${d.week} · Рӯзи ${d.day}`} · ${fWeekday(d.scheduled_at)}, ${fDate(d.scheduled_at)}, ${fTime(d.scheduled_at)}</div><h2>${d.title}</h2></div>
      <div class="spacer"></div><button class="btn ghost icon-btn" onClick=${onClose} aria-label="Пӯшидан">✕</button></div>
    ${d.locked ? html`<div class="notice" style="margin-top:12px">🔒 Ин рӯз ${fWeekday(d.scheduled_at)}, ${fDate(d.scheduled_at)} соати ${fTime(d.scheduled_at)} кушода мешавад.</div>`
      : loading ? html`<${Loading} />` : error ? html`<${ErrorBox} error=${error} retry=${reload} />` : html`<div class="col" style="margin-top:12px">
      ${role === 'teacher' && html`<div class="row"><a class="btn p" href=${'#/live/' + d.id}>Дарси зинда</a><a class="btn" href=${'#/report/' + d.id}>Ҳисобот</a><button class="btn" onClick=${() => setEdit(true)}>Маҷмӯаҳоро таҳрир кун</button></div>`}
      ${role === 'student' && (d.state === 'live' || d.state === 'today') && html`<a class="btn" href=${'#/lesson/' + d.id}>Қадамҳои дарси имрӯз (пешгӯӣ, санҷиш)</a>`}
      ${['class', 'home', 'extra'].map(k => { const ps = data.sets[k]; if (!ps.length) return null; const sv = ps.filter(p => p.solved).length;
        return html`<a class="card setcard" href=${role === 'student' ? `#/set/${d.id}/${k}` : `#/set/${d.id}/${k}`}>
          <div class="row"><span class=${'seticon ' + k}>${k === 'class' ? '✓' : k === 'home' ? '⌂' : '+'}</span>
            <div style="flex:1"><b>${d.kind === 'exam' && k === 'class' ? 'Имтиҳон' : SET_LONG[k]}</b><div class="muted small">${ps.map(p => p.title).join(' · ')}</div></div>
            <span class="chip">${ps.length} масъала</span></div>
          ${role === 'student' && html`<div class="row" style="margin-top:10px"><span class="small">Ҳал шуд <b>${sv} / ${ps.length}</b></span><div class="bar" style="flex:1"><i style=${`width:${(100 * sv) / ps.length}%`}></i></div></div>`}
        </a>`; })}
      ${!['class', 'home', 'extra'].some(k => data.sets[k].length) && html`<${Empty} title="Дар ин рӯз ҳанӯз масъала нест">${role === 'teacher' ? 'Бо «Маҷмӯаҳоро таҳрир кун» масъала илова кунед.' : 'Устод ба зудӣ масъала илова мекунад.'}<//>`}
    </div>`}
    ${edit && html`<${SetEditor} d=${d} sets=${data.sets} onClose=${() => setEdit(false)} onSaved=${() => { setEdit(false); reload(true); onChanged(); }} />`}
  </div>`;
}

function SetEditor({ d, sets, onClose, onSaved }) {
  const [{ data }] = useLoad(() => api('/api/problems'));
  const [sel, setSel] = useState({ class: sets.class.map(p => p.id), home: sets.home.map(p => p.id), extra: sets.extra.map(p => p.id) });
  const [busy, setBusy] = useState(false);
  const toggle = (k, id) => setSel(s => ({ ...s, [k]: s[k].includes(id) ? s[k].filter(x => x !== id) : [...s[k], id] }));
  const save = async () => { setBusy(true); try { await api(`/api/lessons/${d.id}/sets`, { method: 'PUT', body: sel }); toast('Маҷмӯаҳо захира шуданд.'); onSaved(); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  return html`<${Modal} title=${`Маҷмӯаҳо: ${d.title}`} onClose=${onClose} wide>
    ${!data ? html`<${Loading} />` : html`<div class="grid3">${['class', 'home', 'extra'].map(k => html`<div class="card">
      <h3>${SET_LONG[k]} (${sel[k].length})</h3>
      ${TOPIC_KEYS.map(t => html`<div class="kicker" style="margin-top:8px">${TOPIC[t]}</div>${data.filter(p => p.topic === t && p.version > 0).map(p => html`<label style="display:block;padding:2px 0;font-size:14px"><input type="checkbox" checked=${sel[k].includes(p.id)} onChange=${() => toggle(k, p.id)} /> ${p.title}</label>`)}`)}
    </div>`)}</div>
    <div class="row" style="margin-top:12px"><button class="btn p" disabled=${busy} onClick=${save}>Захира кун</button><button class="btn ghost" onClick=${onClose}>Бекор кун</button><span class="small muted">Масъалаҳои синфӣ дар ҷадвали «Дарси зинда» ҳамчун сутун пайдо мешаванд.</span></div>`}
  <//>`;
}

/** Саҳифаи маҷмӯа: рӯйхати масъалаҳо дар чап, шарт ва муҳаррир дар рост */
export function SetPage({ user, lid, kind, idx }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/lessons/${lid}/sets`), [lid]);
  useEvents(ev => { if (ev.type === 'submission' && ev.state === 'done') reload(true); }, [lid]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const ps = data.sets[kind] || [];
  if (!ps.length) return html`<div class="page"><${Empty} title="Дар ин маҷмӯа масъала нест"><a href="#/course">Ба нақшаи курс</a><//></div>`;
  const i = Math.min(Math.max(0, Number(idx) || 0), ps.length - 1);
  const sv = ps.filter(p => p.solved).length;
  const L = data.lesson;
  if (user.role === 'teacher') return html`<div class="page"><a href=${'#/g/' + L.group_id}>← Гурӯҳ</a><h1 style="margin:8px 0">${SET_LONG[kind]}: ${L.title}</h1>${ps.map(p => html`<div class="row" style="padding:6px 0"><a href=${'#/problem/' + p.id + '/edit'}>${p.title}</a></div>`)}</div>`;
  return html`<div class="setlay">
    <aside class="setside" aria-label="Масъалаҳои маҷмӯа">
      <a class="small" href="#/course">← Нақшаи курс</a>
      <div class="kicker" style="margin-top:8px">${L.kind === 'exam' && kind === 'class' ? 'Имтиҳон' : SET_LONG[kind]}</div>
      <div class="small muted setlesson">${L.title}</div>
      <div class="card" style="padding:10px 12px"><div class="row"><b>Пешрафт</b><div class="spacer"></div><b>${sv}/${ps.length}</b></div><div class="bar" style="margin-top:6px"><i style=${`width:${(100 * sv) / ps.length}%`}></i></div>${sv === ps.length ? html`<div class="small" style="color:var(--ok);margin-top:6px">Ҳамаи масъалаҳо ҳал шуданд!</div>` : ''}</div>
      <nav class="setlist">${ps.map((p, j) => html`<a href=${`#/set/${lid}/${kind}/${j}`} class=${'setitem' + (j === i ? ' on' : '')} aria-current=${j === i ? 'page' : undefined}>
        <span class="n">${j + 1}</span><span class="t">${p.title}</span>${p.solved ? html`<span class="ok">✓</span>` : ''}</a>`)}</nav>
    </aside>
    <${Workspace} key=${ps[i].id} user=${user} pid=${ps[i].id} lessonId=${Number(lid)} />
  </div>`;
}
