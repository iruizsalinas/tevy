// Model metadata types and pure helpers shared by pages, endpoints and the viewer.

export const SITE_URL = 'https://tevy.dev';
/** The three.js release the site is built and tested against. */
export const THREE_VERSION = '0.186.1';
export const TRANSCODER_URL = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/libs/basis/`;
export const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';

export interface ModelFile {
  lod: number;
  /** Site-absolute path, e.g. /models/<slug>/v1/lod0.glb */
  path: string;
  bytes: number;
  sha256?: string;
  triangles: number;
}

/** One published version of a model. Its files never change once published. */
export interface ModelVersion {
  version: number;
  date: string;
  changes: string;
  files: ModelFile[];
}

/** The content of /models/<slug>/model.json (schema 2). */
export interface Model {
  schema: number;
  slug: string;
  name: string;
  category: string;
  tags?: string[];
  description: string;
  license: string;
  /** The latest version; `files` are its files. */
  version: number;
  changes: string;
  created?: string;
  updated?: string;
  units?: string;
  up?: string;
  forward?: string;
  dimensions?: { x: number; y: number; z: number };
  parts?: string[];
  preview: string;
  files: ModelFile[];
  /** Every version, newest first. */
  versions: ModelVersion[];
}

const CATEGORY_LABELS: Record<string, string> = {
  rocks: 'Rocks',
  trees: 'Trees',
  cars: 'Vehicles',
  vehicles: 'Vehicles',
  plants: 'Plants',
  props: 'Props',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
}

export function formatDimensions(d: Model['dimensions']): string {
  if (!d) return '';
  const m = (v: number) => Number(v).toFixed(2).replace(/\.?0+$/, '');
  return `${m(d.x)} × ${m(d.y)} × ${m(d.z)} m`;
}

export function modelUrl(model: Pick<Model, 'slug'>): string {
  return `/models/${model.slug}`;
}

/** Name a downloaded file is saved as, unique across models and versions: <slug>-v<n>-lod<n>.glb */
export function downloadName(slug: string, version: number, file: ModelFile): string {
  return `${slug}-v${version}-lod${file.lod}.glb`;
}

export function lod0(model: Model): ModelFile {
  return model.files.find((f) => f.lod === 0) ?? model.files[0];
}

export function lodLabel(file: ModelFile): string {
  return `LOD${file.lod}`;
}

export function loadSnippet(file: ModelFile): string {
  return `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// renderer and scene: your THREE.WebGLRenderer and THREE.Scene
const ktx2 = new KTX2Loader()
  .setTranscoderPath('${TRANSCODER_URL}')
  .detectSupport(renderer);

const loader = new GLTFLoader()
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('${SITE_URL}${file.path}');
scene.add(gltf.scene);`;
}
