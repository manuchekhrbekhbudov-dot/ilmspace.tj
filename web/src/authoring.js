// Муҳаррири масъала ва муҳаррири қолаби дарс
import { html, useState, useEffect, api, useLoad, Loading, ErrorBox, Modal, toast, TOPIC, TOPIC_KEYS, fDateTime } from './lib.js';
import { CodeEditor } from './editor.js';
import { CompileError, NotConfigured } from './result.js';

export function ProblemEditor({ id }) {
  const [{ data, loading, error }, reload] = useLoad(() => api(`/api/problems/${id}`), [id]);
  const [d, setD] = useState(null);
  const [topic, setTopic] = useState('io');
  const [ptags, setPtags] = useState('');
  const [check, setCheck] = useState(null); const [busy, setBusy] = useState(''); const [preview, setPreview] = useState(false); const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!data) return;
    setD(structuredClone(data.draft || data.published)); setTopic(data.topic); setPtags((data.practice_tags || []).join(', ')); setDirty(false);
  }, [data]);
  if (loading || (data && !d)) return html`<${Loading} />`;
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const set = (k, v) => { setD(x => ({ ...x, [k]: v })); setDirty(true); };
  const setArr = (k, i, f, v) => { setD(x => { const a = [...x[k]]; a[i] = typeof a[i] === 'object' ? { ...a[i], [f]: v } : v; return { ...x, [k]: a }; }); setDirty(true); };
  const saveDraft = async () => { await api(`/api/problems/${id}/draft`, { method: 'PUT', body: { data: d, topic, practice_tags: ptags.split(',').map(s => s.trim()).filter(Boolean) } }); setDirty(false); };
  const doSave = async () => { setBusy('save'); try { await saveDraft(); toast('Тағйирот захира шуд (ҳанӯз нашр нашудааст).'); } catch (e) { toast(e.message); } finally { setBusy(''); } };
  const doCheck = async () => { setBusy('check'); setCheck(null); try { setCheck(await api(`/api/problems/${id}/check`, { method: 'POST', body: { data: d } })); } catch (e) { toast(e.message); } finally { setBusy(''); } };
  const doPublish = async () => {
    setBusy('pub'); setCheck(null);
    try { await saveDraft(); const r = await api(`/api/problems/${id}/publish`, { method: 'POST' }); toast(`Версияи ${r.version} нашр шуд. Кӯшишҳои пешина бо версияи худ мемонанд.`); reload(); }
    catch (e) { if (e.data?.check) setCheck(e.data.check); toast(e.message); } finally { setBusy(''); }
  };
  const tags = t => Array.isArray(t) ? t.join(', ') : t;
  return html`<div class="page">
    <a href="#/problems" class="small">← Масъалаҳо</a>
    <div class="row" style="margin:6px 0 14px">
      <h1>${d.title || 'Масъалаи нав'}</h1>
      <span class="chip">${data.current_version ? `нашр: версияи ${data.current_version}` : 'нашр нашудааст'}</span>
      ${(data.draft || dirty) && html`<span class="chip warn">тағйироти нашрнашуда</span>`}
      <div class="spacer"></div>
      <button class="btn" onClick=${() => setPreview(true)}>Аз назари шогирд бин</button>
      <button class="btn" onClick=${doCheck} disabled=${!!busy}>${busy === 'check' ? html`<span class="spin"></span>` : ''} Ҳалли намунавиро бисанҷ</button>
      <button class="btn" onClick=${doSave} disabled=${!!busy}>Захира кун</button>
      <button class="btn p" onClick=${doPublish} disabled=${!!busy}>${busy === 'pub' ? html`<span class="spin"></span>` : ''} Нашр кун</button>
    </div>
    ${check && html`<${CheckResult} c=${check} />`}
    <div class="grid2" style="margin-top:14px">
      <div class="col">
        <div class="row"><label class="f" style="flex:2">Ном<input class="i" value=${d.title} onInput=${e => set('title', e.target.value)} /></label>
          <label class="f" style="flex:1">Мавзӯъ<select class="i" value=${topic} onChange=${e => { setTopic(e.target.value); setDirty(true); }}>${TOPIC_KEYS.map(k => html`<option value=${k}>${TOPIC[k]}</option>`)}</select></label>
          <label class="f" style="flex:1">Сатҳ<select class="i" value=${d.level} onChange=${e => set('level', e.target.value)}>${['Осон', 'Миёна', 'Душвор'].map(x => html`<option>${x}</option>`)}</select></label></div>
        <label class="f">Шарт<textarea class="i" rows="5" value=${d.statement} onInput=${e => set('statement', e.target.value)}></textarea></label>
        <div class="row"><label class="f" style="flex:1">Формати вуруд<textarea class="i" rows="2" value=${d.input} onInput=${e => set('input', e.target.value)}></textarea></label>
          <label class="f" style="flex:1">Формати баромад<textarea class="i" rows="2" value=${d.output} onInput=${e => set('output', e.target.value)}></textarea></label></div>
        <div class="row"><label class="f" style="flex:2">Маҳдудиятҳо<input class="i" value=${d.constraints} onInput=${e => set('constraints', e.target.value)} /></label>
          <label class="f" style="flex:1">Вақт (мс)<input class="i" type="number" value=${d.timeMs} onInput=${e => set('timeMs', Number(e.target.value))} /></label>
          <label class="f" style="flex:1">Хотира (МБ)<input class="i" type="number" value=${d.memoryMb} onInput=${e => set('memoryMb', Number(e.target.value))} /></label></div>
        <div class="card"><div class="row"><h3 style="margin:0">Мисолҳо (кушода)</h3><div class="spacer"></div><button class="btn sm" onClick=${() => set('examples', [...d.examples, { input: '', output: '', explain: '' }])}>+ Мисол</button></div>
          ${d.examples.map((ex, i) => html`<div class="row" style="align-items:flex-start;margin-top:10px">
            <label class="f" style="flex:1">Вуруд<textarea class="i mono" rows="2" value=${ex.input} onInput=${e => setArr('examples', i, 'input', e.target.value)}></textarea></label>
            <label class="f" style="flex:1">Баромад<textarea class="i mono" rows="2" value=${ex.output} onInput=${e => setArr('examples', i, 'output', e.target.value)}></textarea></label>
            <label class="f" style="flex:2">Шарҳ<textarea class="i" rows="2" value=${ex.explain} onInput=${e => setArr('examples', i, 'explain', e.target.value)}></textarea></label>
            <button class="btn sm danger" style="margin-top:22px" onClick=${() => set('examples', d.examples.filter((_, j) => j !== i))} aria-label="Нест кун">✕</button></div>`)}</div>
        <div class="card"><h3>Се ишораи пайдарпай</h3>${[0, 1, 2].map(i => html`<label class="f" style="margin-top:6px">Ишораи ${i + 1}<input class="i" value=${d.hints[i] || ''} onInput=${e => setArr('hints', i, null, e.target.value)} /></label>`)}</div>
        <label class="f">Машқ барои тамғаҳо (тавсия ба шогирдоне, ки дар ин тамғаҳо афтоданд)<input class="i" value=${ptags} onInput=${e => { setPtags(e.target.value); setDirty(true); }} placeholder="баробарӣ, сифр" /></label>
      </div>
      <div class="col">
        <div class="card" style="padding:0;overflow:hidden"><div class="toolbar"><b>Ҳалли намунавӣ</b><span class="muted small">танҳо барои устод</span></div><div style="height:300px"><${CodeEditor} value=${d.solution} onChange=${v => set('solution', v)} fontSize=${13} /></div></div>
        <div class="card" style="padding:0;overflow:hidden"><div class="toolbar"><b>Қолаби ибтидоӣ барои шогирд</b></div><div style="height:180px"><${CodeEditor} value=${d.starter} onChange=${v => set('starter', v)} fontSize=${13} /></div></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="row"><h3 style="margin:0">Тестҳо (${d.tests.length}; пинҳонӣ: ${d.tests.filter(t => t.hidden).length})</h3><div class="spacer"></div><button class="btn sm" onClick=${() => set('tests', [...d.tests, { input: '', output: '', hidden: true, tags: [] }])}>+ Тест</button></div>
      <table class="t" style="margin-top:8px"><thead><tr><th>#</th><th>Вуруд</th><th>Баромади интизоршуда</th><th>Тамғаҳо</th><th>Пинҳонӣ</th><th></th></tr></thead>
      <tbody>${d.tests.map((t, i) => html`<tr>
        <td>${i + 1}</td>
        <td><textarea class="i mono" rows="2" value=${t.input.length > 2000 ? t.input.slice(0, 200) + '…' : t.input} disabled=${t.input.length > 2000} onInput=${e => setArr('tests', i, 'input', e.target.value)}></textarea>${t.input.length > 2000 && html`<div class="small muted">Тести калон (${t.input.length} аломат)</div>`}</td>
        <td><textarea class="i mono" rows="2" value=${t.output} onInput=${e => setArr('tests', i, 'output', e.target.value)}></textarea></td>
        <td><input class="i" value=${tags(t.tags)} onInput=${e => setArr('tests', i, 'tags', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} placeholder="баробарӣ, сифр" /></td>
        <td><label><input type="checkbox" checked=${t.hidden} onChange=${e => setArr('tests', i, 'hidden', e.target.checked)} /> пинҳонӣ</label></td>
        <td><button class="btn sm danger" onClick=${() => set('tests', d.tests.filter((_, j) => j !== i))} aria-label="Нест кун">✕</button></td>
      </tr>`)}</tbody></table>
    </div>
    ${data.versions.length > 0 && html`<div class="small muted" style="margin-top:12px">Версияҳо: ${data.versions.map(v => `в.${v.version} (${fDateTime(v.published_at)})`).join(' · ')}. Кӯшишҳои кӯҳна ба версияи худ пайваст мемонанд.</div>`}
    ${preview && html`<${Modal} title="Аз назари шогирд" onClose=${() => setPreview(false)} wide><${StudentPreview} d=${d} topic=${topic} /><//>`}
  </div>`;
}

function CheckResult({ c }) {
  if (c.notConfigured) return html`<${NotConfigured} detail=${c.detail} steps=${c.steps} />`;
  if (c.verdict === 'SE') return html`<div class="notice warn">Хидмати санҷиш ҷавоб надод: ${c.detail}</div>`;
  if (c.verdict === 'CE') return html`<div class="notice bad"><b>Ҳалли намунавӣ компилятсия намешавад.</b><${CompileError} compile=${c.compile} explain=${c.compileExplain} /></div>`;
  if (c.verdict === 'AC') return html`<div class="notice ok"><b>Ҳалли намунавӣ аз ҳамаи ${c.total} мисол ва тест гузашт.</b> Масъаларо нашр кардан мумкин.</div>`;
  return html`<div class="notice bad"><b>Ҳалли намунавӣ аз ${c.mismatches.length} мисол/тест нагузашт</b> (${c.passed}/${c.total} гузашт). Тест ё ҳалро ислоҳ кунед:
    ${c.mismatches.map(m => html`<div class="card" style="margin-top:8px"><b>${m.label}</b> — ${m.status}
      <div class="io3" style="margin-top:6px"><div><div class="kicker">Вуруд</div><pre>${m.input.length > 300 ? m.input.slice(0, 300) + '…' : m.input}</pre></div><div><div class="kicker">Дар тест навишта шуда</div><pre>${m.expected}</pre></div><div><div class="kicker">Ҳалли намунавӣ чоп кард</div><pre>${m.actual || '(ҳеҷ чиз)'}</pre></div></div></div>`)}
  </div>`;
}

function StudentPreview({ d, topic }) {
  return html`<div>
    <h1>${d.title}</h1>
    <div class="row" style="margin:8px 0 14px;gap:6px"><span class="chip">${TOPIC[topic]}</span><span class="chip">${d.level}</span><span class="chip">${d.timeMs / 1000} с · ${d.memoryMb} МБ</span></div>
    <p style="white-space:pre-wrap">${d.statement}</p>
    ${d.input && html`<h3>Вуруд</h3><p>${d.input}</p>`}${d.output && html`<h3>Баромад</h3><p>${d.output}</p>`}${d.constraints && html`<h3>Маҳдудиятҳо</h3><p class="mono">${d.constraints}</p>`}
    <h3>Мисолҳо</h3>${d.examples.map((ex, i) => html`<div class="ex"><b>Мисоли ${i + 1}</b><div class="io3" style="grid-template-columns:1fr 1fr;margin-top:6px"><div><div class="kicker">Вуруд</div><pre>${ex.input}</pre></div><div><div class="kicker">Баромад</div><pre>${ex.output}</pre></div></div>${ex.explain && html`<div class="small muted" style="margin-top:6px">${ex.explain}</div>`}</div>`)}
    <div class="notice info small">Шогирд ${d.tests.filter(t => t.hidden).length} тести пинҳониро намебинад; ҳалли намунавӣ ба шогирд нишон дода намешавад. Ишораҳо як-як кушода мешаванд.</div>
  </div>`;
}

const KINDS = { predict: 'Пешгӯӣ кун', problem: 'Масъала', quiz: 'Санҷиш' };
export function TemplateEditor({ id }) {
  const [{ data, loading, error }, reload] = useLoad(() => Promise.all([api(`/api/templates/${id}`), api('/api/problems'), api('/api/groups')]), [id]);
  const [t, setT] = useState(null); const [err, setErr] = useState(null);
  useEffect(() => { if (data) setT(structuredClone(data[0])); }, [data]);
  if (loading || (data && !t)) return html`<${Loading} />`;
  if (error) return html`<div class="page"><${ErrorBox} error=${error} retry=${reload} /></div>`;
  const [, problems, groups] = data;
  const setStep = (i, f) => setT(x => ({ ...x, steps: x.steps.map((s, j) => j === i ? f(s) : s) }));
  const setP = (i, k, v) => setStep(i, s => ({ ...s, payload: { ...s.payload, [k]: v } }));
  const move = (i, d) => setT(x => { const a = [...x.steps]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, steps: a }; });
  const save = async () => { setErr(null); try { await api(`/api/templates/${id}`, { method: 'PUT', body: { title: t.title, topic: t.topic, steps: t.steps.map(s => ({ ...s, problem_id: s.problem_id || problems.find(p => p.slug === s.problem_slug)?.id })) } }); toast('Қолаб захира шуд.'); reload(); } catch (e) { setErr(e.message); } };
  const copy = async () => { const title = prompt('Номи дарси нав:', 'Даврҳо дар C++'); if (!title) return; const r = await api(`/api/templates/${id}/copy`, { method: 'POST', body: { title } }); location.hash = '#/template/' + r.id; };
  const pidOf = s => s.problem_id || problems.find(p => p.slug === s.problem_slug)?.id || '';
  return html`<div class="page" style="max-width:980px">
    <a href="#/" class="small">← Асосӣ</a>
    <div class="row" style="margin:6px 0 14px"><h1>Қолаби дарс</h1><div class="spacer"></div><button class="btn" onClick=${copy}>Нусха бардор (масалан, «Даврҳо»)</button><button class="btn p" onClick=${save}>Захира кун</button></div>
    ${err && html`<div class="notice bad" style="margin-bottom:12px">${err}</div>`}
    <div class="row"><label class="f" style="flex:2">Номи дарс<input class="i" value=${t.title} onInput=${e => setT({ ...t, title: e.target.value })} /></label>
      <label class="f" style="flex:1">Мавзӯъ<select class="i" value=${t.topic} onChange=${e => setT({ ...t, topic: e.target.value })}>${TOPIC_KEYS.map(k => html`<option value=${k}>${TOPIC[k]}</option>`)}</select></label></div>
    ${t.steps.map((s, i) => html`<div class="card" style="margin-top:12px">
      <div class="row"><b>${i + 1}.</b><select class="i" style="width:auto" value=${s.kind} onChange=${e => setStep(i, x => ({ ...x, kind: e.target.value, payload: e.target.value === 'quiz' ? { question: '', options: ['', ''], correct: 0 } : e.target.value === 'predict' ? { question: '', code: '', input: '' } : {} }))}>${Object.entries(KINDS).map(([k, v]) => html`<option value=${k}>${v}</option>`)}</select>
        <input class="i" style="flex:1" value=${s.title} onInput=${e => setStep(i, x => ({ ...x, title: e.target.value }))} aria-label="Номи қадам" />
        <button class="btn sm icon-btn" onClick=${() => move(i, -1)} aria-label="Боло">↑</button><button class="btn sm icon-btn" onClick=${() => move(i, 1)} aria-label="Поён">↓</button>
        <button class="btn sm danger" onClick=${() => setT({ ...t, steps: t.steps.filter((_, j) => j !== i) })}>Нест кун</button></div>
      ${s.kind === 'problem' && html`<div class="row" style="margin-top:10px"><label class="f" style="flex:1">Масъала<select class="i" value=${pidOf(s)} onChange=${e => setStep(i, x => ({ ...x, problem_id: Number(e.target.value), problem_slug: undefined }))}><option value="">— интихоб кунед —</option>${problems.filter(p => p.version > 0).map(p => html`<option value=${p.id}>${TOPIC[p.topic]} · ${p.title}${p.lessonOnly ? ' (дарсӣ)' : ''}</option>`)}</select></label>
        <label style="margin-top:22px"><input type="checkbox" checked=${s.payload?.mode === 'fix'} onChange=${e => setP(i, 'mode', e.target.checked ? 'fix' : undefined)} /> «Хаторо ёб»</label></div>`}
      ${s.kind === 'predict' && html`<div class="col" style="margin-top:10px"><label class="f">Савол<input class="i" value=${s.payload.question} onInput=${e => setP(i, 'question', e.target.value)} /></label>
        <label class="f">Код (воқеан иҷро мешавад; натиҷа паҳлуи пешгӯӣ нишон дода мешавад)<textarea class="i mono" rows="8" value=${s.payload.code} onInput=${e => setP(i, 'code', e.target.value)}></textarea></label>
        <label class="f">Вуруд<input class="i mono" value=${s.payload.input} onInput=${e => setP(i, 'input', e.target.value)} /></label></div>`}
      ${s.kind === 'quiz' && html`<div class="col" style="margin-top:10px"><label class="f">Савол<input class="i" value=${s.payload.question} onInput=${e => setP(i, 'question', e.target.value)} /></label>
        ${s.payload.options.map((o, j) => html`<div class="row"><input type="radio" name=${'c' + i} checked=${s.payload.correct === j} onChange=${() => setP(i, 'correct', j)} aria-label="Ҷавоби дуруст" /><input class="i" style="flex:1" value=${o} onInput=${e => setP(i, 'options', s.payload.options.map((x, k) => k === j ? e.target.value : x))} /><button class="btn sm" onClick=${() => setP(i, 'options', s.payload.options.filter((_, k) => k !== j))}>✕</button></div>`)}
        <div><button class="btn sm" onClick=${() => setP(i, 'options', [...s.payload.options, ''])}>+ Ҷавоб</button></div>
        <label class="f">Шарҳ пас аз ҷавоб<input class="i" value=${s.payload.explain || ''} onInput=${e => setP(i, 'explain', e.target.value)} /></label></div>`}
    </div>`)}
    <div class="row" style="margin-top:12px">${Object.entries(KINDS).map(([k, v]) => html`<button class="btn" onClick=${() => setT({ ...t, steps: [...t.steps, { kind: k, title: v, payload: k === 'quiz' ? { question: '', options: ['', ''], correct: 0 } : k === 'predict' ? { question: '', code: '', input: '' } : {} }] })}>+ ${v}</button>`)}</div>
    <p class="small muted" style="margin-top:14px">Барои додан ба гурӯҳ: дар саҳифаи асосӣ «Ба гурӯҳ деҳ» ё дар ҷадвали дарсҳои гурӯҳ «Қолаб гузор». ${groups.length} гурӯҳ дастрас аст.</p>
  </div>`;
}
