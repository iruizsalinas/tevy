import { SITE_URL, modelUrl } from '#lib/models';
import { readModels } from '#lib/server/models';

export const prerender = true;
export const trailingSlash = 'never';

export function GET() {
  const urls = [
    `  <url><loc>${SITE_URL}/</loc></url>`,
    ...readModels().map(
      (m) => `  <url><loc>${SITE_URL}${modelUrl(m)}</loc>${m.updated ? `<lastmod>${m.updated}</lastmod>` : ''}</url>`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
}
