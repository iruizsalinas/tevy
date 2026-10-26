// The generated text files: /<kind>.json, /llms.txt (llmstxt.org format), /sitemap.xml, /robots.txt.
import { KINDS, itemUrl, type Item, type Kind } from '#lib/catalog';
import { SITE_URL, TRANSCODER_URL, categoryLabel, formatBytes, formatDimensions, lod0, type Model } from '#lib/models';
import { formatLabel, mainFile, type Sky } from '#lib/skies';
import { materialSets, setLabel, type Material } from '#lib/materials';
import { generatedAt, published } from '#lib/server/catalog';

/**
 * /models.json, /skies.json, /materials.json: the latest version of every item, sorted by slug. The version history
 * stays in each item's own file, so the index grows with the catalog, not with every release.
 */
export function indexJson(kind: Kind, items: Item[]): string {
  const entries = items.map((item) => {
    const { schema: _, versions: __, ...latest } = published(item);
    return latest;
  });
  return JSON.stringify({ schema: 1, site: SITE_URL, generated: generatedAt(items), count: items.length, [kind]: entries });
}

function modelLine(m: Model): string {
  const f = lod0(m);
  const facts = [
    categoryLabel(m.category).toLowerCase(),
    formatDimensions(m.dimensions),
    `LOD0 ${f.triangles.toLocaleString('en-US')} triangles, ${formatBytes(f.bytes)}`,
    `${m.files.length} LOD${m.files.length === 1 ? '' : 's'}`,
    m.parts?.length ? `moving parts ${m.parts.join(', ')}` : '',
    m.animations?.length ? `animations ${m.animations.map((a) => a.name).join(', ')}` : '',
    m.wind ? 'wind data' : '',
    `version ${m.version}`,
  ].filter(Boolean);
  return `- [${m.name}](${SITE_URL}/models/${m.slug}.json): ${facts.join(', ')}. ${m.description}`;
}

function skyLine(s: Sky): string {
  const f = mainFile(s);
  const facts = [
    `${f.width}x${f.height} ${formatLabel(f.format)}, ${formatBytes(f.bytes)}`,
    s.sun ? `sun elevation ${s.sun.elevation}°` : '',
    `version ${s.version}`,
  ].filter(Boolean);
  return `- [${s.name}](${SITE_URL}/skies/${s.slug}.json): ${facts.join(', ')}. ${s.description}`;
}

function materialLine(m: Material): string {
  const sizes = materialSets(m.files).map((s) => `${setLabel(s.width)} ${formatBytes(s.bytes)}`);
  const facts = [`tile ${m.tileSize} m`, `color, normal and ORM maps (${sizes.join(', ')})`, `version ${m.version}`];
  return `- [${m.name}](${SITE_URL}/materials/${m.slug}.json): ${facts.join(', ')}. ${m.description}`;
}

