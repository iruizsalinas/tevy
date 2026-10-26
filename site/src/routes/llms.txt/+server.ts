// /llms.txt in the llmstxt.org format: what tevy is, how to fetch and load models, and an index.
import { SITE_URL, TRANSCODER_URL, categoryLabel, formatBytes, formatDimensions, lod0, type Model } from '#lib/models';
import { readModels } from '#lib/server/models';

export const prerender = true;
export const trailingSlash = 'never';

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

export function GET() {
  const models = readModels();
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
- [Catalog](${SITE_URL}/): the website, with an interactive 3D viewer per model

## Models

${models.map(modelLine).join('\n')}
`;
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
