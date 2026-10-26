<script lang="ts">
  import Layout from './Layout.svelte';
  import { CC0_URL, SITE_URL, formatBytes } from '#lib/models';
  import { mapLabel, materialDownloadName, materialSets, setLabel, type Material } from '#lib/materials';
  import Seo from '#lib/components/Seo.svelte';
  import { firstSentence } from '#lib/catalog';
  import MaterialViewer from '#lib/components/MaterialViewer.svelte';
  import UseIt from '#lib/components/UseIt.svelte';

  // sky: the sky that lights the viewer, from its metadata.
  let { material, sky }: { material: Material; sky: { path: string; exposure?: number; sun?: unknown } | null } = $props();

  const sets = $derived(materialSets(material.files));
  const main = $derived(sets[0]);
  const older = $derived(material.versions.filter((v) => v.version !== material.version));

  const url = $derived(`${SITE_URL}/materials/${material.slug}`);
  const description = $derived(
    `${firstSentence(material.description)} Free CC0 PBR material for three.js and other engines.`,
  );
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: material.name,
      description: material.description,
      url,
      contentUrl: `${SITE_URL}${main.files[0].path}`,
      thumbnailUrl: `${SITE_URL}${material.preview}`,
      keywords: (material.tags ?? []).join(', '),
      license: CC0_URL,
      isAccessibleForFree: true,
      dateCreated: material.created,
      dateModified: material.updated,
    }).replace(/</g, '\\u003c'),
  );
</script>

<Seo
  title="{material.name}, free CC0 PBR material"
  {description}
  path="/materials/{material.slug}"
  json="/materials/{material.slug}.json"
  image={{ path: material.preview, width: 1024, height: 1024, alt: `${material.name}, material preview` }}
/>

<svelte:head>
  <link rel="preload" as="image" href={material.preview} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<Layout>

<div class="page">
  <div class="stage">
    <MaterialViewer {material} {sky} />
  </div>

  <aside class="info">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/materials">Materials</a>
    </nav>
    <h1 class="display">{material.name}</h1>
    <p class="lede">{material.description}</p>

    <dl class="specs">
      <div><dt>Tile size</dt><dd class="mono">{material.tileSize} × {material.tileSize} m</dd></div>
      <div><dt>Resolution</dt><dd class="mono">{main.width} × {main.width}</dd></div>
      <div><dt>Size</dt><dd class="mono">{formatBytes(main.bytes)}</dd></div>
      <div><dt>License</dt><dd class="mono"><a href={CC0_URL} rel="license">CC0 1.0</a></dd></div>
      <div class="wide"><dt>Maps</dt><dd class="mono">Color, normal (OpenGL), ORM · KTX2</dd></div>
      <div class="wide">
        <dt>Version</dt>
        <dd class="mono">v{material.version}{#if material.updated}, <time datetime={material.updated}>{material.updated}</time>{/if}</dd>
        {#if material.version > 1}<dd class="changes">{material.changes}</dd>{/if}
      </div>
    </dl>

    <section class="downloads" aria-labelledby="downloads-title">
      <h2 id="downloads-title">Download</h2>
      <ul>
        {#each sets as set (set.width)}
          <li>
            <span class="lod mono">{setLabel(set.width)}</span>
            <span class="meta mono">{formatBytes(set.bytes)}</span>
            <span class="maps">
              {#each set.files as file (file.path)}
                <a
                  class="btn small"
                  href={file.path}
                  download={materialDownloadName(material.slug, material.version, file)}
                  aria-label="Download {setLabel(set.width)} {mapLabel(file.map)} map, {materialDownloadName(material.slug, material.version, file)}"
                >
                  {mapLabel(file.map)}
                </a>
              {/each}
            </span>
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
                  <a href={file.path} download={materialDownloadName(material.slug, v.version, file)} aria-label="Download v{v.version} {setLabel(file.width)} {mapLabel(file.map)} map">{file.map} {setLabel(file.width)}</a>
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if material.tags?.length}
      <ul class="tags" aria-label="Tags">
        {#each material.tags as tag (tag)}
          <li><a class="pill" href="/materials?search={encodeURIComponent(tag)}">{tag}</a></li>
        {/each}
      </ul>
    {/if}
  </aside>

  <div class="snippet">
    <UseIt path={main.files[0].path} version={material.version} />
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

  .maps {
    display: flex;
    gap: 4px;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
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
