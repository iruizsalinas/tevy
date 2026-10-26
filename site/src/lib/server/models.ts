// Build-time access to the published models in site/public/models/<slug>/model.json.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Model } from '#lib/models';

const PUBLIC_DIR = resolve('site/public');
const MODELS_DIR = join(PUBLIC_DIR, 'models');

/** Every valid model.json, sorted by slug. Read fresh on each call so dev picks up new models. */
export function readModels(): Model[] {
  if (!existsSync(MODELS_DIR)) return [];
  const models: Model[] = [];
  for (const slug of readdirSync(MODELS_DIR)) {
    const file = join(MODELS_DIR, slug, 'model.json');
    if (!statSync(join(MODELS_DIR, slug)).isDirectory() || !existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, 'utf8')) as Model;
    if (model.slug !== slug) throw new Error(`${file}: slug "${model.slug}" does not match its folder`);
    if (!Array.isArray(model.files) || model.files.length === 0) throw new Error(`${file}: no files`);
    model.files.sort((a, b) => a.lod - b.lod);
    if (!Array.isArray(model.versions) || !model.versions.some((v) => v.version === model.version)) {
      throw new Error(`${file}: versions must list the current version ${model.version}`);
    }
    models.push(model);
  }
  return models.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Fails when a file of any listed version is missing or differs from its sha256, so a deploy can
 * never drop or change a published version.
 */
export function verifyModelFiles(models: Model[]): void {
  for (const model of models) {
    for (const v of model.versions) {
      for (const f of v.files) {
        const local = join(PUBLIC_DIR, f.path);
        if (!existsSync(local)) throw new Error(`${model.slug} v${v.version}: missing ${f.path}`);
        const sha = createHash('sha256').update(readFileSync(local)).digest('hex');
        if (f.sha256 && sha !== f.sha256) throw new Error(`${model.slug} v${v.version}: ${f.path} does not match its sha256`);
      }
    }
  }
}

/** Newest `updated` date of all models, so the index only changes when a model does. */
export function generatedAt(models: Model[]): string {
  const latest = models
    .map((m) => m.updated ?? m.created ?? '')
    .sort()
    .pop();
  const date = latest ? new Date(`${latest.slice(0, 10)}T00:00:00Z`) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}
