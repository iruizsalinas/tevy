// Builds the site into dist/: the client bundle under /assets/, site/public as is, then every
// prerendered page and generated file from site/src/render.ts.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { shell } from './shell.js';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'dist');
const SERVER = join(ROOT, 'build', 'server');

await build({ root: ROOT });
await build({ root: ROOT, build: { ssr: 'site/src/render.ts', outDir: SERVER, emptyOutDir: true, copyPublicDir: false } });

const manifest = JSON.parse(readFileSync(join(OUT, '.vite', 'manifest.json'), 'utf8'));
rmSync(join(OUT, '.vite'), { recursive: true });

/** Preload, style and script tags for a client entry and the chunks it imports. */
function tags(entry) {
  const scripts = [];
  const styles = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || scripts.includes(chunk.file)) return;
    scripts.push(chunk.file);
    // Shared chunks' styles first, so page styles come last in the cascade.
    for (const imported of chunk.imports ?? []) visit(imported);
    for (const css of chunk.css ?? []) styles.add(css);
  };
  visit(`site/src/client/${entry}.ts`);
  // Fonts are only referenced from the CSS; preload them so text does not swap fonts after first paint.
  const fonts = new Set();
  for (const css of styles) {
    for (const [url] of readFileSync(join(OUT, css), 'utf8').matchAll(/\/assets\/[^)"'\s]+\.woff2/g)) fonts.add(url);
  }
  const [main, ...chunks] = scripts;
  return [
    ...[...fonts].map((url) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`),
    ...[...styles].map((file) => `<link rel="stylesheet" href="/${file}">`),
    ...chunks.map((file) => `<link rel="modulepreload" href="/${file}">`),
    `<script type="module" src="/${main}"></script>`,
  ].join('\n    ');
}

const { outputs, verify } = await import(pathToFileURL(join(SERVER, 'render.js')).href);
verify();
let count = 0;
const redirects = [];
for (const out of outputs()) {
  if (out.redirect) {
    redirects.push(`${out.path} ${out.redirect} 302`);
    continue;
  }
  const file = join(OUT, out.file);
  mkdirSync(dirname(file), { recursive: true });
  if (out.copy) copyFileSync(join(ROOT, 'site', 'public', out.copy), file);
  else if (out.text !== undefined) writeFileSync(file, out.text);
  else {
    const page = out.page();
    writeFileSync(file, shell(page, tags(page.entry)));
  }
  count++;
}
if (redirects.length) writeFileSync(join(OUT, '_redirects'), redirects.map((r) => `${r}\n`).join(''));
console.log(`prerendered ${count} files into dist/`);
