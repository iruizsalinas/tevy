<script lang="ts">
  import { onMount } from 'svelte';
  import { latestPath } from '#lib/catalog';
  import { SITE_URL } from '#lib/models';
  import Icon from './Icon.svelte';

  // The two URLs of a file, pinned and latest, with a pointer to the docs for loader setup.
  let { path, version }: { path: string; version: number } = $props();

  const rows = $derived([
    { label: `Pinned v${version}`, url: `${SITE_URL}${path}`, note: 'never changes' },
    { label: 'Latest', url: `${SITE_URL}${latestPath(path)}`, note: 'follows new versions' },
  ]);

  let canCopy = $state(false);
  let copied = $state('');

  onMount(() => {
    canCopy = Boolean(navigator.clipboard);
  });

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    copied = url;
    setTimeout(() => (copied = ''), 1600);
  }
</script>

<div class="use">
  <h2>Use it</h2>
  <ul>
    {#each rows as row (row.label)}
      <li>
        <span class="label">{row.label}<span class="note">, {row.note}</span></span>
        <code class="mono">{row.url}</code>
        {#if canCopy}
          <button type="button" class="btn small" onclick={() => copy(row.url)} aria-label="Copy the {row.label.toLowerCase()} URL">
            <Icon name={copied === row.url ? 'check' : 'copy'} size={14} />{copied === row.url ? 'Copied' : 'Copy'}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
  <p>
    Loader setup for three.js and other engines, and when to pin: <a href="/docs">Docs</a>
  </p>
</div>

<style>
  h2 {
    margin-bottom: 8px;
    font-size: 13px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--canvas);
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 4px 12px;
    padding: 10px 14px;
  }

  li + li {
    border-top: 1px solid var(--line);
  }

  .label {
    grid-column: 1;
    font-size: 12.5px;
    font-weight: 600;
  }

  .note {
    font-weight: 400;
    color: var(--faint);
  }

  code {
    grid-column: 1;
    font-size: 12.5px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  button {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  a {
    color: var(--accent-text);
    text-underline-offset: 3px;
  }
</style>
