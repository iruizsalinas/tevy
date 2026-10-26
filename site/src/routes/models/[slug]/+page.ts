import { error } from '@sveltejs/kit';
import type { Model } from '#lib/models';

// Reads the model's own model.json; prerendering inlines it into the page.
export async function load({ fetch, params }) {
  const res = await fetch(`/models/${params.slug}/model.json`);
  if (!res.ok) error(404, 'Model not found');
  const model = (await res.json()) as Model;
  model.files.sort((a, b) => a.lod - b.lod);
  return { model };
}
