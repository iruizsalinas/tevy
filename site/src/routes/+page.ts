import type { Model } from '#lib/models';

// Reads the same /models.json that tools use; prerendering inlines it into the page.
export async function load({ fetch }) {
  const index = await (await fetch('/models.json')).json();
  return { models: index.models as Model[] };
}
