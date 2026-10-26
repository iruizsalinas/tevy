// Every file the site serves besides site/public: prerendered pages and generated text files.
// Used by site/build.mjs at build time and by the dev server in vite.config.js.
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { KINDS, itemUrl, type Item } from '#lib/catalog';
import { featured, readAll, verifyFiles } from '#lib/server/catalog';
import { indexJson, llmsTxt, robotsTxt, sitemapXml } from '#lib/server/files';
import Catalog from './pages/Catalog.svelte';
import License from './pages/License.svelte';
import Missing from './pages/Missing.svelte';
import Model from './pages/Model.svelte';
import Sky from './pages/Sky.svelte';

/** A page: rendered Svelte markup plus the client entry (site/src/client/<entry>.ts) that hydrates it. */
export interface Page {
  head: string;
  body: string;
  entry: string;
  props: Record<string, unknown>;
}

export interface Output {
  /** URL path without a trailing slash, e.g. /models/<slug> or /llms.txt */
  path: string;
  /** File in the output folder, e.g. index.html */
  file: string;
  /** Renders the page; lazy so the dev server only renders what is requested. */
  page?: () => Page;
  /** Redirect target; the build writes these into _redirects. */
  redirect?: string;
  text?: string;
  type?: string;
}

function page<P extends Record<string, unknown>>(component: Component<P>, entry: string, props: P): Page {
  const { head, body } = render(component, { props });
  return { head, body, entry, props };
}

function itemPage(item: Item): Page {
  return item.kind === 'models' ? page(Model, 'model', { model: item }) : page(Sky, 'sky', { sky: item });
}

export function outputs(): Output[] {
  const all = readAll();
  const sections = KINDS.filter((k) => all[k.kind].length);
  const counts = sections.map((k) => ({ kind: k.kind, count: all[k.kind].length }));
  return [
    { path: '/', file: 'index.html', page: () => page(Catalog, 'catalog', { items: featured(all), kind: null, sections: counts }) },
    ...sections.flatMap(({ kind }) => [
      { path: `/${kind}`, file: `${kind}/index.html`, page: () => page(Catalog, 'catalog', { items: all[kind], kind, sections: counts }) },
      ...all[kind].map((item) => {
        const path = itemUrl(item);
        return { path, file: `${path.slice(1)}/index.html`, page: () => itemPage(item) };
      }),
    ]),
    ...KINDS.map(({ kind }) => ({ path: `/${kind}.json`, file: `${kind}.json`, text: indexJson(kind, all[kind]), type: 'application/json' })),
    { path: '/license', file: 'license/index.html', page: () => page(License, 'license', {}) },
    { path: '/404.html', file: '404.html', page: () => page(Missing, 'missing', {}) },
    { path: '/llms.txt', file: 'llms.txt', text: llmsTxt(all), type: 'text/plain; charset=utf-8' },
    { path: '/sitemap.xml', file: 'sitemap.xml', text: sitemapXml(all), type: 'application/xml' },
    { path: '/robots.txt', file: 'robots.txt', text: robotsTxt(), type: 'text/plain; charset=utf-8' },
  ];
}

/** Build-time check that every published version's files are present and unchanged. */
export function verify(): void {
  verifyFiles(Object.values(readAll()).flat());
}