export function llmsTxt(all: Record<Kind, Item[]>): string {
  const models = all.models as Model[];
  const skies = all.skies as Sky[];
  const materials = all.materials as Material[];
  return `# tevy

> Free, browser-sized assets for three.js and any glTF engine: 3D models (cars, trees, plants, rocks, buildings, road props), HDR sky panoramas and seamless PBR ground materials. Everything is CC0 1.0: public domain, free for commercial use, no attribution required.

## Download

- Every file is a plain HTTPS GET: no account and no API key. CORS is open, so browsers can load files straight from ${SITE_URL}.
- The site has one section per kind of asset, all with the same shape: ${KINDS.map((k) => `/${k.kind}`).join(', ')}. Each item has a page at /<section>/<slug>, a metadata file next to it, and the section has an index at /<section>.json.
- Versions: a published file never changes. An improved item gets a new version in a new folder (v2, v3, ...) and older versions stay online, so a site that loads v1 keeps getting the same file. The latest version of every file is also served without the version folder (/models/<slug>/lod0.glb, /skies/<slug>/2k.jpg, /materials/<slug>/color-2k.ktx2, and /<section>/<slug>/preview.webp for the preview image); it changes when a new version ships, so pin the versioned URL for anything you ship. \`version\` in the metadata is the latest; \`versions\` lists every version, newest first, with its date, a note on what changed, and its files.
- Slugs are permanent identifiers within a section. Categories may change and are not part of any URL.

## Models

GLB files with meshopt-compressed geometry (EXT_meshopt_compression) and KTX2 textures (KHR_texture_basisu), each with several levels of detail.

- Metadata: ${SITE_URL}/models/<slug>.json lists the files with LOD, byte size, triangle count and sha256.
- Files: ${SITE_URL}/models/<slug>/v<version>/lod0.glb is full detail; lod1.glb and up have fewer triangles.
- Units are meters, +Y is up, and the front of a model faces +Z. \`dimensions\` is the bounding box size in meters.
- What moves is in the metadata: \`parts\` (moving nodes), \`animations\` (clips with their length in seconds) and \`wind\` (true when the meshes carry wind data). See Moving parts, animation and wind below.
- Materials are glTF PBR; car paint uses clearcoat and glass uses transmission.

\`\`\`js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ktx2 = new KTX2Loader()
  .setTranscoderPath('${TRANSCODER_URL}')
  .detectSupport(renderer);
const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('${SITE_URL}/models/<slug>/v1/lod0.glb');
scene.add(gltf.scene);
\`\`\`

Other engines need the same two glTF extensions: meshopt decoding and KTX2 (Basis Universal) transcoding.

## Moving parts, animation and wind

- Moving parts: separate nodes with their origin at the pivot and stable names listed in \`parts\`, such as wheel_FL, wheel_FR, wheel_RL, wheel_RR (front/rear, left/right; a model's left is +X) and steering_wheel. Wheels spin around the car's X axis (the axle) and the front wheels steer around Y. Wheels on one side are turned 180 degrees to face out, so rotate each wheel from its rest quaternion: \`wheel.quaternion.copy(steerQ).multiply(spinQ).multiply(rest)\`. Small parts such as steering_wheel may be missing from LOD1 and up.
- People: skinned meshes on a shared 55-joint skeleton (stable joint names such as hips, head, hand_L, hand_R), clips \`idle\`, \`walk\`, \`wave\` and \`look_around\` in the same file and in every LOD. Play them with AnimationMixer; clone extra copies with SkeletonUtils.clone. The walk is made for 1.3 m/s: move the person forward (+Z) at that speed while it plays.
- Wind: trees and plants carry the vertex attribute _WIND (GLTFLoader exposes it as geometry.attributes._wind): r = sway weight (0 at the trunk base, 1 at the tips), g = phase 0-1, b = leaf flutter weight. Add the offset in the vertex shader, for example with material.onBeforeCompile after \`#include <begin_vertex>\`: \`transformed.x += _wind.r * 0.12 * sin(time * 1.4 + _wind.g * 6.2832);\`

## Skies

Equirectangular HDR panoramas, +Y up, usable as scene background and as image-based lighting. The sun is part of the image.

- Metadata: ${SITE_URL}/skies/<slug>.json lists the files (role \`environment\`: full size for background and lighting; \`lighting\`: smaller, for lighting only), the sun direction and a suggested tone mapping exposure.
- Files are Ultra HDR JPEGs (an 8-bit JPEG with an HDR gain map): ${SITE_URL}/skies/<slug>/v<version>/2k.jpg and 1k.jpg.

\`\`\`js
import { EquirectangularReflectionMapping } from 'three';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';

const sky = await new UltraHDRLoader().loadAsync('${SITE_URL}/skies/<slug>/v1/2k.jpg');
sky.mapping = EquirectangularReflectionMapping;
scene.background = sky;
scene.environment = sky;
\`\`\`

## Materials

Seamless PBR texture sets for large surfaces (roads, verges, forest floor), as KTX2 (Basis Universal) textures with mipmaps that tile.

- Metadata: ${SITE_URL}/materials/<slug>.json lists the files with map, size, codec and sha256, and \`tileSize\`: the meters covered by one repeat.
- Files: ${SITE_URL}/materials/<slug>/v<version>/color-2k.ktx2 (sRGB base color), normal-2k.ktx2 (OpenGL convention, as three.js expects) and orm-2k.ktx2 (glTF packing: occlusion in R, roughness in G, metalness in B). The same three maps exist at 1K (color-1k.ktx2, ...).

\`\`\`js
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';

// ktx2: the KTX2Loader set up for the models
const [color, normal, orm] = await Promise.all(
  ['color', 'normal', 'orm'].map((map) => ktx2.loadAsync(\`${SITE_URL}/materials/<slug>/v1/\${map}-2k.ktx2\`)),
);
color.colorSpace = SRGBColorSpace;
for (const t of [color, normal, orm]) {
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(width / tileSize, depth / tileSize); // plane size in meters
}
const material = new MeshStandardMaterial({ map: color, normalMap: normal, aoMap: orm, roughnessMap: orm, metalnessMap: orm });
\`\`\`

## Index

- [Featured](${SITE_URL}/): a selection from every section
${KINDS.map((k) => `- [${k.label}](${SITE_URL}/${k.kind}): the catalog, searchable with ?search=<words> and ?category=<category>\n- [${k.kind}.json](${SITE_URL}/${k.kind}.json): the latest version of every ${k.singular} in one file, sorted by slug; version history in each item's own .json`).join('\n')}
- [Docs](${SITE_URL}/docs): loading in three.js and other engines, and pinned versus latest versions
- [License](${SITE_URL}/license): what CC0 1.0 allows

## Model list

${models.map(modelLine).join('\n')}

## Sky list

${skies.length ? skies.map(skyLine).join('\n') : 'No skies are published yet.'}

## Material list

${materials.length ? materials.map(materialLine).join('\n') : 'No materials are published yet.'}
`;
}

export function sitemapXml(all: Record<Kind, Item[]>): string {
  const items = KINDS.flatMap((k) => all[k.kind]);
  const urls = [
    `  <url><loc>${SITE_URL}/</loc></url>`,
    ...KINDS.filter((k) => all[k.kind].length).map((k) => `  <url><loc>${SITE_URL}/${k.kind}</loc></url>`),
    `  <url><loc>${SITE_URL}/docs</loc></url>`,
    `  <url><loc>${SITE_URL}/license</loc></url>`,
    ...items.map((m) => `  <url><loc>${SITE_URL}${itemUrl(m)}</loc>${m.updated ? `<lastmod>${m.updated}</lastmod>` : ''}</url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
