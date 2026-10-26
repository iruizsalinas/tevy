<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  let { code, title }: { code: string; title: string } = $props();

  let canCopy = $state(false);
  let copied = $state(false);

  onMount(() => {
    canCopy = Boolean(navigator.clipboard);
  });

  async function copy() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => (copied = false), 1600);
  }
</script>

<div class="block">
  <div class="head">
    <h2>{title}</h2>
    {#if canCopy}
      <button type="button" class="btn small" onclick={copy}>
        <Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Copied' : 'Copy'}
      </button>
    {/if}
  </div>
  <pre class="mono"><code>{code}</code></pre>
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 28px;
    margin-bottom: 8px;
  }

  h2 {
    font-size: 13px;
  }

  pre {
    margin: 0;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--canvas);
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--muted);
    tab-size: 2;
  }

  @media (max-width: 640px) {
    pre {
      font-size: 11.5px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }
</style>
