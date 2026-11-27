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
// Намудҳои вайронкунӣ: [барои устод, барои шогирд]
export const VIOL = {
  copy: ['нусха кард (copy)', 'Нусха кардан (copy) дар имтиҳон манъ аст.'],
  cut: ['бурид (cut)', 'Буридани матн (cut) дар имтиҳон манъ аст.'],
  paste: ['гузошт (paste)', 'Гузоштани матн (paste) дар имтиҳон манъ аст.'],
  drop: ['матн кашида овард', 'Кашида овардани матн дар имтиҳон манъ аст.'],
  leave: ['ба равзанаи дигар рафт', 'Рафтан ба равзана, ҷадвалча ё барномаи дигар манъ аст.'],
  back: ['аз имтиҳон баромад', 'Баромадан аз саҳифаи имтиҳон (тугмаи «Ақиб») манъ аст.'],
  fullscreen: ['аз экрани пурра баромад', 'Баромадан аз экрани пурра (Esc) манъ аст.'],
  key: ['тугмаи Windows', 'Пахш кардани тугмаи Windows манъ аст.'],
  print: ['скриншот', 'Скриншот (PrintScreen) манъ аст.'],
};

function ExamMonitor({ lid }) {
  const [{ data }, reload] = useLoad(() => api(`/api/lessons/${lid}/exam`), [lid]);
  useEvents(ev => { if (ev.type === 'exam' && Number(ev.lesson_id) === Number(lid)) reload(true); }, [lid]);
  if (!data) return null;
  const unblock = async (uid, what) => { try { await api(`/api/lessons/${lid}/unblock`, { method: 'POST', body: { user_id: uid } }); toast(what); reload(true); } catch (e) { toast(e.message); } };
  const inExam = data.filter(r => r.accepted_at).length, blocked = data.filter(r => r.blocked).length;
  const st = r => r.blocked ? ['⛔ Блок', 'v-bad'] : r.finished_at ? ['✓ Тамом кард', 'v-ok'] : r.count ? [`⚠ ${r.count}/3`, 'v-warn'] : r.accepted_at ? ['● Дар имтиҳон', 'v-info'] : ['Ворид нашудааст', 'v-none'];
  return html`<div class="card exammon"><h3>Назорати имтиҳон</h3>
    <div class="small muted" style="margin-bottom:6px">Ворид шуданд: <b>${inExam}</b> аз ${data.length} · Блок: <b>${blocked}</b></div>
    ${!data.length ? html`<div class="muted small">Дар гурӯҳ шогирд нест.</div>` : data.map(r => { const [t, c] = st(r); return html`<div class="emrow">
      <b class="emname">${r.user.name}</b><span class=${'v ' + c}>${t}</span>
      <span class="small muted">${r.last_type ? VIOL[r.last_type]?.[0] || r.last_type : ''}</span>
      ${r.blocked ? html`<button class="btn sm p" onClick=${() => unblock(r.user.id, 'Блок бардошта шуд — шогирд боз ворид мешавад.')}>Блокро бардор</button>`
        : r.finished_at ? html`<button class="btn sm" onClick=${() => unblock(r.user.id, 'Имтиҳон барои шогирд боз кушода шуд.')}>Боз кушо</button>` : ''}
    </div>`; })}
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
const canFull = () => !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
const goFull = () => { if (canFull() && !document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); };
const leaveFull = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };

// Посбони имтиҳон: нусха/гузоштан манъ ва ҳисоб мешавад; рафтан ба равзанаи дигар, «Ақиб», баромадан аз экрани пурра,
// тугмаи Windows ва PrintScreen — ҳар кадом 1 вайронкунӣ. 3 → блоки худкор (дар сервер).
function useExamGuard(lid, active, onResult) {
  const last = useRef(0);
  const cb = useRef(onResult); cb.current = onResult;
  useEffect(() => {
    if (!active) return;
    let unloading = false, alive = true;
    const report = type => {
      if (window.__codelabReloading || unloading || !alive) return;
      const now = Date.now(); if (now - last.current < 1200) return; last.current = now;
      api(`/api/lessons/${lid}/violation`, { method: 'POST', body: { type } }).then(r => cb.current({ ...r, type })).catch(() => {});
    };
    const stop = type => e => { e.preventDefault(); e.stopPropagation(); report(type); };
    const L = [
      [document, 'copy', stop('copy'), true], [document, 'cut', stop('cut'), true], [document, 'paste', stop('paste'), true],
      [document, 'drop', stop('drop'), true], [document, 'contextmenu', e => e.preventDefault(), true],
      [document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') report('leave'); }],
      [window, 'blur', () => report('leave')],
      [document, 'fullscreenchange', () => { if (canFull() && !document.fullscreenElement) report('fullscreen'); }],
      [window, 'keydown', e => { if (e.key === 'Meta' || e.key === 'OS') report('key'); }, true],
      [window, 'keyup', e => { if (e.key === 'PrintScreen') report('print'); }, true],
      [window, 'pagehide', () => {
        if (window.__codelabReloading || !alive) return;
        unloading = true;
        try { navigator.sendBeacon(`/api/lessons/${lid}/violation`, new Blob([JSON.stringify({ type: 'leave' })], { type: 'application/json' })); } catch {}
      }],
    ];
    L.forEach(([t, ev, f, c]) => t.addEventListener(ev, f, !!c));
    document.body.classList.add('exam-on');
    return () => {
      L.forEach(([t, ev, f, c]) => t.removeEventListener(ev, f, !!c));
      document.body.classList.remove('exam-on');
      // Аз саҳифаҳои ин имтиҳон баромад (тугмаи «Ақиб» ё пайванд) — вайронкунӣ
      if (!window.__codelabReloading && !location.hash.startsWith(`#/set/${lid}/`)) report('back');
      alive = false;
    };
  }, [lid, active]);
}

