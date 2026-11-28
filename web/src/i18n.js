// Се забон: тоҷикӣ (асосӣ), русӣ, англисӣ.
// Матнҳои тоҷикӣ дар саҳифа худкор тарҷума мешаванд (MutationObserver): калимаҳои интерфейс, тугмаҳо,
// паёмҳои сервер. Код, шарти масъала ва номи шогирдон тарҷума намешаванд.
import { DICT } from './i18n-dict.js';

export const LANGS = [['tg', 'ТҶ', 'Тоҷикӣ'], ['ru', 'RU', 'Русский'], ['en', 'EN', 'English']];
let lang = 'tg';
try { lang = localStorage.getItem('lang') || 'tg'; } catch {}
if (!LANGS.some(l => l[0] === lang)) lang = 'tg';
export const getLang = () => lang;

const norm = s => s.replace(/\s+/g, ' ').trim();
const exact = { ru: new Map(), en: new Map() };
const scoped = { ru: [], en: [] };
for (const [tg, ru, en, scope] of DICT) {
  const k = norm(tg);
  if (scope) { scoped.ru.push([k, ru, scope]); scoped.en.push([k, en, scope]); continue; }
  if (!exact.ru.has(k)) { exact.ru.set(k, ru); exact.en.set(k, en); }
}
// Ибораҳои дароз дар дохили матни калонтар (масалан, паёме бо рақам дар мобайн)
const parts = {};
function partsFor(l) {
  if (parts[l]) return parts[l];
  const keys = [...exact[l].keys()].filter(k => k.length >= 6).sort((a, b) => b.length - a.length);
  const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  parts[l] = keys.length ? new RegExp(`(?<![\\p{L}])(?:${keys.map(esc).join('|')})(?![\\p{L}])`, 'gu') : null;
  return parts[l];
}
const CYR = /[А-Яа-яЁёӢӣӮӯҲҳҶҷҚқҒғ]/;
// Қолабҳо барои матнҳо бо рақам (Ҳ1 · Рӯзи 2 ва ғ.)
const T = (w, ru, en) => lang === 'ru' ? ru : en;
const PATTERNS = [
  [/^Ҳ(\d+) · Рӯзи (\d+)$/, m => T(0, `Н${m[1]} · День ${m[2]}`, `W${m[1]} · Day ${m[2]}`)],
  [/^Ҳ(\d+) · Имтиҳон$/, m => T(0, `Н${m[1]} · Экзамен`, `W${m[1]} · Exam`)],
  [/^Ҳ(\d+)$/, m => T(0, `Н${m[1]}`, `W${m[1]}`)],
  [/^Ҳ$/, () => T(0, 'Н', 'W')],
  [/^· Рӯзи$/, () => T(0, '· День', '· Day')],
  [/^Рӯзи (\d+)$/, m => T(0, `День ${m[1]}`, `Day ${m[1]}`)],
  [/^Ҳафтаи (\d+)$/, m => T(0, `Неделя ${m[1]}`, `Week ${m[1]}`)],
  [/^Имтиҳони ҳафтаи (\d+)$/, m => T(0, `Экзамен недели ${m[1]}`, `Week ${m[1]} exam`)],
  [/^(\d+) · (\d+)\/(\d+) ҳал$/, m => T(0, `${m[1]} · ${m[2]}/${m[3]} решено`, `${m[1]} · ${m[2]}/${m[3]} solved`)],
  [/^Синфӣ \((\d+)\/(\d+)\)$/, m => T(0, `Классные (${m[1]}/${m[2]})`, `Class (${m[1]}/${m[2]})`)],
  [/^Хонагӣ \((\d+)\/(\d+)\)$/, m => T(0, `Домашние (${m[1]}/${m[2]})`, `Homework (${m[1]}/${m[2]})`)],
  [/^Иловагӣ \((\d+)\/(\d+)\)$/, m => T(0, `Доп. (${m[1]}/${m[2]})`, `Extra (${m[1]}/${m[2]})`)],
  [/^(\d+) шогирд$/, m => T(0, `${m[1]} учеников`, `${m[1]} students`)],
  [/^(\d+) аз (\d+) ҳал шуд$/, m => T(0, `${m[1]} из ${m[2]} решено`, `${m[1]} of ${m[2]} solved`)],
  [/^Дар мавзӯи «(.+)» (\d+) аз (\d+) масъала ҳал шуд — ин масъалаи навбатии ҳамин мавзӯъ аст\.$/,
    m => T(0, `В теме «${tr(m[1])}» решено ${m[2]} из ${m[3]} задач — это следующая задача этой темы.`, `In “${tr(m[1])}” ${m[2]} of ${m[3]} problems are solved — this is the next problem of the topic.`)],
];
export function tr(text, el) {
  if (lang === 'tg' || !text || !CYR.test(text)) return text;
  const k = norm(text);
  for (const [rx, f] of PATTERNS) { const m = k.match(rx); if (m) return keep(text, f(m)); }
  for (const [sk, v, scope] of scoped[lang]) if (sk === k && el?.closest?.(scope)) return keep(text, v);
  if (exact[lang].has(k)) return keep(text, exact[lang].get(k));
  // Ҷойгузинкунии қисмӣ: танҳо агар қисми зиёди матн шинохта шавад (номи масъала ва шогирд дахл намешаванд)
  const rx = partsFor(lang); if (!rx) return text;
  let hit = 0;
  const out = k.replace(rx, m => { hit += m.length; return exact[lang].get(m); });
  const cyr = (k.match(/[А-Яа-яЁёӢӣӮӯҲҳҶҷҚқҒғ]/g) || []).length;
  return hit && hit >= cyr * 0.5 ? keep(text, out) : text;
}
const keep = (orig, v) => (orig.match(/^\s*/)[0]) + v + (orig.match(/\s*$/)[0]);

const SKIP = 'script, style, pre, code, textarea, .cm-editor, .codeview, [data-noi18n], .stmt, .io-desc p, .sample-pre, .sample-why, .ttl, .setitem .t';
const orig = new WeakMap();          // гиреҳ → матни аслии тоҷикӣ
const mine = new WeakMap();          // гиреҳ → матне, ки мо гузоштем
const ATTRS = ['placeholder', 'title', 'aria-label'];
function doText(n) {
  const p = n.parentElement; if (!p || p.closest(SKIP)) return;
  const cur = n.data;
  if (mine.get(n) === cur) return;               // худамон гузоштем
  orig.set(n, cur);
  const v = tr(cur, p);
  if (v !== cur) { mine.set(n, v); n.data = v; } else mine.delete(n);
}
function doAttrs(el) {
  if (el.closest(SKIP)) return;
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const key = 'i18n' + a, cur = el.getAttribute(a);
    if (el[key + 'Out'] === cur) continue;
    el[key] = cur;
    const v = tr(cur, el);
    if (v !== cur) { el[key + 'Out'] = v; el.setAttribute(a, v); }
  }
}
function walk(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1) return;
  doAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) n.nodeType === 3 ? doText(n) : doAttrs(n);
}
let obs;
export function startI18n() {
  document.documentElement.lang = lang === 'tg' ? 'tg' : lang;
  if (lang === 'tg' || obs) return;
  walk(document.body);
  obs = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  // Равзанаҳои confirm/prompt/alert ҳам
  for (const f of ['confirm', 'prompt', 'alert']) { const o = window[f].bind(window); window[f] = (msg, ...r) => o(tr(String(msg ?? '')), ...r); }
}
export function setLang(l) {
  try { localStorage.setItem('lang', l); } catch {}
  location.reload();   // соддатарин ва бехатартарин роҳ: ҳамаи матнҳо аз нав
}
