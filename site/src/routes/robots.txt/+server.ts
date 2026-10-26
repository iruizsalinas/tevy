import { SITE_URL } from '#lib/models';

export const prerender = true;
export const trailingSlash = 'never';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
