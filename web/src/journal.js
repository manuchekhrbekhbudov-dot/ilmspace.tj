// Журнал (CRM): ҳозирӣ ва холи ҳар рӯз (0–5), бонуси ҳафта, фоизи ҳафта ва миёна, диаграмма.
// Устод менависад; шогирд ҳамин ҷадвалро мебинад (бе шарҳҳо ва бе маълумоти падару модар).
import { html, useState, api, useLoad, useEvents, Loading, ErrorBox, Modal, toast, fDateTime } from './lib.js';

// Рангҳои ҷавоҳирӣ (тилло, зумуррад, ёқут, сапфир…)
const COLORS = ['#e0bd6e', '#5fbf9a', '#d9776f', '#6f9fd8', '#b58ad6', '#e39a5c', '#4fb3b8', '#c9a0a8', '#9fc26a', '#8c8fe0', '#d6b48a', '#6cc4e0', '#e07fa3', '#a3a3a3', '#78c98d', '#c78f4f'];
const KIND = { auto: 'Худкор (аз рӯи ҳолати рӯз)', absent: 'Ғоибӣ', late: 'Дермонӣ', behavior: 'Рафтор', other: 'Дигар' };
const KIND_SHORT = { auto: 'Худкор', absent: 'Ғоибӣ', late: 'Дермонӣ', behavior: 'Рафтор', other: 'Дигар' };
const ddmm = d => d.split('-').reverse().join('.');
const short = n => { const p = n.trim().split(/\s+/); return n.length <= 16 || p.length < 2 || /\d/.test(p[1]) ? n : `${p[0]} ${p[1][0]}.`; };

export function Journal({ gid }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(gid ? `/api/groups/${gid}/journal` : '/api/my/journal'), [gid]);
  const [open, setOpen] = useState({});
  const [cm, setCm] = useState(null);      // шарҳ: { student, day }
  const [info, setInfo] = useState(null);  // маълумоти шогирд
  useEvents(ev => { if (ev.type === 'journal' || ev.type === 'exam') reload(true); }, [gid]);
  if (loading) return html`<${Loading} />`;
  if (error && !data) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const T = data.role === 'teacher';
  const act = async (fn, what) => {
    try { await fn(); reload(true); if (what) toast(`✓ ${what} сабт шуд. Иваз кардан мумкин аст — қимати дигарро интихоб кунед.`); }
    catch (e) { toast('Сабт нашуд: ' + e.message); reload(true); }
  };
  const lastGraded = [...data.weeks].reverse().find(w => w.graded) || data.weeks[0];
  const isOpen = w => open[w.week] ?? w.week === lastGraded?.week;
  return html`<div class=${gid ? '' : 'page'}>
    ${!gid && html`<h1 style="margin:0 0 14px">Журнал · ${data.group.name}</h1>`}
    <${Chart} data=${data} />
    <div class="jhelp small muted">Холи ҳар рӯз аз 0 то 5. <b>Фоизи ҳафта</b> = (ҷамъи холҳо + бонус) ÷ (5 × рӯзҳои холгузошта) × 100.
      <b>Миёна</b> = ҷамъи фоизи ҳафтаҳо ÷ шумораи ҳафтаҳо (масалан, 100% ва 40% → 70%). Рӯзи имтиҳон хол худкор аз натиҷаи имтиҳон гузошта мешавад.</div>
    ${[...data.weeks].reverse().map(w => html`<section class="jweek">
      <button class="jweek-h" aria-expanded=${isOpen(w) ? 'true' : 'false'} onClick=${() => setOpen({ ...open, [w.week]: !isOpen(w) })}>
        <span>Ҳафтаи ${w.week}</span><span class="jweek-d">${ddmm(w.days[0].date)} – ${ddmm(w.days[w.days.length - 1].date)}</span>
        ${weekAvg(data, w) != null && html`<span class="jweek-avg">миёнаи гурӯҳ <${Pct} v=${weekAvg(data, w)} /></span>`}
        <span class="caret">${isOpen(w) ? '▴' : '▾'}</span></button>
      ${isOpen(w) && html`<${WeekTable} w=${w} data=${data} T=${T} act=${act} onComment=${(s, d) => setCm({ s, d })} onInfo=${setInfo} gid=${gid} />`}
    </section>`)}
    ${cm && html`<${Comments} s=${cm.s} d=${cm.d} onClose=${() => { setCm(null); reload(true); }} />`}
    ${info && html`<${InfoCard} s=${info} data=${data} onClose=${() => { setInfo(null); reload(true); }} />`}
  </div>`;
}

