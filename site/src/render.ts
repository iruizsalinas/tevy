// Every file the site serves besides site/public: prerendered pages and generated text files.
// Used by site/build.mjs at build time and by the dev server in vite.config.js.
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { readModels, verifyModelFiles } from '#lib/server/models';
import { llmsTxt, modelsJson, robotsTxt, sitemapXml } from '#lib/server/files';
import { modelUrl } from '#lib/models';
import Catalog from './pages/Catalog.svelte';
import License from './pages/License.svelte';
import Missing from './pages/Missing.svelte';
import Model from './pages/Model.svelte';

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

export function outputs(): Output[] {
  const models = readModels();
  return [
    { path: '/', file: '', redirect: '/models' },
    { path: '/models', file: 'models/index.html', page: () => page(Catalog, 'catalog', { models }) },
    { path: '/license', file: 'license/index.html', page: () => page(License, 'license', {}) },
    ...models.map((model) => {
      const path = modelUrl(model);
      return { path, file: `${path.slice(1)}/index.html`, page: () => page(Model, 'model', { model }) };
    }),
    { path: '/404.html', file: '404.html', page: () => page(Missing, 'missing', {}) },
    { path: '/models.json', file: 'models.json', text: modelsJson(models), type: 'application/json' },
    { path: '/llms.txt', file: 'llms.txt', text: llmsTxt(models), type: 'text/plain; charset=utf-8' },
    { path: '/sitemap.xml', file: 'sitemap.xml', text: sitemapXml(models), type: 'application/xml' },
    { path: '/robots.txt', file: 'robots.txt', text: robotsTxt(), type: 'text/plain; charset=utf-8' },
  ];
}

/** Build-time check that every published version's files are present and unchanged. */
export function verify(): void {
  verifyModelFiles(readModels());
}
