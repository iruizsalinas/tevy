// Material metadata types and pure helpers shared by pages, endpoints and the material viewer.

export interface MaterialFile {
  /** Site-absolute path, e.g. /materials/<slug>/v1/color-2k.ktx2 */
  path: string;
  bytes: number;
  sha256?: string;
  /** color (sRGB base color), normal (OpenGL, +Y up) or orm (glTF occlusion, roughness, metalness). */
  map: string;
  width: number;
  height: number;
  format: string;
  /** etc1s or uastc: the Basis Universal mode of a KTX2 file. */
  codec?: string;
  colorSpace?: string;
}

export interface MaterialVersion {
  version: number;
  date: string;
  changes: string;
  preview: string;
  files: MaterialFile[];
}

/** The content of /materials/<slug>.json (schema 1). */
export interface Material {
  schema: number;
  slug: string;
  name: string;
  category: string;
  tags?: string[];
  description: string;
  license: string;
  version: number;
  changes: string;
  created?: string;
  updated?: string;
  /** Meters covered by one repeat of the texture. */
  tileSize: number;
  normalConvention?: string;
  preview: string;
  files: MaterialFile[];
  /** Every version, newest first. */
  versions: MaterialVersion[];
}

/** One resolution of a material: its color, normal and ORM maps. */
export interface MaterialSet {
  width: number;
  bytes: number;
  files: MaterialFile[];
}

const MAP_ORDER = ['color', 'normal', 'orm'];

/** The sets of a version, largest first, each with its maps in color, normal, ORM order. */
export function materialSets(files: MaterialFile[]): MaterialSet[] {
  const widths = [...new Set(files.map((f) => f.width))].sort((a, b) => b - a);
  return widths.map((width) => {
    const set = files
      .filter((f) => f.width === width)
      .sort((a, b) => MAP_ORDER.indexOf(a.map) - MAP_ORDER.indexOf(b.map));
    return { width, bytes: set.reduce((sum, f) => sum + f.bytes, 0), files: set };
  });
}

/** "2K", "1K": the texture width in thousands of pixels. */
export function setLabel(width: number): string {
  return `${Math.round(width / 1024)}K`;
}

const MAP_LABELS: Record<string, string> = { color: 'Color', normal: 'Normal', orm: 'ORM' };

export function mapLabel(map: string): string {
  return MAP_LABELS[map] ?? map;
}

export function materialDownloadName(slug: string, version: number, file: MaterialFile): string {
  const ext = file.path.split('.').pop();
  return `${slug}-v${version}-${file.map}-${setLabel(file.width).toLowerCase()}.${ext}`;
}
