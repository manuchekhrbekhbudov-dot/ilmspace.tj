// Сохтани frontend: esbuild + шрифтҳои маҳаллӣ (бе CDN — дар синф интернет суст бошад ҳам кор мекунад)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'web', 'public');
fs.mkdirSync(path.join(pub, 'fonts'), { recursive: true });

let css = '';
for (const [pkg, weights] of [['inter', [400, 600, 700]], ['jetbrains-mono', [400]]]) {
  const dir = path.join(root, 'node_modules', '@fontsource', pkg);
  for (const w of weights) {
    let c = fs.readFileSync(path.join(dir, `${w}.css`), 'utf8');
    // танҳо кириллӣ ва лотинӣ
    c = c.split('/*').filter(b => /cyrillic-ext|cyrillic|latin-ext|latin/.test(b.split('*/')[0]) && !/vietnamese|greek/.test(b.split('*/')[0])).map(b => '/*' + b).join('');
    c = c.replace(/url\(\.\/files\/([^)]+)\)/g, (_, f) => { fs.copyFileSync(path.join(dir, 'files', f), path.join(pub, 'fonts', f)); return `url(./fonts/${f})`; });
    css += c;
  }
}
fs.writeFileSync(path.join(pub, 'fonts.css'), css);

const watch = process.argv.includes('--watch');
const ctx = await esbuild.context({
  entryPoints: [path.join(root, 'web', 'src', 'main.js')],
  bundle: true, minify: !watch, sourcemap: watch, format: 'esm', target: 'es2020',
  outfile: path.join(pub, 'app.js'), logLevel: 'info',
});
if (watch) await ctx.watch(); else { await ctx.rebuild(); await ctx.dispose(); }
