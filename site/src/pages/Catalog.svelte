<script lang="ts">
  import Layout from './Layout.svelte';
  import { onMount } from 'svelte';
  import { KINDS, kindInfo, type Item, type Kind } from '#lib/catalog';
  import { SITE_URL, categoryLabel } from '#lib/models';
  import Icon from '#lib/components/Icon.svelte';
  import ItemCard from '#lib/components/ItemCard.svelte';
  import Segmented from '#lib/components/Segmented.svelte';

  // One catalog page for every section (/models, /skies) and for the featured home page (kind null),
  // where items from all sections are mixed and the filter picks a section instead of a category.
  let {
    items: built,
    kind,
    sections,
  }: { items: Item[]; kind: Kind | null; sections: { kind: Kind; count: number }[] } = $props();

  const info = $derived(kind ? kindInfo(kind) : null);
  const home = $derived(!kind);
  const noun = $derived(info ? info.singular : 'item');
  const plural = $derived(info ? info.label.toLowerCase() : 'items');
  const title = $derived(info ? `All ${plural} | tevy` : 'tevy: free CC0 3D models and skies for the web');
  const description = $derived(
    info
      ? `Browse every free CC0 ${noun} on tevy. ${info.blurb}`
      : 'Free, browser-sized 3D models and HDR skies for three.js and any glTF engine: cars, trees, rocks and road props with LODs, meshopt and KTX2. CC0, free for any use.',
  );
  const canonical = $derived(info ? `${SITE_URL}/${info.kind}` : `${SITE_URL}/`);

  // Newer list from /<kind>.json, if it differs from the one this page was built with.
  let fetched = $state<Item[] | null>(null);
  const items = $derived(fetched ?? built);
  let filter = $state('');
  let query = $state('');
  let ready = $state(false);
  let search = $state<HTMLInputElement>();
  // The home page filters by section, a section page by category.
  const param = $derived(home ? 'section' : 'category');
  const groupOf = (item: Item) => (home ? item.kind : item.category);
  const groupLabel = (value: string) => (home ? kindInfo(value as Kind).label : categoryLabel(value));

  const choices = $derived([
    { value: '', label: 'All' },
    ...[...new Set(items.map(groupOf))].sort().map((value) => ({ value, label: groupLabel(value) })),
  ]);

  const shown = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((m) => {
      if (filter && groupOf(m) !== filter) return false;
      const hay = [m.name, m.slug, m.category, ...(m.tags ?? [])].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  });

  onMount(() => {
    const params = new URLSearchParams(location.search);
    filter = params.get(param) ?? '';
    query = params.get('search') ?? '';
    ready = true;

    // Pick up items published after this page was built.
    if (!kind) return;
    const section = kind;
    fetch(`/${section}.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((index) => {
        const list = index?.[section];
        if (!Array.isArray(list)) return;
        const key = (l: { slug: string; version: number; updated?: string }[]) => l.map((m) => `${m.slug}@${m.version}@${m.updated ?? ''}`).join();
        if (key(list) !== key(items)) fetched = list.map((m: object) => ({ ...m, kind: section }) as Item);
      })
      .catch(() => {});
  });

  // Keep the filters in the address bar so filtered views can be shared.
  $effect(() => {
    const params = new URLSearchParams();
    if (filter) params.set(param, filter);
    if (query.trim()) params.set('search', query.trim());
    if (!ready) return;
    const qs = params.toString();
    history.replaceState(history.state, '', qs ? `?${qs}` : location.pathname);
  });

  function clear() {
    filter = '';
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
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {#if info}<link rel="alternate" type="application/json" href="/{info.kind}.json" />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="tevy" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content="{SITE_URL}/tevy.png" />
</svelte:head>

<Layout>

<div class="catalog">
  <header class="intro">
    {#if info}
      <h1 class="display">All {plural}</h1>
      <p>{info.blurb}</p>
    {:else}
      <h1 class="display">Featured</h1>
      <p>
        Free, browser-sized assets for three.js and any glTF engine, CC0 for any use. Browse
        {#each sections as s, i (s.kind)}{#if i}{i === sections.length - 1 ? ' or ' : ', '}{/if}<a href="/{s.kind}">all {s.count} {kindInfo(s.kind).label.toLowerCase()}</a>{/each}.
      </p>
    {/if}
  </header>

  <div class="toolbar">
    {#if choices.length > 2}
      <Segmented bind:value={filter} {choices} label={home ? 'Section' : 'Category'} />
    {/if}
    <label class="search">
      <Icon name="search" size={15} />
      <span class="sr-only">Search {plural}</span>
      <input bind:this={search} bind:value={query} type="search" placeholder="Search {plural}" autocomplete="off" spellcheck="false" />
      {#if !query}<kbd aria-hidden="true">/</kbd>{/if}
    </label>
    <p class="count mono" aria-live="polite">{shown.length} {shown.length === 1 ? noun : plural}</p>
  </div>

  <h2 class="sr-only">{info ? `All ${plural}` : 'Featured'}</h2>
  {#if shown.length}
    <ul class="grid">
      {#each shown as item, i (`${item.kind}/${item.slug}`)}
        <li><ItemCard {item} eager={i < 8} label={home && KINDS.length > 1 && item.kind !== 'models' ? kindInfo(item.kind).singular : ''} /></li>
      {/each}
    </ul>
  {:else}
    <div class="empty">
      <p>No {plural} match your search.</p>
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

  .intro a {
    color: var(--text);
    text-underline-offset: 3px;
    text-decoration-color: var(--line-strong);
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