function ExamGate({ L, onAccept, busy, err }) {
  const [ok, setOk] = useState(false);
  return html`<div class="page"><div class="examgate">
    <div class="eg-ico">🛡️</div>
    <div class="kicker">Имтиҳон</div>
    <h1>${L.title}</h1>
    <p class="eg-lead">Пеш аз оғоз шартҳоро бодиққат хонед:</p>
    <ol class="rules">
      <li>Имтиҳон дар <b>экрани пурра</b> мегузарад.</li>
      <li><b>Нусха кардан (copy)</b>, <b>гузоштан (paste)</b> ва кашида овардани матн <b>манъ</b> аст.</li>
      <li>Рафтан ба <b>равзана, ҷадвалча ё барномаи дигар</b> (Alt+Tab, тугмаи Windows) <b>манъ</b> аст.</li>
      <li>Баромадан аз экрани пурра (<b>Esc</b>), тугмаи <b>«Ақиб»</b> ва аз нав бор кардани саҳифа <b>манъ</b> аст.</li>
      <li>Ҳар амали манъшуда — <b>1 вайронкунӣ</b>. Баъди <b>3 вайронкунӣ</b> шумо худкор <b>блок</b> мешавед.</li>
      <li>Блокро <b>танҳо устод</b> бардошта метавонад.</li>
      <li>Дар имтиҳон ишора нест. Вақте тамом кардед, «Имтиҳонро тамом кардам»-ро пахш кунед.</li>
    </ol>
    <label class="eg-check"><input type="checkbox" checked=${ok} onChange=${e => setOk(e.target.checked)} /> <span>Ман шартҳоро хондам ва <b>қабул дорам</b></span></label>
    ${err && html`<div class="err" role="alert">${err}</div>`}
    <div class="eg-btns"><button class="btn p lg" disabled=${!ok || busy} onClick=${onAccept}>${busy ? html`<span class="spin"></span>` : ''} Ба имтиҳон ворид шав</button><a class="btn lg" href="#/course">Ҳоло не</a></div>
  </div></div>`;
}

function ExamWarn({ w, onClose }) {
  const left = 3 - w.count;
  return html`<div class="examwarn-bg" role="alertdialog" aria-modal="true" aria-labelledby="ew-h"><div class="examwarn">
    <div class="ew-ico">⚠️</div>
    <h2 id="ew-h">Вайронкунӣ ${w.count} аз 3</h2>
    <p class="ew-why">${VIOL[w.type]?.[1] || 'Ин амал дар имтиҳон манъ аст.'}</p>
    <div class="ew-dots" aria-hidden="true">${[1, 2, 3].map(i => html`<span class=${i <= w.count ? 'on' : ''}></span>`)}</div>
    <p class="ew-left">${left === 1 ? 'Боз 1 вайронкунӣ — ва шумо блок мешавед!' : `Боз ${left} вайронкунӣ — ва шумо блок мешавед.`}</p>
    <button class="btn p lg" onClick=${onClose} autofocus>Фаҳмидам, идома медиҳам</button>
  </div></div>`;
}

