<script lang="ts">
  import Layout from './Layout.svelte';
  import {
    CC0_URL,
    SITE_URL,
    categoryLabel,
    downloadName,
    formatBytes,
    formatClips,
    formatDimensions,
    lod0,
    modelUrl,
    type Model,
  } from '#lib/models';
  import Icon from '#lib/components/Icon.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { firstSentence } from '#lib/catalog';
  import UseIt from '#lib/components/UseIt.svelte';
  import Viewer from '#lib/components/Viewer.svelte';

  let { model }: { model: Model } = $props();

  const main = $derived(lod0(model));
  const older = $derived(model.versions.filter((v) => v.version !== model.version));
  let lod = $state(0);

  const url = $derived(`${SITE_URL}${modelUrl(model)}`);
  const description = $derived(
    `${firstSentence(model.description)} Free CC0 glTF model for three.js and other engines.`,
  );
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': '3DModel',
      name: model.name,
      description: model.description,
      url,
      image: `${SITE_URL}${model.preview}`,
      keywords: (model.tags ?? []).join(', '),
      license: CC0_URL,
      isAccessibleForFree: true,
      dateCreated: model.created,
      dateModified: model.updated,
      encoding: model.files.map((f) => ({
        '@type': 'MediaObject',
        contentUrl: `${SITE_URL}${f.path}`,
        encodingFormat: 'model/gltf-binary',
        contentSize: `${f.bytes} B`,
        sha256: f.sha256,
      })),
    }).replace(/</g, '\\u003c'),
  );
</script>

<Seo
  title="{model.name}, free CC0 3D model"
  {description}
  path="/models/{model.slug}"
  json="/models/{model.slug}.json"
  image={{ path: model.preview, width: 1024, height: 1024, alt: `${model.name}, 3D model preview` }}
/>

<svelte:head>
  <link rel="preload" as="image" href={model.preview} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<Layout>

