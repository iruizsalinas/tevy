<script lang="ts">
  import { onMount } from 'svelte';
  import { resolutionLabel, type Sky } from '#lib/skies';
  import Icon from './Icon.svelte';
  import Segmented from './Segmented.svelte';

  // The interactive view of a sky. The prerendered page shows the preview image; three.js loads
  // only after mount and fades in over it.
  let { sky }: { sky: Sky } = $props();

  let container = $state<HTMLElement>();
  let viewer: any = null;
  let mounted = $state(false);
  let ready = $state(false);
  let touched = $state(false);
  let loading = $state(false);
  let progress = $state<number | null>(null);
  let failed = $state(false);
  let rotate = $state(true);
  let showScene = $state(true);
  // Largest file first: the viewer starts with the full-size panorama.
  const files = $derived([...sky.files].sort((a, b) => b.width - a.width));
  let fileValue = $state('0');
  const choices = $derived(files.map((f, i) => ({ value: String(i), label: resolutionLabel(f) })));
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;

  async function show(index: number) {
    if (!viewer) return;
    loading = true;
    failed = false;
    try {
      await viewer.load(files[index].path, { exposure: sky.exposure ?? 1, sun: sky.sun });
      ready = true;
    } catch (err) {
      console.error(err);
      failed = true;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    let disposed = false;
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return;
    mounted = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) rotate = false;
    import('#lib/viewer/sky.js').then(({ SkyViewer }) => {
      if (disposed || !container) return;
      viewer = new SkyViewer(container, {
        onStatus: (s: { state: string; progress?: number | null }) => {
          if (s.state === 'loading') progress = s.progress ?? null;
        },
      });
      viewer.setAutoRotate(rotate);
      show(Number(fileValue));
    });
    return () => {
      disposed = true;
      viewer?.dispose();
      viewer = null;
    };
  });

  let shown = '0';
  $effect(() => {
    const next = fileValue;
    if (next !== shown) {
      shown = next;
      show(Number(next));
    }
  });

  // Read the state before the optional call so the effect subscribes while the viewer loads.
  $effect(() => {
    const on = rotate;
    viewer?.setAutoRotate(on);
  });

  $effect(() => {
    const on = showScene;
    viewer?.setScene(on);
  });

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else container?.requestFullscreen?.();
  }
</script>

<section
  class="viewer"
  class:ready
  class:touched
  bind:this={container}
  aria-label="Interactive sky preview"
  onpointerdown={() => (touched = true)}
>
  <img class="poster" src={sky.preview} alt="{sky.name}, sky panorama preview" width="1280" height="720" />

  {#if mounted}
    <div class="ui">
      <div class="top">
        {#if choices.length > 1}
          <div class="glass"><Segmented bind:value={fileValue} {choices} label="Resolution" /></div>
        {/if}
        <div class="actions glass">
          <button type="button" aria-pressed={rotate} title="Auto-rotate" onclick={() => (rotate = !rotate)}>
            <Icon name="refresh" size={17} /><span class="sr-only">Auto-rotate</span>
          </button>
          <button type="button" aria-pressed={showScene} title="Show the road scene" onclick={() => (showScene = !showScene)}>
            <Icon name="layers" size={17} /><span class="sr-only">Show the road scene</span>
          </button>
          <button type="button" title="Reset view" onclick={() => viewer?.reset()}>
            <Icon name="frame" size={17} /><span class="sr-only">Reset view</span>
          </button>
          {#if canFullscreen}
            <button type="button" title="Fullscreen" onclick={fullscreen}>
              <Icon name="expand" size={17} /><span class="sr-only">Fullscreen</span>
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if loading || failed}
      <div class="status glass mono" role="status">
        {#if failed}
          The sky could not be loaded.
        {:else}
          <span class="bar" class:indeterminate={progress == null}><span style:width={progress == null ? '35%' : `${Math.round(progress * 100)}%`}></span></span>
          Loading {progress == null ? '' : `${Math.round(progress * 100)}%`}
        {/if}
      </div>
    {/if}

    <p class="hint">Drag to look around the sky and the car</p>
  {/if}
</section>

<style>
  .viewer {
    position: relative;
    height: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    isolation: isolate;
    touch-action: none;
    background: var(--canvas);
  }

  .viewer:fullscreen {
    border: 0;
    border-radius: 0;
  }

  .poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.5s ease;
  }

  .ready .poster {
    opacity: 0;
    pointer-events: none;
  }

  .viewer :global(.viewer-canvas) {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    opacity: 0;
    transition: opacity 0.5s ease;
    cursor: grab;
  }

  .viewer :global(.viewer-canvas:active) {
    cursor: grabbing;
  }

  .ready :global(.viewer-canvas) {
    opacity: 1;
  }

  .glass {
    border: 1px solid rgb(163 122 92 / 0.6);
    border-radius: var(--radius);
    background: rgb(70 44 28 / 0.6);
    backdrop-filter: blur(12px);
  }

  .viewer .glass :global(.segmented) {
    border: 0;
    background: transparent;
  }

  .ui {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: 12px;
    pointer-events: none;
  }

  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .top > * {
    pointer-events: auto;
  }

  .actions {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    margin-left: auto;
  }

  .actions button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    transition:
      background 0.12s,
      color 0.12s;
  }

  .actions button:hover {
    background: var(--hover);
    color: var(--text);
  }

  .actions button[aria-pressed='true'] {
    background: var(--accent-soft);
    color: var(--accent-line);
  }

  .status {
    position: absolute;
    left: 50%;
    bottom: 20px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    transform: translateX(-50%);
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
  }

  .bar {
    display: block;
    width: 150px;
    height: 3px;
    border-radius: 3px;
    background: rgb(255 244 230 / 0.14);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.2s ease;
  }

  .bar.indeterminate span {
    animation: slide 1.1s ease-in-out infinite;
  }

  @keyframes slide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(300%);
    }
  }

  .hint {
    position: absolute;
    z-index: 2;
    right: 14px;
    bottom: 14px;
    margin: 0;
    font-size: 12px;
    color: rgb(255 244 230 / 0.7);
    text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
    pointer-events: none;
    transition: opacity 0.4s ease;
  }

  .touched .hint {
    opacity: 0;
  }

  @media (max-width: 640px) {
    .viewer {
      border-inline: 0;
      border-radius: 0;
    }

    .ui {
      padding: 10px;
    }

    .hint {
      display: none;
    }
  }
</style>
