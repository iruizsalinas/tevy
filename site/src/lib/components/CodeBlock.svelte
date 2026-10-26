<script lang="ts">
  import { onMount } from 'svelte';
  import { highlight, type Lang } from '#lib/highlight';
  import Icon from './Icon.svelte';

  let { code, title, lang = 'js' }: { code: string; title: string; lang?: Lang } = $props();

  const tokens = $derived(highlight(code, lang));

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
  <pre class="mono"><code>{#each tokens as token, i (i)}{#if token.kind}<span class={token.kind}>{token.text}</span>{:else}{token.text}{/if}{/each}</code></pre>
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
    background: var(--code-bg);
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--code-text);
    tab-size: 2;
  }

  /* Colors of a code editor's dark theme, kept readable on the cocoa panel. */
  .comment {
    color: #8fb573;
    font-style: italic;
  }

  .string {
    color: #dd9a74;
  }

  .number {
    color: #c3dcae;
  }

  .control {
    color: #d7a2d6;
  }

  .keyword,
  .tag {
    color: #7fb2e5;
  }

  .function {
    color: #e6e6b0;
  }

  .type {
    color: #6fd6bd;
  }

  .constant {
    color: #6fcbff;
  }

  .variable,
  .attr {
    color: #a8dcfe;
  }

  .punct {
    color: #a99887;
  }

  @media (max-width: 640px) {
    pre {
      font-size: 11.5px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }
</style>
