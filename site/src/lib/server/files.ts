// The generated text files: /models.json, /llms.txt (llmstxt.org format), /sitemap.xml, /robots.txt.
import { SITE_URL, TRANSCODER_URL, categoryLabel, formatBytes, formatDimensions, lod0, modelUrl, type Model } from '#lib/models';
import { generatedAt } from '#lib/server/models';

export function modelsJson(models: Model[]): string {
  return JSON.stringify({ schema: 1, site: SITE_URL, generated: generatedAt(models), count: models.length, models });
}

function modelLine(m: Model): string {
  const f = lod0(m);
  const facts = [
    categoryLabel(m.category).toLowerCase(),
    formatDimensions(m.dimensions),
    `LOD0 ${f.triangles.toLocaleString('en-US')} triangles, ${formatBytes(f.bytes)}`,
    `${m.files.length} LOD${m.files.length === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return `- [${m.name}](${SITE_URL}/models/${m.slug}/model.json): ${facts.join(', ')}. ${m.description}`;
}

export function llmsTxt(models: Model[]): string {
  const text = `# tevy

> Free, browser-sized 3D models (cars, trees, rocks, props) as compact glTF binary files for three.js and any glTF engine. Every model is CC0 1.0: public domain, free for commercial use, no attribution required.

Models are GLB files with meshopt-compressed geometry (EXT_meshopt_compression) and KTX2 textures (KHR_texture_basisu), each with several levels of detail.

## Download

- Every file is a plain HTTPS GET: no account and no API key. CORS is open, so browsers can load files straight from ${SITE_URL}.
- Each model has a metadata file at ${SITE_URL}/models/<slug>/model.json listing its files with LOD, byte size, triangle count and sha256.
- File URLs: ${SITE_URL}/models/<slug>/<slug>_lod0.glb is full detail; <slug>_lod1.glb and up have fewer triangles.
- Slugs are permanent identifiers. Categories may change and are not part of any URL.

## Load in three.js

\`\`\`js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ktx2 = new KTX2Loader()
  .setTranscoderPath('${TRANSCODER_URL}')
  .detectSupport(renderer);
const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('${SITE_URL}/models/<slug>/<slug>_lod0.glb');
scene.add(gltf.scene);
\`\`\`

Other engines need the same two glTF extensions: meshopt decoding and KTX2 (Basis Universal) transcoding.

## Conventions

- Units are meters, +Y is up, and the front of a model faces +Z.
- \`dimensions\` in model.json is the bounding box size in meters (x, y, z).
- \`parts\` in model.json lists named nodes. Moving pieces (wheels, doors, steering wheels) are separate nodes with their origin at the pivot and stable names such as wheel_FL, wheel_FR, wheel_RL and wheel_RR.
- Materials are glTF PBR; car paint uses clearcoat and glass uses transmission.

## Index

- [models.json](${SITE_URL}/models.json): every model.json in one file, sorted by slug
- [model.json](${SITE_URL}/models/<slug>/model.json): metadata of one model
- [Catalog](${SITE_URL}/models): the website, searchable with ?search=<words> and ?category=<category>, with an interactive 3D viewer per model
- [License](${SITE_URL}/license): what CC0 1.0 allows

## Models

${models.map(modelLine).join('\n')}
`;
  return text;
}

export function sitemapXml(models: Model[]): string {
  const urls = [
    `  <url><loc>${SITE_URL}/</loc></url>`,
    `  <url><loc>${SITE_URL}/models</loc></url>`,
    `  <url><loc>${SITE_URL}/license</loc></url>`,
    ...models.map(
      (m) => `  <url><loc>${SITE_URL}${modelUrl(m)}</loc>${m.updated ? `<lastmod>${m.updated}</lastmod>` : ''}</url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