const Blocked = () => html`<div class="page"><div class="blocked" role="alert"><div class="blocked-ico">⛔</div><h1>Шумо аз имтиҳон блок шудед</h1>
  <p>3 вайронкунӣ шуд. Танҳо устод метавонад блокро бардорад — ба устод муроҷиат кунед.</p><a class="btn lg" href="#/course">← Ба нақшаи курс</a></div></div>`;

/** Саҳифаи маҷмӯа: рӯйхати масъалаҳо дар чап, масъала ва муҳаррир дар рост */
export function SetPage({ user, lid, kind, idx }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/lessons/${lid}/sets`), [lid]);
  const [warn, setWarn] = useState(null);
  const [isFull, setIsFull] = useState(!!document.fullscreenElement);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const [ask, setAsk] = useState(false);
  useEvents(ev => { if ((ev.type === 'submission' && ev.state === 'done') || (ev.type === 'lesson' && Number(ev.lesson_id) === Number(lid))) reload(true); }, [lid]);
  useEffect(() => { const f = () => setIsFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  const isExam = data?.lesson?.kind === 'exam' && user.role === 'student';
  const ex = data?.exam;
  const blocked = !!error?.data?.blocked;
  const active = isExam && !!ex?.accepted && !ex?.finished && !blocked;
  useExamGuard(lid, active, r => {
    if (r.ignored) return;
    if (r.blocked) { setWarn(null); leaveFull(); reload(true); return; }
    setWarn(r); reload(true);
  });
  useEffect(() => { if (blocked || ex?.finished) leaveFull(); }, [blocked, ex?.finished]);

  if (loading) return html`<${Loading} />`;
  if (blocked) return html`<${Blocked} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const L = data.lesson;
  if (user.role === 'teacher') {
    const ps = data.sets[kind] || [];
    return html`<div class="page"><a href=${'#/g/' + L.group_id}>← Гурӯҳ</a><h1 style="margin:8px 0">${setName(L.kind, kind, true)}: ${L.title}</h1>${ps.map((p, j) => html`<div class="row" style="padding:6px 0"><span class="chip">${j + 1}</span><a href=${'#/problem/' + p.id + '/edit'}>${p.title}</a></div>`)}</div>`;
  }
  const all = ['class', 'home', 'extra'].flatMap(k => data.sets[k] || []);
  if (isExam && !ex.accepted) {
    const accept = async () => { setBusy(true); setErr(null); goFull(); try { await api(`/api/lessons/${lid}/exam/accept`, { method: 'POST' }); reload(true); } catch (e) { setErr(e.message); leaveFull(); } finally { setBusy(false); } };
    return html`<${ExamGate} L=${L} onAccept=${accept} busy=${busy} err=${err} />`;
  }
  if (isExam && ex.finished) {
    const sv = all.filter(p => p.solved).length;
    return html`<div class="page"><div class="examdone"><div class="eg-ico">🏁</div><h1>Шумо имтиҳонро тамом кардед</h1>
      <p class="eg-lead">Ҳал шуд: <b>${sv}</b> аз ${all.length} масъала.</p>
      <div class="examdone-list">${all.map(p => html`<div class=${'setitem' + (p.solved ? ' solved' : '')}><span class="n">${p.solved ? '✓' : '–'}</span><span class="t">${p.title}</span></div>`)}</div>
      <a class="btn p lg" href="#/course">← Ба нақшаи курс</a></div></div>`;
  }
  const ps = data.sets[kind] || [];
  if (!ps.length) return html`<div class="page"><${Empty} title="Дар ин маҷмӯа масъала нест"><a href="#/course">Ба нақшаи курс</a><//></div>`;
  const i = Math.min(Math.max(0, Number(idx) || 0), ps.length - 1);
  const sv = ps.filter(p => p.solved).length;
  const count = ex?.count ?? 0;
  const href = (k, j) => `#/set/${lid}/${k}/${j}`;
  const finish = async () => { setBusy(true); try { await api(`/api/lessons/${lid}/exam/finish`, { method: 'POST' }); setAsk(false); leaveFull(); reload(true); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  return html`<div class=${'setlay' + (isExam ? ' examlay' : '')}>
    <aside class="setside" aria-label="Масъалаҳои маҷмӯа">
      ${!isExam && html`<a class="small backlink" href="#/course">← Нақшаи курс</a>`}
      <div class="kicker acc">${isExam ? 'Имтиҳон' : setName(L.kind, kind, true)}</div>
      <div class="small muted setlesson">${L.title}</div>
      <div class="settabs" role="tablist">${['class', 'home', 'extra'].filter(k => (data.sets[k] || []).length).map(k => { const s2 = data.sets[k]; return html`<a role="tab" aria-selected=${k === kind} class=${'settab' + (k === kind ? ' on' : '')} href=${href(k, 0)}>${L.kind === 'exam' ? { class: 'A', home: 'B', extra: 'Мураккаб' }[k] : setName(L.kind, k)}<small>${s2.filter(p => p.solved).length}/${s2.length}</small></a>`; })}</div>
      ${isExam && html`<div class=${'examguard' + (count ? ' warn' : '')}>🛡️ Вайронкунӣ: <b>${count} аз 3</b><div class="small">Copy, paste, рафтан ба равзанаи дигар, Esc ва «Ақиб» манъ аст.</div></div>`}
      <div class="progcard">
        <div class="row"><span class="pico" aria-hidden="true">🔥</span><b>Пешрафт</b><div class="spacer"></div><b class="pnum">${sv}/${ps.length}</b></div>
        <div class="bar"><i style=${`width:${(100 * sv) / ps.length}%`}></i></div>
        ${sv === ps.length ? html`<div class="pdone">🎉 Ҳамаи масъалаҳо ҳал шуданд!</div>` : ''}
      </div>
      <div class="listcard">
        <div class="small muted">Гузашт: <b class="pnum2">${sv} / ${ps.length}</b></div>
        <nav class="setlist">${ps.map((p, j) => html`<a href=${href(kind, j)} class=${'setitem' + (j === i ? ' on' : '') + (p.solved ? ' solved' : '')} aria-current=${j === i ? 'page' : undefined}>
          <span class="n">${j + 1}</span><span class="t">${p.title}</span><span class=${'ok' + (p.solved ? '' : ' no')} aria-label=${p.solved ? 'ҳал шуд' : 'ҳал нашуд'}>${p.solved ? '✓' : ''}</span></a>`)}</nav>
      </div>
      ${isExam && html`<button class="btn finishbtn" onClick=${() => setAsk(true)}>🏁 Имтиҳонро тамом кардам</button>`}
    </aside>
    <main class="setmain">
      <${Workspace} key=${ps[i].id} user=${user} pid=${ps[i].id} lessonId=${Number(lid)} exam=${isExam} num=${i + 1}
        nav=${{ prev: i > 0 ? href(kind, i - 1) : null, next: i < ps.length - 1 ? href(kind, i + 1) : null }} exitHref=${isExam ? null : '#/course'} />
    </main>
    ${active && !isFull && canFull() && !warn && html`<div class="examwarn-bg"><div class="examwarn calm"><div class="ew-ico">⛶</div><h2>Имтиҳон дар экрани пурра мегузарад</h2>
      <p class="ew-why">Барои идома додан тугмаро пахш кунед.</p><button class="btn p lg" onClick=${goFull}>Ба экрани пурра баргард</button></div></div>`}
    ${warn && html`<${ExamWarn} w=${warn} onClose=${() => { setWarn(null); goFull(); }} />`}
    ${ask && html`<${Modal} title="Имтиҳонро тамом мекунед?" onClose=${() => setAsk(false)}>
      <p>Ҳал шуд: <b>${all.filter(p => p.solved).length}</b> аз ${all.length} масъала.</p>
      <p>Баъд аз тамом кардан шумо ба ин имтиҳон <b>баргашта наметавонед</b> (танҳо устод метавонад боз кушояд).</p>
      <div class="row"><button class="btn p" disabled=${busy} onClick=${finish}>Ҳа, тамом кардам</button><button class="btn" onClick=${() => setAsk(false)}>Не, идома медиҳам</button></div>
    <//>`}
  </div>`;
}