function WeekTable({ w, data, T, act, onComment, onInfo, gid }) {
  const wi = data.weeks.indexOf(w);
  const allPresent = d => data.students.length > 0 && data.students.every(s => ['present', 'late'].includes(s.weeks[wi].days.find(x => x.id === d.id)?.att));
  return html`<div class="jwrap"><table class="jt">
    <thead>
      <tr><th rowspan="2" class="jname">Донишҷӯён</th>
        ${w.days.map(d => html`<th colspan="2" class=${'jdate' + (d.date === data.today ? ' today' : '')}>${ddmm(d.date)}<div class="small muted">${d.kind === 'exam' ? 'Имтиҳон' : `Рӯзи ${d.day}`}</div></th>`)}
        <th rowspan="2">Бонус</th><th rowspan="2">Ҳафта</th><th rowspan="2">Миёна</th></tr>
      <tr>${w.days.map(d => html`<th class="jsub">${T ? html`<label class="jall" title="Ҳамаро «омад» қайд кун"><input type="checkbox" checked=${allPresent(d)}
          onChange=${e => act(() => api(`/api/lessons/${d.id}/attendance/all`, { method: 'POST', body: { status: e.target.checked ? 'present' : null } }))} /> Ҳоз.</label>` : 'Ҳоз.'}</th><th class="jsub">Хол</th>`)}</tr>
    </thead>
    <tbody>${data.students.map((s, i) => { const sw = s.weeks[wi]; return html`<tr class=${!T && s.id === data.me ? 'me' : ''}>
      <td class="jname"><span class="jav" style=${`background:${COLORS[i % COLORS.length]}`}>${s.name.trim().charAt(0).toUpperCase()}</span>${T ? html`<button class="jnamebtn" onClick=${() => onInfo(s)}>${i + 1}. ${s.name}</button>` : html`${i + 1}. ${s.name}`}</td>
      ${sw.days.map(c => html`<td class="jatt">
          ${T && html`<button class=${'jc' + (c.comments ? ' has' : '')} title="Шарҳ" aria-label=${'Шарҳ: ' + s.name} onClick=${() => onComment(s, w.days.find(d => d.id === c.id))}><${Bubble} on=${c.comments > 0} /></button>`}
          <input type="checkbox" aria-label=${'Ҳозирӣ: ' + s.name} checked=${c.att === 'present' || c.att === 'late'} disabled=${!T}
            class=${c.att === 'late' ? 'late' : c.att === 'absent' ? 'absent' : ''}
            onChange=${e => act(() => api(`/api/lessons/${c.id}/attendance`, { method: 'PUT', body: { user_id: s.id, status: e.target.checked ? 'present' : 'absent' } }))} />
        </td>
        <td class="jsc">${T
          ? html`<select class=${'jsel' + (c.auto ? ' auto' : '')} aria-label=${'Хол: ' + s.name} value=${c.score ?? ''} title=${c.auto ? 'Аз натиҷаи имтиҳон' : ''}
              onChange=${e => act(() => api(`/api/lessons/${c.id}/score`, { method: 'PUT', body: { user_id: s.id, score: e.target.value === '' ? null : Number(e.target.value) } }), e.target.value === '' ? 'Хол тоза шуд —' : `Холи ${e.target.value} барои ${s.name}`)}>
              <option value="">–</option>${[0, 1, 2, 3, 4, 5].map(n => html`<option value=${n}>${n}</option>`)}</select>`
          : html`<span class="jscv">${c.score ?? '–'}</span>`}</td>`)}
      <td class="jsc">${T ? html`<input class="jbonus" type="number" min="-30" max="30" value=${sw.bonus || ''} placeholder="0" aria-label=${'Бонус: ' + s.name}
          onChange=${e => act(() => api(`/api/groups/${gid}/bonus`, { method: 'PUT', body: { user_id: s.id, week: w.week, bonus: Number(e.target.value) || 0 } }))} />` : (sw.bonus || '–')}</td>
      <td class="jpct"><${Pct} v=${sw.percent} /></td>
      <td class="jpct"><${Pct} v=${s.overall} /></td>
    </tr>`; })}</tbody>
  </table></div>`;
}

