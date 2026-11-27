import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { html, useEffect, useRef } from './lib.js';

export function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
}
const lightTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--panel)', color: 'var(--text)' },
  '.cm-gutters': { backgroundColor: 'var(--panel2)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(12,130,119,.06)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(12,130,119,.12)' },
}, { dark: false });
const base = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
  '.cm-content': { paddingBottom: '40px' },
});

/** Муҳаррири C++ (CodeMirror 6). onReady(view) барои амалҳои беруна (ҷустуҷӯ, гузариш ба сатр). */
export function CodeEditor({ value, onChange, fontSize = 15, readOnly = false, onReady, label = 'Муҳаррири коди C++' }) {
  const host = useRef(), view = useRef(), cb = useRef(onChange);
  cb.current = onChange;
  const themeC = useRef(new Compartment()), sizeC = useRef(new Compartment()), roC = useRef(new Compartment());
  useEffect(() => {
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup, cpp(), keymap.of([indentWithTab]), base,
          themeC.current.of(isDark() ? oneDark : lightTheme),
          sizeC.current.of(EditorView.theme({ '&': { fontSize: fontSize + 'px' } })),
          roC.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.updateListener.of(u => { if (u.docChanged) cb.current?.(u.state.doc.toString()); }),
          EditorView.contentAttributes.of({ 'aria-label': label }),
        ],
      }),
    });
    view.current = v; onReady?.(v);
    if (!readOnly) window.__editor = v; // барои санҷишҳои худкор
    const mo = new MutationObserver(() => v.dispatch({ effects: themeC.current.reconfigure(isDark() ? oneDark : lightTheme) }));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mo.disconnect(); if (window.__editor === v) window.__editor = null; v.destroy(); };
  }, []);
  useEffect(() => { view.current?.dispatch({ effects: sizeC.current.reconfigure(EditorView.theme({ '&': { fontSize: fontSize + 'px' } })) }); }, [fontSize]);
  useEffect(() => {
    const v = view.current; if (!v) return;
    if (value !== v.state.doc.toString()) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);
  return html`<div ref=${host} style="height:100%"></div>`;
}
export function search(view) { if (view) { view.focus(); openSearchPanel(view); } }
export function gotoLine(view, n) {
  if (!view) return;
  const line = view.state.doc.line(Math.min(Math.max(1, n), view.state.doc.lines));
  view.dispatch({ selection: { anchor: line.from, head: line.to }, scrollIntoView: true }); view.focus();
}