<div class="page">
  <div class="stage">
    <Viewer {model} bind:lod />
  </div>

  <aside class="info">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/models">Models</a><span aria-hidden="true">/</span><a href="/models?category={encodeURIComponent(model.category)}">{categoryLabel(model.category)}</a>
    </nav>
    <h1 class="display">{model.name}</h1>
    <p class="lede">{model.description}</p>

    <dl class="specs">
      <div><dt>Triangles</dt><dd class="mono">{main.triangles.toLocaleString('en-US')}</dd></div>
      <div><dt>Size</dt><dd class="mono">{formatBytes(main.bytes)}</dd></div>
      <div><dt>LODs</dt><dd class="mono">{model.files.length}</dd></div>
      <div><dt>License</dt><dd class="mono"><a href={CC0_URL} rel="license">CC0 1.0</a></dd></div>
      <div class="wide"><dt>Dimensions</dt><dd class="mono">{formatDimensions(model.dimensions) || '-'}</dd></div>
      {#if model.parts?.length}
        <div class="wide"><dt>Moving parts</dt><dd class="mono">{model.parts.join(', ')}</dd></div>
      {/if}
      {#if model.animations?.length}
        <div class="wide"><dt>Animations</dt><dd class="mono">{formatClips(model.animations)}</dd></div>
      {/if}
      {#if model.wind}
        <div class="wide"><dt>Wind</dt><dd>Sway and flutter data for a wind shader, see the <a href="/docs#motion">docs</a></dd></div>
      {/if}
      <div class="wide">
        <dt>Version</dt>
        <dd class="mono">v{model.version}{#if model.updated}, <time datetime={model.updated}>{model.updated}</time>{/if}</dd>
        {#if model.version > 1}<dd class="changes">{model.changes}</dd>{/if}
      </div>
    </dl>

    <section class="downloads" aria-labelledby="downloads-title">
      <h2 id="downloads-title">Download</h2>
      <ul>
        {#each model.files as file (file.path)}
          <li>
            <span class="lod mono">LOD{file.lod}</span>
            <span class="meta mono">{file.triangles.toLocaleString('en-US')} tris · {formatBytes(file.bytes)}</span>
            <a
              class="btn small"
              class:primary={file.lod === 0}
              href={file.path}
              download={downloadName(model.slug, model.version, file)}
              aria-label="Download LOD{file.lod}, {downloadName(model.slug, model.version, file)}"
            >
              <Icon name="download" size={14} />GLB
            </a>
          </li>
        {/each}
      </ul>
    </section>

    {#if older.length}
      <section class="downloads" aria-labelledby="versions-title">
        <h2 id="versions-title">Older versions</h2>
        <ul>
          {#each older as v (v.version)}
            <li class="version">
              <span class="lod mono">v{v.version}</span>
              <span class="meta"><time class="mono" datetime={v.date}>{v.date}</time> · {v.changes}</span>
              <span class="links mono">
                {#each v.files as file (file.path)}
                  <a href={file.path} download={downloadName(model.slug, v.version, file)} aria-label="Download v{v.version} LOD{file.lod}, {downloadName(model.slug, v.version, file)}">LOD{file.lod}</a>
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if model.tags?.length}
      <ul class="tags" aria-label="Tags">
        {#each model.tags as tag (tag)}
          <li><a class="pill" href="/models?search={encodeURIComponent(tag)}">{tag}</a></li>
        {/each}
      </ul>
    {/if}
  </aside>

  <div class="snippet">
    <UseIt path={(model.files[lod] ?? main).path} version={model.version} />
  </div>
</div>

</Layout>

<style>
  .page {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    grid-template-areas:
      'stage info'
      'snippet info';
    align-items: start;
    gap: 20px;
    max-width: 1680px;
    margin: 0 auto;
    padding: 16px clamp(16px, 2vw, 24px) 56px;
  }

  .stage {
    grid-area: stage;
    height: clamp(460px, calc(100dvh - 56px - 32px), 960px);
  }

  .info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .snippet {
    grid-area: snippet;
    min-width: 0;
  }

  .crumbs {
    display: flex;
    gap: 6px;
    font-size: 12.5px;
    color: var(--line-strong);
  }

  .crumbs a {
    color: var(--faint);
    text-decoration: none;
  }

  .crumbs a:hover {
    color: var(--text);
  }

  h1 {
    margin-top: -6px;
    font-size: 30px;
    line-height: 1.05;
  }

  .lede {
    margin: 0;
    color: var(--muted);
  }

  .specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    margin: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--line);
  }

  .specs > div {
    padding: 8px 11px;
    background: var(--panel);
  }

  .specs .wide {
    grid-column: 1 / -1;
  }

  dt {
    font-size: 11px;
    color: var(--faint);
  }

  dd {
    margin: 1px 0 0;
    font-size: 12.5px;
    overflow-wrap: anywhere;
  }

  dd a {
    text-underline-offset: 3px;
    text-decoration-color: var(--line-strong);
  }

  h2 {
    font-size: 13px;
  }

  .downloads ul {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
  }

  .downloads li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 10px;
    padding: 9px 9px 9px 11px;
  }

  .downloads li + li {
    border-top: 1px solid var(--line);
  }

  .lod {
    font-size: 12.5px;
    font-weight: 600;
  }

  .meta {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11.5px;
    color: var(--muted);
  }

  .changes {
    color: var(--muted);
  }

  .version .meta {
    white-space: normal;
  }

  .links {
    display: flex;
    gap: 8px;
    font-size: 11.5px;
  }

  .links a {
    color: var(--muted);
    text-underline-offset: 3px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pill {
    text-decoration: none;
  }

  a.pill:hover {
    background: var(--hover);
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .page {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'stage'
        'info'
        'snippet';
    }

    .stage {
      height: min(72dvh, 640px);
    }
  }

  @media (max-width: 640px) {
    .page {
      padding-top: 0;
    }

    .stage {
      height: auto;
      aspect-ratio: 4 / 5;
      max-height: 72dvh;
      margin-inline: calc(-1 * clamp(16px, 2vw, 24px));
    }
  }
</style>
