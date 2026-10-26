<script lang="ts">
  import Layout from './Layout.svelte';
  import { CC0_URL, SITE_URL, formatBytes } from '#lib/models';
  import { formatLabel, mainFile, resolutionLabel, skyDownloadName, type Sky } from '#lib/skies';
  import Icon from '#lib/components/Icon.svelte';
  import SkyViewer from '#lib/components/SkyViewer.svelte';
  import UseIt from '#lib/components/UseIt.svelte';

  let { sky }: { sky: Sky } = $props();

  const main = $derived(mainFile(sky));
  const files = $derived([...sky.files].sort((a, b) => b.width - a.width));
  const older = $derived(sky.versions.filter((v) => v.version !== sky.version));

  const url = $derived(`${SITE_URL}/skies/${sky.slug}`);
  const description = $derived(
    `${sky.description} Free CC0 HDR sky panorama for three.js and any engine: ${main.width}x${main.height} ${formatLabel(main.format)}, background and lighting in one file.`,
  );
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: sky.name,
      description: sky.description,
      url,
      contentUrl: `${SITE_URL}${main.path}`,
      thumbnailUrl: `${SITE_URL}${sky.preview}`,
      keywords: (sky.tags ?? []).join(', '),
      license: CC0_URL,
      isAccessibleForFree: true,
      dateCreated: sky.created,
      dateModified: sky.updated,
    }).replace(/</g, '\\u003c'),
  );
</script>

<svelte:head>
  <title>{sky.name}: free CC0 HDR sky | tevy</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <link rel="alternate" type="application/json" href="/skies/{sky.slug}/sky.json" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="tevy" />
  <meta property="og:title" content="{sky.name}: free CC0 HDR sky" />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content="{SITE_URL}{sky.preview}" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="720" />
  <meta property="og:image:alt" content="{sky.name}, sky panorama preview" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preload" as="image" href={sky.preview} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<Layout>

<div class="page">
  <div class="stage">
    <SkyViewer {sky} />
  </div>

  <aside class="info">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/skies">Skies</a>
    </nav>
    <h1 class="display">{sky.name}</h1>
    <p class="lede">{sky.description}</p>

    <dl class="specs">
      <div><dt>Resolution</dt><dd class="mono">{main.width} × {main.height}</dd></div>
      <div><dt>Size</dt><dd class="mono">{formatBytes(main.bytes)}</dd></div>
      <div><dt>Format</dt><dd class="mono">{formatLabel(main.format)}</dd></div>
      <div><dt>License</dt><dd class="mono"><a href={CC0_URL} rel="license">CC0 1.0</a></dd></div>
      {#if sky.sun}
        <div><dt>Sun elevation</dt><dd class="mono">{sky.sun.elevation}°</dd></div>
        <div><dt>Sun azimuth</dt><dd class="mono">{sky.sun.azimuth}°</dd></div>
      {/if}
      {#if sky.exposure != null}
        <div class="wide"><dt>Suggested exposure</dt><dd class="mono">{sky.exposure}</dd></div>
      {/if}
      <div class="wide">
        <dt>Version</dt>
        <dd class="mono">v{sky.version}{#if sky.updated}, <time datetime={sky.updated}>{sky.updated}</time>{/if}</dd>
        {#if sky.version > 1}<dd class="changes">{sky.changes}</dd>{/if}
      </div>
    </dl>

    <section class="downloads" aria-labelledby="downloads-title">
      <h2 id="downloads-title">Download</h2>
      <ul>
        {#each files as file, i (file.path)}
          <li>
            <span class="lod mono">{resolutionLabel(file)}</span>
            <span class="meta mono">{file.width}×{file.height} · {formatBytes(file.bytes)}</span>
            <a
              class="btn small"
              class:primary={i === 0}
              href={file.path}
              download={skyDownloadName(sky.slug, sky.version, file)}
              aria-label="Download {resolutionLabel(file)}, {skyDownloadName(sky.slug, sky.version, file)}"
            >
              <Icon name="download" size={14} />HDR
            </a>
            <span class="file first mono">{file.path}</span>
            {#if file.sha256}<span class="file mono" title="sha256 {file.sha256}">sha256 {file.sha256}</span>{/if}
          </li>
        {/each}
      </ul>
      <p class="fine">
        Equirectangular, +Y up, {formatLabel(main.format)}: a JPEG with an HDR gain map, so it opens as a
        normal image too. Files of a version never change; improvements ship as a new version.
        <a class="mono" href="/skies/{sky.slug}/sky.json">sky.json</a>
      </p>
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
                  <a href={file.path} download={skyDownloadName(sky.slug, v.version, file)} aria-label="Download v{v.version} {resolutionLabel(file)}, {skyDownloadName(sky.slug, v.version, file)}">{resolutionLabel(file)}</a>
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if sky.tags?.length}
      <ul class="tags" aria-label="Tags">
        {#each sky.tags as tag (tag)}
          <li><a class="pill" href="/skies?search={encodeURIComponent(tag)}">{tag}</a></li>
        {/each}
      </ul>
    {/if}
  </aside>

  <div class="snippet">
    <UseIt path={main.path} version={sky.version} />
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

  .file {
    grid-column: 1 / -1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10.5px;
    color: var(--faint);
  }

  .first {
    margin-top: 4px;
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

  .fine {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--faint);
  }

  .fine a {
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
