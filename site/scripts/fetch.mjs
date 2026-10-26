// Downloads the published catalog of every section into site/public/<section> so the site runs
// locally with every item. Files are verified against the sha256 in the section index; unchanged
// files are skipped.
// Usage: node site/scripts/fetch.mjs [baseUrl]   (default https://tevy.dev)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const base = (process.argv[2] ?? 'https://tevy.dev').replace(/\/$/, '');
const publicDir = resolve(import.meta.dirname, '..', 'public');
const SECTIONS = ['models', 'skies'];

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

for (const kind of SECTIONS) {
  const res = await fetch(`${base}/${kind}.json`);
  if (res.status === 404) {
    console.log(`${kind}: not published`);
    continue;
  }
  if (!res.ok) throw new Error(`/${kind}.json: HTTP ${res.status}`);
  const items = (await res.json())[kind];
  let downloaded = 0;
  for (const item of items) {
    // Every version, so a deploy from this checkout keeps serving the older ones.
    for (const file of item.versions.flatMap((v) => v.files)) {
      const local = join(publicDir, file.path);
      if (existsSync(local) && sha256(readFileSync(local)) === file.sha256) continue;
      const data = await get(file.path);
      if (sha256(data) !== file.sha256) throw new Error(`${file.path}: sha256 mismatch`);
      save(file.path, data);
      downloaded++;
    }
    save(item.preview, await get(item.preview));
    save(`/${kind}/${item.slug}.json`, JSON.stringify(item, null, 2) + '\n');
    console.log(`${kind}/${item.slug} v${item.version}`);
  }
  console.log(`${items.length} ${kind}, ${downloaded} files downloaded`);
}
