import { html, render, useState, useEffect, api, connectEvents, disconnectEvents, Loading, store } from './lib.js';
import { Workspace } from './workspace.js';
import { StudentHome, ProblemsList, StudentLesson } from './student.js';
import { TeacherHome, GroupPage, Report } from './teacher.js';
import { LiveLesson, ProjectorScreen } from './live.js';
import { ProblemEditor, TemplateEditor } from './authoring.js';

function useHash() {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => { const f = () => setH(location.hash || '#/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
}
function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b); }; }, []);
  return on;
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; store.set('theme', next); try { localStorage.setItem('theme', next); } catch {}
}

function Header({ user, hash, onLogout, judge }) {
  const online = useOnline();
  const nav = user.role === 'teacher'
    ? [['#/', 'Гурӯҳҳо'], ['#/problems', 'Масъалаҳо']]
    : [['#/', 'Асосӣ'], ['#/problems', 'Масъалаҳо']];
  const route = hash.split('?')[0];
  return html`<header class="top">
    <a class="logo" href="#/">ILMSPACE <b>CodeLab</b></a>
    <nav class="nav" aria-label="Асосӣ">${nav.map(([h, t]) => html`<a href=${h} class=${route === h ? 'on' : ''}>${t}</a>`)}</nav>
    <div class="spacer"></div>
    ${!online && html`<span class="net" role="status"><span class="long">Интернет нест — код дар дастгоҳ нигоҳ дошта мешавад</span><span class="short">Офлайн</span></span>`}
    ${user.role === 'teacher' && judge && !judge.ok && html`<span class="net" title=${judge.reason}>Санҷанда танзим нашудааст</span>`}
    ${user.role === 'teacher' && judge?.ok && judge.warning && html`<span class="net" title=${judge.warning}>Санҷандаи маҳаллӣ бе ҷудокунӣ</span>`}
    <button class="btn ghost icon-btn" onClick=${toggleTheme} title="Мавзӯи торик/равшан" aria-label="Мавзӯи торик/равшан">◐</button>
    <span class="muted small uname" style="white-space:nowrap">${user.name}${user.role === 'teacher' ? ' · устод' : ''}</span>
    <button class="btn ghost sm" onClick=${onLogout}>Баромад</button>
  </header>`;
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', login: '', password: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setErr(null);
    if (mode === 'register' && f.name.trim().length < 2) return setErr('Ном ва насабро нависед.');
    if (!f.login.trim()) return setErr('Логинро нависед.');
    if (!f.password) return setErr('Паролро нависед.');
    setBusy(true);
    try { const r = await api(mode === 'login' ? '/api/login' : '/api/register', { method: 'POST', body: f }); onAuth(r.user); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return html`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px 16px">
    <div class="card" style="width:100%;max-width:420px;padding:26px">
      <div class="logo" style="font-size:22px">ILMSPACE <b>CodeLab</b></div>
      <p class="muted" style="margin:6px 0 18px">Синфхонаи онлайни C++ барои маркази омӯзишии ilmspace.tj</p>
      <div class="tabs" style="margin:0 0 16px;position:static;padding:0">
        <button class=${mode === 'login' ? 'on' : ''} onClick=${() => setMode('login')}>Ворид шав</button>
        <button class=${mode === 'register' ? 'on' : ''} onClick=${() => setMode('register')}>Сабти ном (шогирд)</button>
      </div>
      <form class="col" onSubmit=${submit} noValidate>
        ${mode === 'register' && html`<label class="f">Ном ва насаб<input class="i" autocomplete="name" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="Мадина Азизова" /></label>`}
        <label class="f">Логин<input class="i mono" autocomplete="username" autocapitalize="off" value=${f.login} onInput=${e => setF({ ...f, login: e.target.value })} placeholder=${mode === 'register' ? 'масалан: madina2012 ё мадина' : ''} /></label>
        <label class="f">Парол<input class="i" type="password" autocomplete=${mode === 'login' ? 'current-password' : 'new-password'} value=${f.password} onInput=${e => setF({ ...f, password: e.target.value })} /></label>
        ${mode === 'register' && html`<div class="small muted">Логин: 3–32 аломат, бе фосила. Парол: ҳадди ақал 8 аломат.</div>`}
        ${err && html`<div class="err" role="alert">${err}</div>`}
        <button class="btn p lg" disabled=${busy}>${busy ? html`<span class="spin"></span>` : ''} ${mode === 'login' ? 'Ворид шав' : 'Сабти ном кун'}</button>
        ${mode === 'register' && html`<div class="small muted">Пас аз сабти ном логини худро ба устод гӯед ё рамзи даъвати гурӯҳро ворид кунед.</div>`}
      </form>
    </div>
  </div>`;
}

function App() {
  const [me, setMe] = useState(undefined);
  const [judge, setJudge] = useState(null);
  const hash = useHash();
  const load = () => api('/api/me').then(r => { setMe(r.user); setJudge(r.judge); }).catch(() => setMe(store.get('me') || null));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (me) { store.set('me', me); connectEvents(); } else disconnectEvents(); }, [me?.id]);
  if (me === undefined) return html`<${Loading} />`;
  if (!me) return html`<${Auth} onAuth=${u => { setMe(u); location.hash = '#/'; load(); }} />`;
  const logout = async () => { try { await api('/api/logout', { method: 'POST' }); } catch {} store.del('me'); setMe(null); };

  const [path, qs] = hash.slice(1).split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const seg = path.split('/').filter(Boolean);
  if (seg[0] === 'projector' && me.role === 'teacher') return html`<${ProjectorScreen} id=${seg[1]} />`;
  let page;
  const T = me.role === 'teacher';
  if (!seg.length) page = T ? html`<${TeacherHome} />` : html`<${StudentHome} user=${me} />`;
  else if (seg[0] === 'problems') page = html`<${ProblemsList} user=${me} />`;
  else if (seg[0] === 'p' && !T) page = html`<${Workspace} key=${seg[1] + (q.lesson || '')} user=${me} pid=${Number(seg[1])} lessonId=${q.lesson ? Number(q.lesson) : null} />`;
  else if (seg[0] === 'lesson' && !T) page = html`<${StudentLesson} id=${seg[1]} />`;
  else if (seg[0] === 'g' && T) page = html`<${GroupPage} key=${seg[1]} id=${seg[1]} tab=${q.tab} />`;
  else if (seg[0] === 'live' && T) page = html`<${LiveLesson} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'report' && T) page = html`<${Report} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'problem' && T) page = html`<${ProblemEditor} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'template' && T) page = html`<${TemplateEditor} key=${seg[1]} id=${seg[1]} />`;
  else page = html`<div class="page"><div class="empty"><h3>Саҳифа ёфт нашуд</h3><a href="#/">Ба саҳифаи асосӣ</a></div></div>`;
  return html`<${Header} user=${me} hash=${hash} onLogout=${logout} judge=${judge} />${page}`;
}

render(html`<${App} />`, document.getElementById('app'));
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
