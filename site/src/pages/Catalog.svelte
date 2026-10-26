<script lang="ts">
  import Layout from './Layout.svelte';
  import { onMount } from 'svelte';
  import { SITE_URL, categoryLabel, type Model } from '#lib/models';
  import Icon from '#lib/components/Icon.svelte';
  import ModelCard from '#lib/components/ModelCard.svelte';
  import Segmented from '#lib/components/Segmented.svelte';

  let { models: built }: { models: Model[] } = $props();

  // Newer list from /models.json, if it differs from the one this page was built with.
  let fetched = $state<Model[] | null>(null);
  const models = $derived(fetched ?? built);
  let category = $state('');
  let query = $state('');
  let ready = $state(false);
  let search = $state<HTMLInputElement>();

  const categories = $derived([
    { value: '', label: 'All' },
    ...[...new Set(models.map((m) => m.category))].sort().map((c) => ({ value: c, label: categoryLabel(c) })),
  ]);

  const shown = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return models.filter((m) => {
      if (category && m.category !== category) return false;
      const hay = [m.name, m.slug, m.category, ...(m.tags ?? [])].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  });

  onMount(() => {
    const params = new URLSearchParams(location.search);
    category = params.get('category') ?? '';
    query = params.get('search') ?? '';
    ready = true;

    // Pick up models published after this page was built.
    fetch('/models.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((index) => {
        if (!index || !Array.isArray(index.models)) return;
        const key = (list: Model[]) => list.map((m) => `${m.slug}@${m.version}@${m.updated ?? ''}`).join();
        if (key(index.models) !== key(models)) fetched = index.models;
      })
      .catch(() => {});
  });

  // Keep the filters in the address bar so filtered views can be shared.
  $effect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query.trim()) params.set('search', query.trim());
    if (!ready) return;
    const qs = params.toString();
    history.replaceState(history.state, '', qs ? `?${qs}` : location.pathname);
  });

  function clear() {
    category = '';
    query = '';
  }

  function onkeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (event.key === '/' && !target.closest('input, textarea')) {
      event.preventDefault();
      search?.focus();
    }
  }
</script>

<svelte:window {onkeydown} />

<svelte:head>
  <title>All models | tevy</title>
  <meta
    name="description"
    content="Browse every free CC0 3D model on tevy: cars, trees, plants, rocks and road props as compact glTF with LODs, meshopt geometry and KTX2 textures."
  />
  <link rel="canonical" href="{SITE_URL}/models" />
  <link rel="alternate" type="application/json" href="/models.json" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="tevy" />
  <meta property="og:title" content="All models | tevy" />
  <meta property="og:description" content="Cars, trees, rocks and props as compact glTF for three.js and any engine. CC0, free for any use." />
  <meta property="og:url" content="{SITE_URL}/models" />
  <meta property="og:image" content="{SITE_URL}/tevy.png" />
</svelte:head>

<Layout>

<div class="catalog">
  <header class="intro">
    <h1 class="display">All models</h1>
    <p>Every model is CC0 glTF with LODs, meshopt geometry and KTX2 textures.</p>
  </header>

  <div class="toolbar">
    {#if categories.length > 2}
      <Segmented bind:value={category} choices={categories} label="Category" />
    {/if}
    <label class="search">
      <Icon name="search" size={15} />
      <span class="sr-only">Search models</span>
      <input bind:this={search} bind:value={query} type="search" placeholder="Search models" autocomplete="off" spellcheck="false" />
      {#if !query}<kbd aria-hidden="true">/</kbd>{/if}
    </label>
    <p class="count mono" aria-live="polite">{shown.length} model{shown.length === 1 ? '' : 's'}</p>
  </div>

  <h2 class="sr-only">All models</h2>
  {#if shown.length}
    <ul class="grid">
      {#each shown as model, i (model.slug)}
        <li><ModelCard {model} eager={i < 8} /></li>
      {/each}
    </ul>
  {:else}
    <div class="empty">
      <p>No models match your search.</p>
      <button type="button" class="btn" onclick={clear}>Clear filters</button>
    </div>
  {/if}
</div>

</Layout>

<style>
  .catalog {
    max-width: 1480px;
    margin: 0 auto;
    padding: 0 clamp(16px, 3vw, 32px) 56px;
  }

  .intro {
    padding: clamp(24px, 4vw, 44px) 0 clamp(12px, 2vw, 20px);
  }

  h1 {
    font-size: clamp(26px, 3vw, 36px);
    line-height: 1.05;
  }

  .intro p {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 15px;
  }

  .toolbar {
    position: sticky;
    top: 56px;
    z-index: 20;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    background: var(--bg);
  }

  .search {
    position: relative;
    flex: 0 1 280px;
    min-width: 0;
    margin-left: auto;
    color: var(--faint);
  }

  .search :global(.icon) {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 32px;
    padding: 0 30px 0 32px;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background: var(--canvas);
    font-size: 13.5px;
    outline: none;
    transition:
      border-color 0.12s,
      background 0.12s;
  }

  input::placeholder {
    color: var(--faint);
  }

  input:focus {
    border-color: var(--accent-line);
    background: var(--panel);
  }

  input::-webkit-search-cancel-button {
    display: none;
  }

  kbd {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 11px;
    pointer-events: none;
  }

  .count {
    margin: 0;
    font-size: 12px;
    color: var(--faint);
    white-space: nowrap;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 64px 0;
    color: var(--muted);
  }

  .empty p {
    margin: 0;
  }

  @media (max-width: 640px) {
    .toolbar {
      gap: 8px;
    }

    .search {
      flex: 1 1 100%;
      order: -1;
      margin-left: 0;
    }

    .count {
      margin-left: auto;
    }

    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
  }
</style>
