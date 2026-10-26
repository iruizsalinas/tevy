import { error } from '@sveltejs/kit';
import { readModels } from '#lib/server/models';

export function entries() {
  return readModels().map((m) => ({ slug: m.slug }));
}

export function load({ params }) {
  const model = readModels().find((m) => m.slug === params.slug);
  if (!model) error(404, 'Model not found');
  return { model };
}
