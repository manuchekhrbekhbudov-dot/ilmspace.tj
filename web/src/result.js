// Нишон додани натиҷаи иҷро/санҷиш бо забони фаҳмо
import { html, Verdict, fTime, fDateTime } from './lib.js';

export function NoOutput() { return html`<span class="muted">Барнома натиҷа чоп накард</span>`; }

function Shown({ text, diffLine, diffCol }) {
  if (text == null || text === '') return html`<${NoOutput} />`;
  if (!diffLine) return html`<pre>${text}</pre>`;
  const lines = text.replace(/\n$/, '').split('\n');
  return html`<pre>${lines.map((l, i) => {
    const n = i + 1;
    if (n !== diffLine) return html`${l}${i < lines.length - 1 ? '\n' : ''}`;
    const c = Math.max(0, (diffCol || 1) - 1);
    return html`${l.slice(0, c)}<span class="diffmark">${l.slice(c) || ' '}</span>${i < lines.length - 1 ? '\n' : ''}`;
  })}</pre>`;
}

export function CompileError({ compile, explain = [], onLine }) {
  return html`<div class="col">
    ${explain.length > 0 && html`<div class="col" style="gap:6px">${explain.map(e => html`
      <div class="notice warn">
        <b>Сатри <a href="#" onClick=${ev => { ev.preventDefault(); onLine?.(e.line); }}>${e.line}</a></b>${e.tj ? html`: ${e.tj}` : html`: <span class="mono">${e.original}</span>`}
      </div>`)}</div>`}
    <details open=${!explain.some(e => e.tj)}>
      <summary class="small muted" style="cursor:pointer">Паёми аслии компилятор</summary>
      <pre class="box mono" style="max-height:260px;font-size:12.5px">${compile}</pre>
    </details>
  </div>`;
}

export function NotConfigured({ detail, steps }) {
  return html`<div class="notice warn" role="alert">
    <b>Санҷандаи C++ пайваст нашудааст.</b> ${detail || ''}
    <div class="small" style="margin-top:6px">Ин хато ба кӯшиш ва баҳои шумо таъсир намерасонад. Ба устод хабар диҳед.</div>
    ${steps?.length > 0 && html`<ol class="small" style="margin:8px 0 0 18px;padding:0">${steps.map(s => html`<li>${s}</li>`)}</ol>`}
  </div>`;
}

/** Натиҷаи «Иҷро кун» */
export function RunResult({ r, expected, onLine }) {
  if (!r) return null;
  if (r.status === 'SE') return r.notConfigured ? html`<${NotConfigured} detail=${r.detail} steps=${r.steps} />`
    : html`<div class="notice warn"><b>Хидмати иҷро ҷавоб надод.</b> ${r.detail || ''} Баъдтар дубора кӯшиш кунед.</div>`;
  if (r.status === 'CE') return html`<div class="col"><${Verdict} v="CE" /><${CompileError} compile=${r.compile} explain=${r.compileExplain} onLine=${onLine} /></div>`;
  const matches = expected != null && r.status === 'OK' ? normalize(expected) === normalize(r.stdout) : null;
  return html`<div class="col" style="gap:8px">
    <div class="row">
      <${Verdict} v=${r.status} />
      ${r.ms != null && html`<span class="muted small">${r.ms} мс</span>`}
      ${matches === true && html`<span class="v v-ok">Бо натиҷаи интизоршуда мувофиқ аст</span>`}
      ${matches === false && html`<span class="v v-bad">Бо натиҷаи интизоршуда фарқ мекунад</span>`}
    </div>
    ${r.explain && html`<div class="notice bad">${r.explain}</div>`}
    <div class=${expected != null ? 'io3' : ''} style=${expected != null ? 'grid-template-columns:1fr 1fr' : ''}>
      ${expected != null && html`<div><div class="kicker">Интизор</div><pre>${expected}</pre></div>`}
      <div><div class="kicker">Барномаи ту чоп кард</div><div class="box"><${Shown} text=${r.stdout} /></div></div>
    </div>
    ${r.stderr && html`<details><summary class="small muted">stderr</summary><pre class="box">${r.stderr}</pre></details>`}
  </div>`;
}
const normalize = s => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n').replace(/\n+$/, '');

const TEST_STATUS = { AC: 'гузашт', WA: 'ҷавоби нодуруст', RE: 'хатои иҷро', TLE: 'вақт гузашт', MLE: 'хотира', OLE: 'баромади зиёд' };