// Хати мулоим аз нуқтаҳо (каҷхатҳои Безье)
function smooth(p) {
  if (p.length < 2) return p.length ? `M${p[0][0]},${p[0][1]}` : '';
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) { const [x0, y0] = p[i], [x1, y1] = p[i + 1], m = (x1 - x0) / 2; d += ` C${x0 + m},${y0} ${x1 - m},${y1} ${x1},${y1}`; }
  return d;
}
const Bubble = ({ on }) => html`<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill=${on ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const weekAvg = (data, w) => { const i = data.weeks.indexOf(w); const v = data.students.map(s => s.weeks[i].percent).filter(x => x != null); return v.length ? Math.round(v.reduce((a, x) => a + x, 0) / v.length) : null; };
const Pct = ({ v }) => v == null ? html`<span class="muted">–</span>` : html`<b class=${'pct ' + (v >= 75 ? 'hi' : v >= 50 ? 'mid' : 'lo')}>${v}%</b>`;

// Диаграмма: фоизи ҳар ҳафта ва миёна барои ҳар шогирд
function Chart({ data }) {
  const [hl, setHl] = useState(null);
  const weeks = data.weeks.filter(w => w.graded);
  if (!weeks.length) return html`<div class="card jchart"><div class="muted">Диаграмма пас аз гузоштани аввалин холҳо пайдо мешавад.</div></div>`;
  const W = 1000, H = 300, L = 46, R = 30, Tp = 16, B = 34;
  const xs = [...weeks.map(w => `Ҳафтаи ${w.week}`), 'Миёна'];
  const x = i => L + (xs.length === 1 ? 0 : (i * (W - L - R)) / (xs.length - 1));
  const y = v => Tp + ((100 - v) * (H - Tp - B)) / 100;
  const lines = data.students.map((s, k) => {
    const vals = [...weeks.map(w => s.weeks[data.weeks.indexOf(w)].percent), s.overall];
    const pts = vals.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
    return { s, k, pts, color: COLORS[k % COLORS.length] };
  });
  return html`<div class="card jchart">
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Диаграммаи фоизи ҳафтаҳо">
      ${[0, 25, 50, 75, 100].map(v => html`<g><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} class="grid" /><text x=${L - 8} y=${y(v) + 4} text-anchor="end" class="ax">${v}</text></g>`)}
      ${xs.map((t, i) => html`<g><line x1=${x(i)} x2=${x(i)} y1=${Tp} y2=${H - B} class="grid" /><text x=${x(i)} y=${H - 10} text-anchor=${i === 0 ? 'start' : i === xs.length - 1 ? 'end' : 'middle'} class="ax">${t}</text></g>`)}
      ${lines.map(l => l.pts.length > 0 && html`<g class=${hl == null ? '' : hl === l.s.id ? 'hl' : 'dim'}>
        <path d=${smooth(l.pts)} fill="none" stroke=${l.color} stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" />
        ${l.pts.map(p => html`<circle cx=${p[0]} cy=${p[1]} r="4.5" fill=${l.color} />`)}</g>`)}
    </svg>
    <div class="jlegend">${lines.map(l => html`<button class=${'jl' + (hl === l.s.id ? ' on' : '') + (!data.me || l.s.id !== data.me ? '' : ' me')} onClick=${() => setHl(hl === l.s.id ? null : l.s.id)}>
      <i style=${`background:${l.color}`}></i>${short(l.s.name)}</button>`)}</div>
  </div>`;
}

function Comments({ s, d, onClose }) {
  const [{ data, loading }, reload] = useLoad(() => api(`/api/lessons/${d.id}/jcomments?user_id=${s.id}`), [d.id, s.id]);
  const [f, setF] = useState({ kind: 'auto', text: '', late_min: '' });
  const [busy, setBusy] = useState(false);
  const add = async () => { setBusy(true); try { await api(`/api/lessons/${d.id}/jcomments`, { method: 'POST', body: { user_id: s.id, ...f } }); setF({ kind: 'auto', text: '', late_min: '' }); reload(true); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  const del = async id => { try { await api(`/api/jcomments/${id}`, { method: 'DELETE' }); reload(true); } catch (e) { toast(e.message); } };
  return html`<${Modal} title=${`Шарҳ: ${s.name} · ${ddmm(d.date)}`} onClose=${onClose}>
    ${loading ? html`<${Loading} />` : !data.length ? html`<div class="muted" style="margin-bottom:12px">Ҳанӯз шарҳ нест.</div>` : data.map(c => html`<div class="jcom">
      <div class="row"><span class="chip">${KIND_SHORT[c.kind] || c.kind}</span><b>${c.author}</b><span class="muted small">${fDateTime(c.created_at)}</span><div class="spacer"></div>
        <button class="btn sm ghost" onClick=${() => del(c.id)} aria-label="Нест кардан">✕</button></div>
      ${c.text && html`<div style="margin-top:6px">${c.text}</div>`}${c.late_min != null && html`<div class="small muted">Дермонӣ: ${c.late_min} дақиқа</div>`}</div>`)}
    <div class="col" style="gap:10px;margin-top:8px">
      <label class="f">Намуд<select class="i" value=${f.kind} onChange=${e => setF({ ...f, kind: e.target.value })}>${Object.entries(KIND).map(([k, t]) => html`<option value=${k}>${t}</option>`)}</select></label>
      <label class="f">Шарҳ<textarea class="i" rows="3" value=${f.text} onInput=${e => setF({ ...f, text: e.target.value })} placeholder="Масалан: бо падар гап задам"></textarea></label>
      <label class="f">Дақиқаи дермонӣ<input class="i" type="number" min="0" value=${f.late_min} onInput=${e => setF({ ...f, late_min: e.target.value })} /></label>
      <div class="row"><button class="btn p" disabled=${busy} onClick=${add}>Илова кун</button><button class="btn" onClick=${onClose}>Пӯшидан</button></div>
      <div class="small muted">Шарҳҳоро танҳо устод мебинад.</div>
    </div>
  <//>`;
}

