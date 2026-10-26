// Build-time access to the published items in site/public/<kind>/<slug>/<meta>.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { KINDS, type Item, type Kind } from '#lib/catalog';
import { FEATURED } from '../../featured';

const PUBLIC_DIR = resolve('site/public');

/** Every valid item of one kind, sorted by slug. Read fresh on each call so dev picks up new items. */
export function readItems(kind: Kind): Item[] {
  const dir = join(PUBLIC_DIR, kind);
  if (!existsSync(dir)) return [];
  const { meta } = KINDS.find((k) => k.kind === kind)!;
  const items: Item[] = [];
  for (const slug of readdirSync(dir)) {
    const file = join(dir, slug, meta);
    if (!statSync(join(dir, slug)).isDirectory() || !existsSync(file)) continue;
    const item = { ...JSON.parse(readFileSync(file, 'utf8')), kind } as Item;
    if (item.slug !== slug) throw new Error(`${file}: slug "${item.slug}" does not match its folder`);
    if (!Array.isArray(item.files) || item.files.length === 0) throw new Error(`${file}: no files`);
    if (!Array.isArray(item.versions) || !item.versions.some((v) => v.version === item.version)) {
      throw new Error(`${file}: versions must list the current version ${item.version}`);
    }
    if (item.kind === 'models') item.files.sort((a, b) => a.lod - b.lod);
    items.push(item);
  }
  return items.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function readAll(): Record<Kind, Item[]> {
  return Object.fromEntries(KINDS.map(({ kind }) => [kind, readItems(kind)])) as Record<Kind, Item[]>;
}

/** The featured items in their listed order. Entries that are not published (yet) are skipped. */
export function featured(all: Record<Kind, Item[]>): Item[] {
  return FEATURED.map((ref) => {
    const [kind, slug] = ref.split('/') as [Kind, string];
    return all[kind]?.find((item) => item.slug === slug);
  }).filter((item): item is Item => Boolean(item));
}

/**
 * Fails when a file of any listed version is missing or differs from its sha256, so a deploy can
 * never drop or change a published version.
 */
export function verifyFiles(items: Item[]): void {
  for (const item of items) {
    for (const v of item.versions) {
      for (const f of v.files) {
        const local = join(PUBLIC_DIR, f.path);
        if (!existsSync(local)) throw new Error(`${item.kind}/${item.slug} v${v.version}: missing ${f.path}`);
        const sha = createHash('sha256').update(readFileSync(local)).digest('hex');
        if (f.sha256 && sha !== f.sha256) throw new Error(`${item.kind}/${item.slug} v${v.version}: ${f.path} does not match its sha256`);
      }
    }
  }
}

/** Newest `updated` date of the items, so an index only changes when an item does. */
export function generatedAt(items: Item[]): string {
  const latest = items
    .map((m) => m.updated ?? m.created ?? '')
    .sort()
    .pop();
  const date = latest ? new Date(`${latest.slice(0, 10)}T00:00:00Z`) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

/** The item as published in its metadata file, without the section it was read from. */
export function published(item: Item): Omit<Item, 'kind'> {
  const { kind: _, ...rest } = item;
  return rest;
}
