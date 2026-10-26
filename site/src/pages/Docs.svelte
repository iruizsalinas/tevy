<script lang="ts">
  import Layout from './Layout.svelte';
  import { latestPath } from '#lib/catalog';
  import { SITE_URL, lod0, type Model } from '#lib/models';
  import { mainFile, type Sky } from '#lib/skies';
  import type { Material } from '#lib/materials';
  import {
    THREE_PARTS_SNIPPET,
    babylonSnippet,
    modelViewerSnippet,
    r3fSnippet,
    threeLodSnippet,
    threeMaterialSnippet,
    threeModelSnippet,
    threeSkySnippet,
  } from '#lib/docs';
  import CodeBlock from '#lib/components/CodeBlock.svelte';
  import Seo from '#lib/components/Seo.svelte';

  // How to use tevy files, once for every item: URLs, versions, and code for three.js and other
  // engines. The examples use a real model, sky and material so they can be pasted as they are.
  let { model, sky, material }: { model: Model; sky: Sky | null; material: Material | null } = $props();

  const pinned = $derived(`${SITE_URL}${lod0(model).path}`);
  const latest = $derived(`${SITE_URL}${latestPath(lod0(model).path)}`);
  const versionBase = $derived(`${SITE_URL}/models/${model.slug}/v${model.version}`);
  const skyUrl = $derived(sky ? `${SITE_URL}${mainFile(sky).path}` : '');
  const materialBase = $derived(material ? `${SITE_URL}/materials/${material.slug}/v${material.version}` : '');

  const toc = [
    ['agents', 'Building with an AI agent'],
    ['urls', 'Files and URLs'],
    ['versions', 'Versions: pinned or latest'],
    ['three-models', 'three.js: models'],
    ['three-skies', 'three.js: skies'],
    ['three-materials', 'three.js: materials'],
    ['other', 'Other engines'],
    ['metadata', 'Metadata and indexes'],
  ];

  // Scrolls to a section without putting a #fragment in the address bar.
  function jump(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    target.querySelector('h2')?.focus({ preventScroll: true });
  }
</script>

<Seo
  title="How to use tevy models, skies and materials"
  description="How to load tevy models, skies and materials in three.js, React Three Fiber, Babylon.js and model-viewer, how to build with an AI agent, and when to pin a version or follow the latest."
  path="/docs"
/>