function InfoCard({ s, data, onClose }) {
  const [f, setF] = useState({ ...s.info });
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); try { await api(`/api/students/${s.id}/info`, { method: 'PUT', body: f }); toast('Захира шуд.'); onClose(); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  const F = (k, t, type = 'text') => html`<label class="f">${t}<input class="i" type=${type} value=${f[k]} onInput=${e => setF({ ...f, [k]: e.target.value })} /></label>`;
  return html`<${Modal} title=${s.name} onClose=${onClose}>
    <div class="jsum">${s.weeks.map(w => html`<span class="chip">Ҳ${w.week}: ${w.percent == null ? '–' : w.percent + '%'}</span>`)}<span class="chip acc">Миёна: ${s.overall == null ? '–' : s.overall + '%'}</span></div>
    <div class="grid2" style="gap:10px">
      ${F('father_name', 'Номи падар')}${F('father_phone', 'Телефони падар', 'tel')}
      ${F('mother_name', 'Номи модар')}${F('mother_phone', 'Телефони модар', 'tel')}
      ${F('phone', 'Телефони шогирд', 'tel')}
    </div>
    <label class="f" style="margin-top:10px">Қайдҳо<textarea class="i" rows="3" value=${f.notes} onInput=${e => setF({ ...f, notes: e.target.value })}></textarea></label>
    <div class="small muted" style="margin:8px 0">Ин маълумотро танҳо устод мебинад — шогирд намебинад.</div>
    <div class="row"><button class="btn p" disabled=${busy} onClick=${save}>Захира кун</button><button class="btn" onClick=${onClose}>Бекор</button></div>
  <//>`;
}