/** Натиҷаи як кӯшиш (санҷиш бо ҳамаи тестҳо) */
export function SubmissionResult({ s, onLine, currentCode }) {
  if (!s) return null;
  const g = s.grading;
  const stale = currentCode != null && currentCode !== s.code;
  return html`<div class="col" style="gap:10px">
    <div class="row">
      <b>Кӯшиши №${s.number}</b>
      ${g ? html`<${Verdict} v=${g.verdict} extra=${g.verdict !== 'CE' && g.verdict !== 'SE' ? `${g.passed}/${g.total}` : ''} />` : html`<${Verdict} v=${s.status} />`}
      <span class="muted small">${fDateTime(s.created_at)} · версияи ${s.problem_version}${s.version_is_old ? ' (масъала баъдтар таҳрир шуд)' : ''}</span>
    </div>
    ${stale && html`<div class="small muted">Ин натиҷа ба коди кӯшиши №${s.number} тааллуқ дорад. Коди ҳозираи муҳаррир аз он фарқ мекунад.</div>`}
    ${!g && html`<div class="notice info"><span class="spin"></span> Санҷиш идома дорад. Шумо метавонед навиштанро идома диҳед — натиҷа ба ҳамин кӯшиш часпонда мешавад.</div>`}
    ${g?.verdict === 'SE' && (g.notConfigured ? html`<${NotConfigured} detail=${g.detail} steps=${g.steps} />`
      : html`<div class="notice warn"><b>Хидмати санҷиш ҷавоб надод.</b> ${g.detail || ''} Ин кӯшиш ба пешрафт ва баҳо таъсир намерасонад — дубора фиристед.</div>`)}
    ${g?.verdict === 'CE' && html`<${CompileError} compile=${g.compile} explain=${g.compileExplain} onLine=${onLine} />`}
    ${g?.verdict === 'AC' && html`<div class="notice ok"><b>Ҳал шуд!</b> Ҳамаи ${g.total} тест гузаштанд.</div>`}
    ${g && g.tests?.length > 0 && html`<${TestList} tests=${g.tests} />`}
  </div>`;
}

export function TestList({ tests }) {
  const firstBad = tests.find(t => t.status !== 'AC');
  return html`<div class="col" style="gap:8px">
    ${firstBad && !firstBad.hidden && html`<${OpenTestDetail} t=${firstBad} first />`}
    ${firstBad && firstBad.hidden && html`<div class="notice bad">Тести пинҳонии №${firstBad.i} нагузашт${firstBad.tags?.length ? html` (бахш: ${firstBad.tags.map(t => html`<span class="chip">${t}</span> `)})` : ''}. Вуруди тестҳои пинҳонӣ нишон дода намешавад.${firstBad.explain ? ' ' + firstBad.explain : ''}</div>`}
    <table class="t">
      <thead><tr><th>Тест</th><th>Бахш</th><th>Натиҷа</th></tr></thead>
      <tbody>${tests.map(t => html`<tr>
        <td>${t.i} · ${t.hidden ? 'пинҳонӣ' : 'кушода'}</td>
        <td>${(t.tags || []).map(x => html`<span class="chip">${x}</span> `)}</td>
        <td><span class=${'v ' + (t.status === 'AC' ? 'v-ok' : 'v-bad')}>${t.status === 'AC' ? '✓' : '✗'} ${TEST_STATUS[t.status] || t.status}</span></td>
      </tr>`)}</tbody>
    </table>
    ${tests.filter(t => !t.hidden && t.status !== 'AC' && t !== firstBad).map(t => html`<${OpenTestDetail} t=${t} />`)}
  </div>`;
}

function OpenTestDetail({ t, first }) {
  const d = t.diff;
  return html`<div class="card" style="padding:12px;border-color:var(--bad)">
    <div class="row" style="margin-bottom:8px"><b>Тести №${t.i}</b> <span class="muted small">кушода</span> ${(t.tags || []).map(x => html`<span class="chip">${x}</span>`)}<span class="v v-bad">${TEST_STATUS[t.status] || t.status}</span></div>
    ${t.explain && html`<div class="notice bad" style="margin-bottom:8px">${t.explain}</div>`}
    <div class="io3">
      <div><div class="kicker">Вуруд</div><pre>${t.input}</pre></div>
      <div><div class="kicker">Интизор</div><pre>${t.expected}</pre></div>
      <div><div class="kicker">Барномаи ту</div><div class="box"><${Shown} text=${t.actual} diffLine=${d?.line} diffCol=${d?.col} /></div></div>
    </div>
    ${d && t.status === 'WA' && html`<div style="margin-top:8px">${first ? 'Фарқи аввал' : 'Фарқ'}: сатри ${d.line}, аломати ${d.col} — интизор ${d.expected == null ? html`<i>сатр нест</i>` : html`<code>${d.expected || '(сатри холӣ)'}</code>`}, барномаи ту ${d.actual == null ? html`<i>ин сатрро чоп накард</i>` : html`<code>${d.actual || '(сатри холӣ)'}</code>`}.</div>`}
  </div>`;
}