<Layout>
  <div class="docs">
    <nav class="toc" aria-label="On this page">
      <p class="toc-title">On this page</p>
      <ul>
        {#each toc as [id, label] (id)}
          <li><button type="button" onclick={() => jump(id)}>{label}</button></li>
        {/each}
      </ul>
    </nav>

    <article>
      <h1 class="display">Docs</h1>
      <p class="lead">
        Every file on tevy is a plain HTTPS download: no account, no API key, and CORS is open, so a browser can load files straight from
        tevy.dev. Everything is <a href="/license">CC0</a>.
      </p>

      <section id="agents">
        <h2 tabindex="-1">Building with an AI agent</h2>
        <p>
          If an AI coding agent writes your code, give it <a class="mono" href="/llms.txt">{SITE_URL}/llms.txt</a>. It is a single text page
          made for agents: what tevy is, the URL layout, the loader setup and every item with a link to its metadata, so the agent picks
          real assets and uses working URLs instead of guessing.
        </p>
        <p>For example: <span class="mono">Read {SITE_URL}/llms.txt and add a spruce forest along the road using tevy models.</span></p>
      </section>

      <section id="urls">
        <h2 tabindex="-1">Files and URLs</h2>
        <p>Every section (models, skies, materials) has the same shape:</p>
        <table class="paths">
          <tbody>
            <tr><td class="mono">/models/&lt;slug&gt;</td><td>The page, with a preview and the downloads.</td></tr>
            <tr><td class="mono">/models/&lt;slug&gt;.json</td><td>Metadata: files, sizes, sha256, versions.</td></tr>
            <tr><td class="mono">/models/&lt;slug&gt;/v1/lod0.glb</td><td>A file of version 1. It never changes.</td></tr>
            <tr><td class="mono">/models/&lt;slug&gt;/lod0.glb</td><td>The same file of the latest version.</td></tr>
            <tr><td class="mono">/models/&lt;slug&gt;/v1/preview.webp</td><td>The preview image of version 1.</td></tr>
            <tr><td class="mono">/models.json</td><td>The latest version of every model in one file.</td></tr>
          </tbody>
        </table>
        <p>
          Slugs are permanent. Models have levels of detail: <span class="mono">lod0.glb</span> is full detail, <span class="mono">lod1.glb</span> and
          up have fewer triangles. Skies have <span class="mono">2k.jpg</span> for background and lighting and <span class="mono">1k.jpg</span> for
          lighting only. Materials have a color, normal and ORM map in two sizes, such as <span class="mono">color-2k.ktx2</span> and
          <span class="mono">color-1k.ktx2</span>.
        </p>
      </section>

      <section id="versions">
        <h2 tabindex="-1">Versions: pinned or latest</h2>
        <p>
          When an item improves, for example a better tree crown, it gets a new version in a new folder (v2, v3, ...). Older versions stay online
          for good. Each file has two URLs, and you choose which one to use:
        </p>
        <table>
          <thead>
            <tr><th></th><th>Pinned</th><th>Latest</th></tr>
          </thead>
          <tbody>
            <tr><td>URL</td><td class="mono">{pinned.replace(SITE_URL, '')}</td><td class="mono">{latest.replace(SITE_URL, '')}</td></tr>
            <tr><td>Changes</td><td>Never</td><td>When a new version ships</td></tr>
            <tr><td>Use it for</td><td>Anything you ship</td><td>Prototypes, demos, always the best version</td></tr>
          </tbody>
        </table>
        <ul>
          <li>
            <strong>Pin</strong> when a change would surprise you. A new version can change the look, the size in meters, the triangle count or
            the node names, and a pinned URL keeps your project exactly as you tested it.
          </li>
          <li>
            <strong>Use latest</strong> to get improvements without touching your code. Updates reach your visitors as soon as a new version is published.
          </li>
          <li>
            To update a pinned project, read <span class="mono">version</span> in the metadata, check <span class="mono">changes</span>, and
            change <span class="mono">v1</span> to the new version in your URLs.
          </li>
          <li>Fixes to names, tags or descriptions do not make a new version; only changes to the files do.</li>
        </ul>
      </section>

      <section id="three-models">
        <h2 tabindex="-1">three.js: models</h2>
        <p>
          Models are glTF binary files with meshopt-compressed geometry and KTX2 textures, so GLTFLoader needs a decoder for each. Set the loader
          up once and reuse it for every model.
        </p>
        <CodeBlock title="Load a model" code={threeModelSnippet(pinned)} />
        <h3>Levels of detail</h3>
        <p>Load each level into a <span class="mono">LOD</span> object and three.js shows the right one for the camera distance.</p>
        <CodeBlock title="Switch levels by distance" code={threeLodSnippet(versionBase, model.files.length)} />
        <h3>Units and moving parts</h3>
        <p>
          Units are meters, +Y is up and the front faces +Z. Moving pieces such as wheels, doors and steering wheels are separate nodes with
          their origin at the pivot and stable names, listed in <span class="mono">parts</span> in the model's metadata.
        </p>
        <CodeBlock title="Turn a wheel" code={THREE_PARTS_SNIPPET} />
      </section>

      {#if sky}
        <section id="three-skies">
          <h2 tabindex="-1">three.js: skies</h2>
          <p>
            Skies are Ultra HDR JPEGs: a normal JPEG with an HDR gain map, a fraction of the size of an .hdr file. One file is both the
            background and the lighting. The sun is in the image, so reflections and soft light come for free; for sharp shadows add a light
            from the sun values in the sky's metadata.
          </p>
          <CodeBlock title="Use a sky" code={threeSkySnippet(skyUrl, sky)} />
          <p>
            <span class="mono">exposure</span> is a suggested starting point for AgX tone mapping. The 1K file is enough when you only need the
            lighting, for example with your own sky shader.
          </p>
        </section>
      {/if}

      {#if material}
        <section id="three-materials">
          <h2 tabindex="-1">three.js: materials</h2>
          <p>
            Materials are seamless PBR texture sets for large surfaces such as roads and ground. Each has three KTX2 textures: color (sRGB),
            normal (OpenGL convention, which three.js uses) and ORM, which packs occlusion, roughness and metalness like glTF. They load with
            the same KTX2Loader as the models.
          </p>
          <CodeBlock title="Use a material" code={threeMaterialSnippet(materialBase, material.tileSize)} />
          <p>
            <span class="mono">tileSize</span> in the metadata is the size in meters of one repeat, so the texture keeps its real scale on any
            surface. The 1K maps are a quarter of the download and look the same beyond a few meters.
          </p>
        </section>
      {/if}

      <section id="other">
        <h2 tabindex="-1">Other engines</h2>
        <p>
          Any engine that reads glTF with the <span class="mono">EXT_meshopt_compression</span> and
          <span class="mono">KHR_texture_basisu</span> extensions can load the models.
        </p>
        <CodeBlock title="React Three Fiber" code={r3fSnippet(pinned)} />
        <CodeBlock title="Babylon.js" code={babylonSnippet(pinned)} />
        <CodeBlock title="model-viewer, no build step" code={modelViewerSnippet(pinned)} />
        <p>
          Skies open as ordinary JPEGs anywhere; for the HDR range your engine needs to read the gain map (three.js does, through
          UltraHDRLoader).
        </p>
      </section>

      <section id="metadata">
        <h2 tabindex="-1">Metadata and indexes</h2>
        <ul>
          <li>
            An item's metadata, such as <a class="mono" href="/models/{model.slug}.json">/models/{model.slug}.json</a>, describes the latest version.
            <span class="mono">versions</span> lists every version, newest first, with its date, what changed, its preview and its files.
          </li>
          <li>
            Every file has its byte size and sha256, so you can check a download or cache files by hash.
          </li>
          <li>
            <a class="mono" href="/models.json">models.json</a>, <a class="mono" href="/skies.json">skies.json</a> and
            <a class="mono" href="/materials.json">materials.json</a> hold the latest version of
            every item of a section in one file, for tools and build scripts. The version history is in each item's own file.
          </li>
        </ul>
        <p>You can also download files and host them yourself; CC0 allows any use.</p>
      </section>
    </article>
  </div>
</Layout>

<style>
  .docs {
    display: grid;
    grid-template-columns: 200px minmax(0, 760px);
    justify-content: center;
    gap: 48px;
    padding: clamp(28px, 5vw, 56px) clamp(16px, 3vw, 32px) 56px;
  }

  .toc {
    position: sticky;
    top: 88px;
    align-self: start;
  }

  .toc-title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--faint);
  }

  .toc ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc li + li {
    margin-top: 2px;
  }

  .toc button {
    display: block;
    padding: 4px 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13.5px;
    text-align: left;
    color: var(--muted);
    cursor: pointer;
  }

  .toc button:hover {
    color: var(--text);
  }

  h1 {
    font-size: clamp(30px, 4vw, 44px);
    line-height: 1.05;
  }

  .lead {
    margin: 14px 0 0;
    font-size: 16.5px;
    line-height: 1.55;
  }

  section {
    margin-top: 40px;
    scroll-margin-top: 80px;
  }

  section > :global(.block) {
    margin: 14px 0;
  }

  h2 {
    margin-bottom: 10px;
    font-size: 20px;
  }

  h3 {
    margin: 22px 0 6px;
    font-size: 15px;
  }

  p,
  li,
  td,
  th {
    color: var(--muted);
    font-size: 14.5px;
    line-height: 1.6;
  }

  p {
    margin: 0 0 10px;
  }

  ul {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  li + li {
    margin-top: 6px;
  }

  strong {
    color: var(--text);
  }

  a {
    color: var(--accent-text);
    text-underline-offset: 3px;
  }

  .mono {
    font-size: 0.9em;
  }

  table {
    width: 100%;
    margin: 4px 0 14px;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    font-weight: 600;
    color: var(--text);
  }

  th,
  td {
    padding: 7px 12px 7px 0;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }

  td.mono {
    color: var(--text);
    overflow-wrap: anywhere;
  }

  @media (max-width: 900px) {
    .docs {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }

    .toc {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .paths td {
      display: block;
      padding: 0;
      border: 0;
    }

    .paths td + td {
      padding: 2px 0 9px;
      border-bottom: 1px solid var(--line);
    }

    .paths tr:first-child td:first-child {
      padding-top: 7px;
    }
  }
</style>
