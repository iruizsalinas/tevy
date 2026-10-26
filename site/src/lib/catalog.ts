// The sections of the catalog. Each kind of download has its own section with the same shape:
// /<kind> (catalog), /<kind>/<slug> (page), /<kind>/<slug>/<meta> (metadata), /<kind>.json (index).
import { formatBytes, formatCount, lod0, type Model } from './models';
import { mainFile, resolutionLabel, type Sky } from './skies';

export type Kind = 'models' | 'skies';

export interface KindInfo {
  kind: Kind;
  /** Plural label, used for navigation and headings. */
  label: string;
  singular: string;
  /** File name of the per-item metadata. */
  meta: string;
  /** One line on what the section holds. */
  blurb: string;
}

export const KINDS: KindInfo[] = [
  {
    kind: 'models',
    label: 'Models',
    singular: 'model',
    meta: 'model.json',
    blurb: 'Every model is CC0 glTF with LODs, meshopt geometry and KTX2 textures.',
  },
  {
    kind: 'skies',
    label: 'Skies',
    singular: 'sky',
    meta: 'sky.json',
    blurb: 'Every sky is a CC0 HDR panorama that works as background and lighting.',
  },
];

export function kindInfo(kind: Kind): KindInfo {
  return KINDS.find((k) => k.kind === kind)!;
}

export type Item = (Model & { kind: 'models' }) | (Sky & { kind: 'skies' });

export function itemUrl(item: Pick<Item, 'kind' | 'slug'>): string {
  return `/${item.kind}/${item.slug}`;
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
