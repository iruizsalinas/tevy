<script lang="ts">
  import Layout from './Layout.svelte';
  import { SITE_URL, categoryLabel, loadSnippet, lod0, type Model } from '#lib/models';
  import CodeBlock from '#lib/components/CodeBlock.svelte';
  import ModelCard from '#lib/components/ModelCard.svelte';

  let { models }: { models: Model[] } = $props();

  const latest = $derived(
    [...models].sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '') || a.slug.localeCompare(b.slug)).slice(0, 8),
  );
  const categories = $derived(
    [...new Set(models.map((m) => m.category))].sort().map((c) => ({
      value: c,
      label: categoryLabel(c),
      count: models.filter((m) => m.category === c).length,
    })),
  );
  const example = $derived(models.find((m) => m.slug === 'norway-spruce') ?? models[0]);
</script>

<svelte:head>
  <title>tevy: free CC0 3D models for the web</title>
  <meta
    name="description"
    content="Free, high-quality 3D models sized for the browser: cars, trees, rocks and props as compact glTF with LODs, meshopt geometry and KTX2 textures. CC0, no attribution required."
  />
  <link rel="canonical" href="{SITE_URL}/" />
  <link rel="alternate" type="application/json" href="/models.json" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="tevy" />
  <meta property="og:title" content="tevy: free CC0 3D models for the web" />
  <meta property="og:description" content="Cars, trees, rocks and props as compact glTF for three.js and any engine. CC0, free for any use." />
  <meta property="og:url" content="{SITE_URL}/" />
  <meta property="og:image" content="{SITE_URL}/tevy.png" />
</svelte:head>

<Layout>
  <div class="home">
    <header class="intro">
      <h1 class="display">Free 3D models, sized for the browser</h1>
      <p>CC0 glTF with LODs, meshopt geometry and KTX2 textures. No account, no attribution.</p>
      <div class="actions">
        <a class="btn primary" href="/models/">Browse all {models.length} models</a>
        <a class="btn" href="/license/">What CC0 means</a>
      </div>
      {#if categories.length > 1}
        <ul class="categories">
          {#each categories as c (c.value)}
            <li><a class="pill" href="/models/?category={encodeURIComponent(c.value)}">{c.label} <span class="mono">{c.count}</span></a></li>
          {/each}
        </ul>
      {/if}
    </header>

    <section>
      <div class="section-head">
        <h2>Latest models</h2>
        <a href="/models/">View all</a>
      </div>
      <ul class="grid">
        {#each latest as model, i (model.slug)}
          <li><ModelCard {model} eager={i < 4} /></li>
        {/each}
      </ul>
    </section>

    {#if example}
      <section class="use">
        <div class="section-head">
          <h2>Load one in three.js</h2>
        </div>
        <p>Every file is a plain HTTPS download, so you can load models straight from tevy.dev or copy them into your project.</p>
        <CodeBlock title="JavaScript" code={loadSnippet(lod0(example))} />
      </section>
    {/if}
  </div>
</Layout>

<style>
  .home {
    max-width: 1480px;
    margin: 0 auto;
    padding: 0 clamp(16px, 3vw, 32px) 40px;
  }

  .intro {
    padding: clamp(28px, 5vw, 56px) 0 clamp(20px, 3vw, 32px);
  }

  h1 {
    max-width: 16ch;
    font-size: clamp(30px, 4.6vw, 52px);
    line-height: 1.04;
  }

  .intro p {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 15.5px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .categories a {
    text-decoration: none;
  }

  .categories a:hover {
    border-color: var(--accent-line);
    color: var(--text);
  }

  .categories .mono {
    color: var(--faint);
    font-size: 11px;
  }

  section {
    margin-top: 12px;
  }

  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 17px;
  }

  .section-head a {
    color: var(--muted);
    font-size: 13px;
    text-underline-offset: 3px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .use {
    max-width: 860px;
    margin-top: 40px;
  }

  .use p {
    margin: 0 0 12px;
    color: var(--muted);
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
  }
</style>
