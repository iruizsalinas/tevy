<script lang="ts">
  import Layout from './Layout.svelte';
  import { onMount } from 'svelte';
  import { kindInfo, type Item, type Kind } from '#lib/catalog';
  import { SITE_URL, categoryLabel } from '#lib/models';
  import Icon from '#lib/components/Icon.svelte';
  import ItemCard from '#lib/components/ItemCard.svelte';
  import Segmented from '#lib/components/Segmented.svelte';

  // One catalog page for the featured home page (kind null) and every section (/models, /skies).
  // The tabs link between them; a section page also filters by category. Searching on the home
  // page searches every section.
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
  // Every item of every section, loaded on the home page once a search starts.
  let everything = $state<Item[] | null>(null);
  let category = $state('');
  let query = $state('');
  let ready = $state(false);
  let search = $state<HTMLInputElement>();
  const searching = $derived(query.trim().length > 0);
  const items = $derived(home && searching && everything ? everything : (fetched ?? built));

  const categories = $derived([
    { value: '', label: 'All' },
    ...[...new Set(items.map((m) => m.category))].sort().map((value) => ({ value, label: categoryLabel(value) })),
  ]);

  const shown = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((m) => {
      if (category && m.category !== category) return false;
      const hay = [m.name, m.slug, m.category, ...(m.tags ?? [])].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  });

  async function loadSection(section: Kind): Promise<Item[] | null> {
    try {
      const r = await fetch(`/${section}.json`, { cache: 'no-cache' });
      const list = r.ok ? (await r.json())?.[section] : null;
      return Array.isArray(list) ? list.map((m: object) => ({ ...m, kind: section }) as Item) : null;
    } catch {
      return null;
    }
  }

  onMount(() => {
    const params = new URLSearchParams(location.search);
    if (kind) category = params.get('category') ?? '';
    query = params.get('search') ?? '';
    ready = true;

    // Pick up items published after this page was built.
    if (!kind) return;
    loadSection(kind).then((list) => {
      const key = (l: Item[]) => l.map((m) => `${m.slug}@${m.version}@${m.updated ?? ''}`).join();
      if (list && key(list) !== key(items)) fetched = list;
    });
  });

  $effect(() => {
    if (!home || !searching || everything) return;
    everything = [];
    Promise.all(sections.map((s) => loadSection(s.kind))).then((lists) => {
      everything = lists.flatMap((l) => l ?? []);
    });
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
    <h1 class="display">{info ? info.label : 'Free assets for the web'}</h1>
    <p>{info ? info.blurb : 'Browser-sized 3D models and HDR skies for three.js and any glTF engine, CC0 for any use.'}</p>
  </header>

  <div class="toolbar">
    <nav class="tabs" aria-label="Sections">
      <a href="/" aria-current={home ? 'page' : undefined}>Featured</a>
      {#each sections as s (s.kind)}
        <a href="/{s.kind}" aria-current={kind === s.kind ? 'page' : undefined}>{kindInfo(s.kind).label}<span class="n mono">{s.count}</span></a>
      {/each}
    </nav>
    <label class="search">
      <Icon name="search" size={15} />
      <span class="sr-only">Search {home ? 'everything' : plural}</span>
      <input bind:this={search} bind:value={query} type="search" placeholder="Search {home ? 'everything' : plural}" autocomplete="off" spellcheck="false" />
      {#if !query}<kbd aria-hidden="true">/</kbd>{/if}
    </label>
    <p class="count mono" aria-live="polite">
      {#if !home || searching}{shown.length} {shown.length === 1 ? noun : plural}{/if}
    </p>
    {#if !home && categories.length > 2}
      <div class="categories"><Segmented bind:value={category} choices={categories} label="Category" /></div>
    {/if}
  </div>

  <h2 class="sr-only">{info ? `All ${plural}` : searching ? 'Search results' : 'Featured'}</h2>
  {#if shown.length}
    <ul class="grid" class:featured={home && !searching}>
      {#each shown as item, i (`${item.kind}/${item.slug}`)}
        <li><ItemCard {item} eager={i < 8} /></li>
      {/each}
    </ul>
  {:else if home && searching && everything?.length === 0}
    <div class="empty"><p>Searching…</p></div>
  {:else}
    <div class="empty">
      <p>Nothing matches your search.</p>
      <button type="button" class="btn" onclick={clear}>Clear filters</button>
    </div>
  {/if}
</div>

</Layout>

<style>
  .catalog {
    container-type: inline-size;
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

  .tabs {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: var(--canvas);
  }

  .tabs a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 30px;
    padding: 0 13px;
    border-radius: 6px;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .tabs a:hover {
    background: var(--hover);
    color: var(--text);
  }

  .tabs a[aria-current='page'] {
    background: var(--accent-soft);
    color: var(--text);
  }

  .tabs .n {
    font-size: 11px;
    font-weight: 400;
    color: var(--faint);
  }

  .categories {
    flex: 1 1 100%;
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

  /* Featured fills whole rows: three rows at 3 and 4 columns (5 columns fit all 15), an even
     count at 2. Breakpoints follow the 230px minimum card width and 12px gap of .grid. */
  @container (714px <= width < 956px) {
    .featured > :nth-child(n + 10) {
      display: none;
    }
  }

  @container (956px <= width < 1198px) {
    .featured > :nth-child(n + 13) {
      display: none;
    }
  }

  @container (width < 714px) {
    .featured > :nth-child(n + 15) {
      display: none;
    }
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
