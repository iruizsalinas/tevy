// Every file the site serves besides site/public: prerendered pages and generated text files.
// Used by site/build.mjs at build time and by the dev server in vite.config.js.
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { KINDS, itemUrl, latestPath, type Item, type Kind } from '#lib/catalog';
import type { Model } from '#lib/models';
import type { Sky } from '#lib/skies';
import type { Material } from '#lib/materials';
import { mainFile } from '#lib/skies';
import { featured, published, readAll, verifyFiles } from '#lib/server/catalog';
import { indexJson, llmsTxt, robotsTxt, sitemapXml } from '#lib/server/files';
import Catalog from './pages/Catalog.svelte';
import Docs from './pages/Docs.svelte';
import License from './pages/License.svelte';
import Missing from './pages/Missing.svelte';
import ModelPage from './pages/Model.svelte';
import SkyPage from './pages/Sky.svelte';
import MaterialPage from './pages/Material.svelte';

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
  /** A file in site/public served at this path too, e.g. /models/<slug>/v2/lod0.glb */
  copy?: string;
  text?: string;
  type?: string;
}

function page<P extends Record<string, unknown>>(component: Component<P>, entry: string, props: P): Page {
  const { head, body } = render(component, { props });
  return { head, body, entry, props };
}

// The sky that lights the material viewer: plain daylight, so the material shows its own color.
const MATERIAL_SKY = 'scattered-cumulus';

function itemPage(item: Item, all: Record<Kind, Item[]>): Page {
  if (item.kind === 'models') return page(ModelPage, 'model', { model: item });
  if (item.kind === 'skies') return page(SkyPage, 'sky', { sky: item });
  const sky = (all.skies.find((s) => s.slug === MATERIAL_SKY) ?? all.skies[0]) as Sky | undefined;
  const lighting = sky ? { path: mainFile(sky).path, exposure: sky.exposure, sun: sky.sun } : null;
  return page(MaterialPage, 'material', { material: item, sky: lighting });
}

/** The model, sky and material the docs use in their examples: the first featured of each. */
function docsExamples(all: Record<Kind, Item[]>) {
  const picks = featured(all);
  const model = picks.find((i) => i.kind === 'models') ?? all.models[0];
  const sky = picks.find((i) => i.kind === 'skies') ?? all.skies[0] ?? null;
  const material = picks.find((i) => i.kind === 'materials') ?? all.materials[0] ?? null;
  const person = (all.models as Model[]).find((m) => m.animations?.length) ?? null;
  return {
    model: published(model) as Model,
    sky: sky ? (published(sky) as Sky) : null,
    material: material ? (published(material) as Material) : null,
    person: person ? (published(person as Item) as Model) : null,
  };
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
        return { path, file: `${path.slice(1)}/index.html`, page: () => itemPage(item, all) };
      }),
      // The latest version's files at unversioned URLs, for sites that follow new versions.
      ...all[kind].flatMap((item) =>
        [...item.files.map((f) => f.path), item.preview].map((path) => ({ path: latestPath(path), file: latestPath(path).slice(1), copy: path })),
      ),
    ]),
    ...KINDS.map(({ kind }) => ({ path: `/${kind}.json`, file: `${kind}.json`, text: indexJson(kind, all[kind]), type: 'application/json' })),
    { path: '/docs', file: 'docs/index.html', page: () => page(Docs, 'docs', docsExamples(all)) },
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
