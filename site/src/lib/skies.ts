// Sky metadata types and pure helpers shared by pages, endpoints and the sky viewer.
import { SITE_URL } from './models';

export interface SkyFile {
  /** Site-absolute path, e.g. /skies/<slug>/v1/2k.jpg */
  path: string;
  bytes: number;
  sha256?: string;
  /** environment: background and lighting; lighting: a smaller file for lighting only. */
  role: string;
  width: number;
  height: number;
  /** ultrahdr: a JPEG with an HDR gain map, loaded with three.js UltraHDRLoader. */
  format: string;
}

export interface SkyVersion {
  version: number;
  date: string;
  changes: string;
  files: SkyFile[];
}

/** The content of /skies/<slug>.json (schema 2). */
export interface Sky {
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
  projection?: string;
  up?: string;
  sun?: { azimuth: number; elevation: number; direction?: number[]; color?: number[]; illuminance?: number };
  /** Suggested renderer.toneMappingExposure. */
  exposure?: number;
  preview: string;
  files: SkyFile[];
  /** Every version, newest first. */
  versions: SkyVersion[];
}

const FORMAT_LABELS: Record<string, string> = { ultrahdr: 'Ultra HDR JPEG', hdr: 'Radiance HDR', exr: 'OpenEXR' };

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format.toUpperCase();
}

/** The full-size file: the one shown as background in the viewer. */
export function mainFile(sky: Sky): SkyFile {
  return sky.files.find((f) => f.role === 'environment') ?? [...sky.files].sort((a, b) => b.width - a.width)[0];
}

/** "2K", "1K": the panorama width in thousands of pixels. */
export function resolutionLabel(file: SkyFile): string {
  return `${Math.round(file.width / 1024)}K`;
}

export function skyDownloadName(slug: string, version: number, file: SkyFile): string {
  const ext = file.path.split('.').pop();
  return `${slug}-v${version}-${resolutionLabel(file).toLowerCase()}.${ext}`;
}
