import { json } from '@sveltejs/kit';
import { SITE_URL } from '#lib/models';
import { generatedAt, readModels } from '#lib/server/models';

export const prerender = true;
export const trailingSlash = 'never';

export function GET() {
  const models = readModels();
  return json({ schema: 1, site: SITE_URL, generated: generatedAt(models), count: models.length, models });
}
