// Downloads the published model catalog into site/public/models so the site runs locally with
// every model. Files are verified against the sha256 in models.json; unchanged files are skipped.
// Usage: node site/scripts/fetch-models.mjs [baseUrl]   (default https://tevy.dev)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const base = (process.argv[2] ?? 'https://tevy.dev').replace(/\/$/, '');
const publicDir = resolve(import.meta.dirname, '..', 'public');

async function get(path) {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function save(path, data) {
  const target = join(publicDir, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

const index = JSON.parse((await get('/models.json')).toString('utf8'));
let downloaded = 0;
for (const model of index.models) {
  for (const file of model.files) {
    const local = join(publicDir, file.path);
    if (existsSync(local) && sha256(readFileSync(local)) === file.sha256) continue;
    const data = await get(file.path);
    if (sha256(data) !== file.sha256) throw new Error(`${file.path}: sha256 mismatch`);
    save(file.path, data);
    downloaded++;
  }
  save(model.preview, await get(model.preview));
  save(`/models/${model.slug}/model.json`, JSON.stringify(model, null, 2) + '\n');
  console.log(`${model.slug} r${model.revision}`);
}
console.log(`${index.models.length} models, ${downloaded} files downloaded`);
