import { h, render } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import htm from 'htm';
export const html = htm.bind(h);
export { h, render, useState, useEffect, useRef, useCallback };

// ───── API ─────
export class ApiError extends Error {
  constructor(status, data) { super(data?.error || `Хато ${status}`); this.status = status; this.data = data; }
}
export async function api(path, opts = {}) {
  const { method = 'GET', body } = opts;
  let res;
  try {
    res = await fetch(path, { method, credentials: 'same-origin', headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new ApiError(0, { error: 'Пайваст бо сервер нест. Интернетро тафтиш кунед.', offline: true });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// ───── Рӯйдодҳо (SSE) ─────
const listeners = new Set();
let es = null;
export function connectEvents() {
  if (es) es.close();
  es = new EventSource('/api/events');
  es.onmessage = m => { let d; try { d = JSON.parse(m.data); } catch { return; } listeners.forEach(f => f(d)); };
}
export function disconnectEvents() { if (es) es.close(); es = null; }
export function useEvents(fn, deps = []) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { const f = d => ref.current(d); listeners.add(f); return () => listeners.delete(f); }, deps);
}

// ───── Вақти Душанбе ─────
const TZ = 'Asia/Dushanbe';
const fmt = (o) => new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, ...o });
export const fTime = iso => iso ? fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '';
export const fDate = iso => iso ? fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '';
export const fDateTime = iso => iso ? `${fDate(iso)}, ${fTime(iso)}` : '';
const WD = ['якшанбе', 'душанбе', 'сешанбе', 'чоршанбе', 'панҷшанбе', 'ҷумъа', 'шанбе'];
export function fWeekday(iso) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600000); return WD[d.getUTCDay()];
}
export function dushanbeToday() { return new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10); }
export function dushanbeDateOf(iso) { return new Date(new Date(iso).getTime() + 5 * 3600000).toISOString().slice(0, 10); }
export function since(iso) {
  if (!iso) return '';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} дақ.` : `${Math.floor(m / 60)} соат ${m % 60} дақ.`;
}

// ───── Ҳолатҳои санҷиш ─────
export const VERDICT = {
  AC: ['Ҷавоби дуруст', 'v-ok', '✓'],
  WA: ['Ҷавоби нодуруст', 'v-bad', '✗'],
  CE: ['Хатои компилятсия', 'v-warn', '⚠'],
  RE: ['Хатои вақти иҷро', 'v-bad', '✗'],
  TLE: ['Аз маҳдудияти вақт гузашт', 'v-bad', '⏱'],
  MLE: ['Аз маҳдудияти хотира гузашт', 'v-bad', '✗'],
  OLE: ['Баромади аз ҳад зиёд', 'v-bad', '✗'],
  SE: ['Хидмати санҷиш ҷавоб надод', 'v-se', '⚠'],
  queued: ['Дар навбат', 'v-info', '◷'],
  running: ['Санҷида мешавад', 'v-info', '◷'],
  OK: ['Иҷро шуд', 'v-ok', '✓'],
};
export function Verdict({ v, extra }) {
  const [t, c, i] = VERDICT[v] || [v, 'v-none', ''];
  return html`<span class=${'v ' + c}>${i} ${t}${extra ? html` · ${extra}` : ''}</span>`;
}

// ───── Ёрирасонҳо ─────
export const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
export function deviceId() {
  let d = store.get('device');
  if (!d) { const ua = navigator.userAgent; const kind = /Mobi|Android|iPhone/.test(ua) ? 'Телефон' : 'Компютер'; d = `${kind}-${uuid().slice(0, 4)}`; store.set('device', d); }
  return d;
}

let toastTimer;
export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

// Фарқи сатрҳо (LCS) барои муқоисаи ду кӯшиш
export function lineDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const n = A.length, m = B.length;
  if (n * m > 4_000_000) return [...A.map(t => ({ t, k: 'del' })), ...B.map(t => ({ t, k: 'add' }))];
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ t: A[i], k: 'same', a: i + 1, b: j + 1 }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ t: A[i], k: 'del', a: i + 1 }); i++; }
    else { out.push({ t: B[j], k: 'add', b: j + 1 }); j++; }
  }
  while (i < n) { out.push({ t: A[i], k: 'del', a: i + 1 }); i++; }
  while (j < m) { out.push({ t: B[j], k: 'add', b: j + 1 }); j++; }
  return out;
}

// ───── Компонентҳои умумӣ ─────
export function Loading({ text = 'Бор мешавад…' }) {
  return html`<div class="loading"><span class="spin"></span> ${text}</div>`;
}
export function Empty({ title, children }) {
  return html`<div class="empty"><h3>${title}</h3><div>${children}</div></div>`;
}
export function ErrorBox({ error, retry }) {
  const off = error?.data?.offline;
  return html`<div class=${'notice ' + (off ? 'warn' : 'bad')} role="alert">
    <b>${off ? 'Интернет нест' : 'Хато'}</b>: ${error?.message || String(error)}
    ${retry && html` <button class="btn sm" onClick=${retry}>Дубора кӯшиш кун</button>`}
  </div>`;
}
export function Modal({ title, onClose, wide, children }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return html`<div class="modal-bg" onClick=${e => e.target === e.currentTarget && onClose()}>
    <div class=${'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label=${title}>
      <div class="modal-h"><h2>${title}</h2><div class="spacer"></div><button class="btn ghost icon-btn" onClick=${onClose} aria-label="Пӯшидан">✕</button></div>
      ${children}
    </div></div>`;
}
// Боркунии маълумот бо ҳолатҳои боршавӣ/хато
export function useLoad(fn, deps = []) {
  const [state, set] = useState({ loading: true, data: null, error: null });
  const reload = useCallback(async (silent) => {
    if (!silent) set(s => ({ ...s, loading: !s.data }));
    try { const data = await fn(); set({ loading: false, data, error: null }); }
    catch (error) { set(s => ({ loading: false, data: s.data, error })); }
  }, deps);
  useEffect(() => { reload(); }, deps);
  return [state, reload];
}
// Код бо рақами сатр, шарҳҳо ва интихоби сатр
export function CodeView({ code, comments = [], onLine, marks = {}, start = 1, selected }) {
  const lines = code.split('\n');
  return html`<div class="codeview">${lines.map((t, i) => {
    const n = i + start; const cs = comments.filter(c => c.line === n);
    const cls = 'ln' + (onLine ? ' click' : '') + (cs.length ? ' cm' : '') + (marks[n] ? ' ' + marks[n] : '') + (selected && n >= selected[0] && n <= selected[1] ? ' sel' : '');
    return html`<div key=${n}>
      <div class=${cls} onClick=${onLine ? () => onLine(n) : undefined} title=${onLine ? 'Ба ин сатр шарҳ гузор' : undefined}><span>${n}</span><span>${t || ' '}</span></div>
      ${cs.map(c => html`<div class="cmt"><b>${c.author}</b> <span class="muted small">· сатри ${c.line} · ${fTime(c.created_at)}</span><div>${c.text}</div></div>`)}
    </div>`;
  })}</div>`;
}
export function DiffView({ a, b }) {
  const d = lineDiff(a, b);
  const changed = d.filter(x => x.k !== 'same').length;
  return html`<div>
    <div class="muted small" style="margin-bottom:6px">${changed ? `${changed} сатр тағйир ёфт (− хориҷ, + илова)` : 'Код якхела аст'}</div>
    <div class="codeview">${d.map((x, i) => html`<div class=${'ln ' + x.k} key=${i}><span>${x.k === 'add' ? '+' : x.k === 'del' ? '−' : x.b}</span><span>${x.t || ' '}</span></div>`)}</div>
  </div>`;
}
export const TOPIC = { io: 'Вуруд/баромад ва ҳисоб', cond: 'Шартҳо', loops: 'Даврҳо', arrays: 'Массивҳо', strings: 'Сатрҳо', funcs: 'Функсияҳо' };
export const TOPIC_KEYS = Object.keys(TOPIC);
