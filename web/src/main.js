import { html, render, useState, useEffect, api, connectEvents, disconnectEvents, Loading, store, useEvents, toast } from './lib.js';
import { Workspace } from './workspace.js';
import { StudentHome, ProblemsList, StudentLesson } from './student.js';
import { TeacherHome, GroupPage, Report, StudentProgress } from './teacher.js';
import { LiveLesson, ProjectorScreen } from './live.js';
import { ProblemEditor, TemplateEditor } from './authoring.js';
import { CourseMap, SetPage, VIOL } from './course.js';

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

function Header({ user, hash, onLogout, judge, storage }) {
  const online = useOnline();
  const nav = user.role === 'teacher'
    ? [['#/', 'Гурӯҳҳо'], ['#/problems', 'Масъалаҳо']]
    : [['#/', 'Асосӣ'], ['#/course', 'Нақшаи курс'], ['#/problems', 'Масъалаҳо']];
  const route = hash.split('?')[0];
  return html`<header class="top">
    <a class="logo" href="#/">ILMSPACE <b>CodeLab</b></a>
    <nav class="nav" aria-label="Асосӣ">${nav.map(([h, t]) => html`<a href=${h} class=${route === h ? 'on' : ''}>${t}</a>`)}</nav>
    <div class="spacer"></div>
    ${!online && html`<span class="net" role="status"><span class="long">Интернет нест — код дар дастгоҳ нигоҳ дошта мешавад</span><span class="short">Офлайн</span></span>`}
    ${user.role === 'teacher' && judge && !judge.ok && html`<span class="net" title=${judge.reason}>Санҷанда танзим нашудааст</span>`}
    ${user.role === 'teacher' && storage?.ephemeral && html`<span class="net" title=${storage.lastError || 'Дар Render DATABASE_URL-ро гузоред (README)'}>${storage.mode === 'invalid' ? 'DATABASE_URL нодуруст — маълумот муваққатӣ' : 'Маълумот муваққатӣ аст'}</span>`}
    ${user.role === 'teacher' && storage?.mode === 'postgres' && storage.lastError && html`<span class="net" title=${storage.lastError}>Нусха ба база нарафт</span>`}
    ${user.role === 'teacher' && judge?.ok && judge.warning && html`<span class="net" title=${judge.warning}>Санҷандаи маҳаллӣ бе ҷудокунӣ</span>`}
    <button class="btn ghost icon-btn" onClick=${toggleTheme} title="Мавзӯи торик/равшан" aria-label="Мавзӯи торик/равшан">◐</button>
    <a class="userpill" href="#/profile" title="Ҳисоби ман: ном, логин ва парол"><span class="avatar" aria-hidden="true">${(user.name || '?').trim().charAt(0).toUpperCase()}</span><span class="uinfo"><b class="uname">${user.name}</b><small>${user.role === 'teacher' ? 'устод' : 'шогирд'} · ${user.login}</small></span></a>
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

function Profile({ me, onSaved }) {
  const [f, setF] = useState({ name: me.name, login: me.login, new_password: '', current_password: '' });
  const [msg, setMsg] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const demo = me.login === 'ustod' || me.login === 'shogird' || me.login === 'begona';
  const save = async e => {
    e.preventDefault(); setErr(null); setMsg(null);
    if (!f.current_password) return setErr('Пароли ҳозираро нависед.');
    setBusy(true);
    try { const r = await api('/api/me', { method: 'PUT', body: f }); onSaved(r.user); setF({ ...f, new_password: '', current_password: '' }); setMsg(`Захира шуд. Акнун бо логини «${r.user.login}» ворид мешавед.`); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return html`<div class="page" style="max-width:560px">
    <h1 style="margin-bottom:12px">Ҳисоби ман</h1>
    ${demo && html`<div class="notice warn" style="margin-bottom:14px">Ин ҳисоби намоишӣ аст ва пароли онро ҳама медонанд. Логин ва паролро ба худатон иваз кунед — гурӯҳҳо ва дарсҳо ҳамроҳи ҳисоб мемонанд.</div>`}
    <form class="col card" onSubmit=${save} noValidate>
      <label class="f">Ном ва насаб<input class="i" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })} /></label>
      <label class="f">Логини нав<input class="i mono" autocapitalize="off" value=${f.login} onInput=${e => setF({ ...f, login: e.target.value })} /></label>
      <label class="f">Пароли нав (ҳадди ақал 8 аломат; холӣ монад — парол иваз намешавад)<input class="i" type="password" autocomplete="new-password" value=${f.new_password} onInput=${e => setF({ ...f, new_password: e.target.value })} /></label>
      <div class="sep"></div>
      <label class="f">Пароли ҳозира (барои тасдиқ)<input class="i" type="password" autocomplete="current-password" value=${f.current_password} onInput=${e => setF({ ...f, current_password: e.target.value })} /></label>
      ${err && html`<div class="err" role="alert">${err}</div>`}
      ${msg && html`<div class="notice ok" role="status">${msg}</div>`}
      <div><button class="btn p lg" disabled=${busy}>Захира кун</button></div>
    </form>
  </div>`;
}

// Ҳисоб бо пароли намоишии оммавӣ («ilmspace»): ҳар кас метавонад ворид шавад — фавран иваз кунед
function WeakPassword({ me, onSaved }) {
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setErr(null);
    if (a.length < 8) return setErr('Пароли нав бояд ҳадди ақал 8 аломат бошад.');
    if (a !== b) return setErr('Ду парол якхела нестанд. Боз як бор нависед.');
    setBusy(true);
    try { const r = await api('/api/me', { method: 'PUT', body: { current_password: 'ilmspace', new_password: a } }); onSaved(r.user); toast('✓ Пароли нав гузошта шуд. Онро дар хотир нигоҳ доред.'); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return html`<div class="weakpw" role="alert"><form class="weakpw-in" onSubmit=${save} noValidate>
    <div class="weakpw-t">⚠️ Пароли шумо <b>ilmspace</b> аст — онро ҳама медонанд!</div>
    <div class="weakpw-s">Ин пароли намоишӣ дар интернет навишта шудааст. Ҳар кас метавонад бо ҳисоби <b>${me.login}</b> ворид шавад${me.role === 'teacher' ? ' ва, масалан, блоки имтиҳонро бардорад' : ''}. Ҳозир пароли нав гузоред:</div>
    <div class="row">
      <input class="i" type="password" autocomplete="new-password" placeholder="Пароли нав (8+ аломат)" aria-label="Пароли нав" value=${a} onInput=${e => setA(e.target.value)} />
      <input class="i" type="password" autocomplete="new-password" placeholder="Боз як бор" aria-label="Пароли нав боз як бор" value=${b} onInput=${e => setB(e.target.value)} />
      <button class="btn p" disabled=${busy}>Нигоҳ дор</button>
    </div>
    ${err && html`<div class="err">${err}</div>`}
  </form></div>`;
}

function App() {
  const [me, setMe] = useState(undefined);
  const [judge, setJudge] = useState(null);
  const [storage, setStorage] = useState(null);
  const hash = useHash();
  const load = () => api('/api/me').then(r => { setMe(r.user); setJudge(r.judge); setStorage(r.storage); }).catch(() => setMe(store.get('me') || null));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (me) { store.set('me', me); connectEvents(); } else disconnectEvents(); }, [me?.id]);
  useEvents(ev => {
    if (me?.role === 'teacher' && ev.type === 'exam' && ev.name) {
      if (ev.blocked) toast(`⛔ ${ev.name} аз имтиҳон блок шуд (3 вайронкунӣ). Дар «Шогирдон» ё дар рӯзи имтиҳон «Блокро бардор»-ро пахш кунед.`, { big: true });
      else if (ev.count) toast(`⚠ ${ev.name}: вайронкунӣ ${ev.count} аз 3 — ${VIOL[ev.vtype]?.[0] || ev.vtype}`);
      else if (ev.finished) toast(`🏁 ${ev.name} имтиҳонро тамом кард.`);
      return;
    }
    if (me?.role !== 'student') return;
    if (ev.type === 'comment') toast('💬 Устод ба коди шумо шарҳ гузошт. Масъаларо кушоед → «Кӯшишҳо».');
    if (ev.type === 'help' && ev.action === 'take') toast('✋ Устод дархости шуморо гирифт — ҳозир ёрӣ медиҳад.');
    if (ev.type === 'help' && ev.action === 'done') toast('✓ Устод дархости ёрии шуморо анҷомёфта қайд кард.');
    if (ev.type === 'assignment') toast('📌 Вазифаи нави хонагӣ илова шуд.');
  }, [me?.role]);
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
  else if (seg[0] === 'course') page = html`<${CourseMap} key=${seg[1] || 'mine'} gid=${seg[1] ? Number(seg[1]) : null} />`;
  else if (seg[0] === 'set') page = html`<${SetPage} key=${seg[1]} user=${me} lid=${seg[1]} kind=${seg[2]} idx=${seg[3]} />`;
  else if (seg[0] === 'profile') page = html`<${Profile} me=${me} onSaved=${u => setMe(u)} />`;
  else if (seg[0] === 'problems') page = html`<${ProblemsList} user=${me} />`;
  else if (seg[0] === 'p' && !T) page = html`<${Workspace} key=${seg[1] + (q.lesson || '')} user=${me} pid=${Number(seg[1])} lessonId=${q.lesson ? Number(q.lesson) : null} />`;
  else if (seg[0] === 'lesson' && !T) page = html`<${StudentLesson} id=${seg[1]} />`;
  else if (seg[0] === 'g' && T && seg[2] === 's') page = html`<${StudentProgress} key=${seg[3]} gid=${seg[1]} uid=${seg[3]} />`;
  else if (seg[0] === 'g' && T) page = html`<${GroupPage} key=${seg[1]} id=${seg[1]} tab=${q.tab} />`;
  else if (seg[0] === 'live' && T) page = html`<${LiveLesson} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'report' && T) page = html`<${Report} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'problem' && T) page = html`<${ProblemEditor} key=${seg[1]} id=${seg[1]} />`;
  else if (seg[0] === 'template' && T) page = html`<${TemplateEditor} key=${seg[1]} id=${seg[1]} />`;
  else page = html`<div class="page"><div class="empty"><h3>Саҳифа ёфт нашуд</h3><a href="#/">Ба саҳифаи асосӣ</a></div></div>`;
  return html`<${Header} user=${me} hash=${hash} onLogout=${logout} judge=${judge} storage=${storage} />${me.weak_pw ? html`<${WeakPassword} me=${me} onSaved=${u => setMe(u)} />` : ''}${page}`;
}

render(html`<${App} />`, document.getElementById('app'));
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
