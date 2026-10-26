// The sections of the catalog. Each kind of download has its own section with the same shape:
// /<kind> (catalog), /<kind>/<slug> (page), /<kind>/<slug>.json (metadata), /<kind>.json (index).
import { formatBytes, formatCount, lod0, type Model } from './models';
import { mainFile, resolutionLabel, type Sky } from './skies';

export type Kind = 'models' | 'skies';

export interface KindInfo {
  kind: Kind;
  /** Plural label, used for navigation and headings. */
  label: string;
  singular: string;
  /** Page title of the section, before " | tevy". */
  title: string;
  /** One line on what the section holds. */
  blurb: string;
}

export const KINDS: KindInfo[] = [
  {
    kind: 'models',
    label: 'Models',
    singular: 'model',
    title: 'Free CC0 3D models',
    blurb: 'Every model is a CC0 glTF file with levels of detail and compressed geometry and textures.',
  },
  {
    kind: 'skies',
    label: 'Skies',
    singular: 'sky',
    title: 'Free CC0 HDR skies',
    blurb: 'Every sky is a CC0 HDR panorama that lights your scene and serves as its background.',
  },
];

/** The first sentence of an item description, for search snippets; the rest is technical detail. */
export function firstSentence(text: string): string {
  const end = text.search(/[.!?](\s|$)/);
  return end === -1 ? text : text.slice(0, end + 1);
}

export function kindInfo(kind: Kind): KindInfo {
  return KINDS.find((k) => k.kind === kind)!;
}

export type Item = (Model & { kind: 'models' }) | (Sky & { kind: 'skies' });

export function itemUrl(item: Pick<Item, 'kind' | 'slug'>): string {
  return `/${item.kind}/${item.slug}`;
}

/** The item's metadata file, next to its page: /models/<slug>.json */
export function metaUrl(item: Pick<Item, 'kind' | 'slug'>): string {
  return `${itemUrl(item)}.json`;
}

/** The unversioned URL of a file, which always serves the latest version: /models/x/v2/lod0.glb -> /models/x/lod0.glb */
export function latestPath(path: string): string {
  return path.replace(/\/v\d+\/([^/]+)$/, '/$1');
}

/** The short facts on a catalog card. */
export function cardMeta(item: Item): string {
  if (item.kind === 'models') {
    const f = lod0(item);
    return `${formatCount(f.triangles)} tris · ${formatBytes(f.bytes)}`;
  }
  const f = mainFile(item);
  return `${resolutionLabel(f)} HDR · ${formatBytes(f.bytes)}`;
}
