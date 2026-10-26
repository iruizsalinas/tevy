// Serves the three.js Basis Universal transcoder at /basis/ by copying it into the static
// directory (site/public/basis/, not committed) before dev and build.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const SOURCE = dirname(require.resolve('three/examples/jsm/libs/basis/basis_transcoder.js'));
const TARGET = resolve(import.meta.dirname, 'public/basis');
const FILES = ['basis_transcoder.js', 'basis_transcoder.wasm'];

function copy() {
  mkdirSync(TARGET, { recursive: true });
  for (const file of FILES) {
    const from = join(SOURCE, file);
    const to = join(TARGET, file);
    if (!existsSync(to) || !readFileSync(to).equals(readFileSync(from))) copyFileSync(from, to);
  }
}

export function basisTranscoder() {
  return {
    name: 'tevy-basis-transcoder',
    config() {
      copy();
    },
    // KTX2Loader also references a default transcoder through import.meta.url, which makes the
    // bundler emit a second hashed copy. The viewer always uses /basis/, so drop that reference.
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('/three/examples/jsm/loaders/KTX2Loader.js')) return null;
      return code.replace(/new URL\(\s*'\.\.\/libs\/basis\/basis_transcoder\.(?:wasm|js)',\s*import\.meta\.url\s*\)\.toString\(\)/g, "''");
    },
  };
}
