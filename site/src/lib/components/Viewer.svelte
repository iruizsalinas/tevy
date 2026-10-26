<script lang="ts">
  import { onMount } from 'svelte';
  import { formatBytes, type Model } from '#lib/models';
  import Icon from './Icon.svelte';
  import Segmented from './Segmented.svelte';

  // The interactive 3D view of a model. The prerendered page shows the preview image; three.js
  // loads only after mount and fades in over it.
  let { model, lod = $bindable(0) }: { model: Model; lod?: number } = $props();

  interface Stats {
    triangles: number;
    vertices: number;
    textures: number;
    maxTexture: number;
    materials: number;
  }

  let container = $state<HTMLElement>();
  let viewer: any = null;
  let mounted = $state(false);
  let ready = $state(false);
  let touched = $state(false);
  let loading = $state(false);
  let progress = $state<number | null>(null);
  let failed = $state(false);
  let stats = $state<Stats | null>(null);
  let rotate = $state(true);
  let wire = $state(false);
  let lodValue = $state(String(lod));
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;

  const choices = $derived(model.files.map((f, i) => ({ value: String(i), label: `LOD${f.lod}` })));
  const file = $derived(model.files[lod]);

  async function show(index: number) {
    if (!viewer) return;
    loading = true;
    failed = false;
    try {
      const s = await viewer.load(model.files[index].path);
      if (s && index === lod) stats = s;
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
    import('#lib/viewer/engine.js').then(({ Viewer }) => {
      if (disposed || !container) return;
      viewer = new Viewer(container, {
        onStatus: (s: { state: string; progress?: number | null }) => {
          if (s.state === 'loading') progress = s.progress ?? null;
        },
      });
      viewer.setAutoRotate(rotate);
      show(lod);
    });
    return () => {
      disposed = true;
      viewer?.dispose();
      viewer = null;
    };
  });

  $effect(() => {
    const next = Number(lodValue);
    if (next !== lod) {
      lod = next;
      show(next);
    }
  });

  // Read the state before the optional call: `viewer?.f(x)` skips evaluating `x` while the viewer
  // is still loading, and the effect would then never subscribe to it.
  $effect(() => {
    const on = rotate;
    viewer?.setAutoRotate(on);
  });

  $effect(() => {
    const on = wire;
    viewer?.setWireframe(on);
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
  aria-label="Interactive 3D preview"
  onpointerdown={() => (touched = true)}
>
  <img class="poster" src={model.preview} alt="{model.name}, 3D model preview" width="1024" height="1024" />

  {#if mounted}
    <div class="ui">
      <div class="top">
        {#if choices.length > 1}
          <div class="glass"><Segmented bind:value={lodValue} {choices} label="Level of detail" /></div>
        {/if}
        <div class="actions glass">
          <button type="button" aria-pressed={rotate} title="Auto-rotate" onclick={() => (rotate = !rotate)}>
            <Icon name="refresh" size={17} /><span class="sr-only">Auto-rotate</span>
          </button>
          <button type="button" aria-pressed={wire} title="Wireframe" onclick={() => (wire = !wire)}>
            <Icon name="wireframe" size={17} /><span class="sr-only">Wireframe</span>
          </button>
          <button type="button" title="Reset view" onclick={() => viewer?.frame(true)}>
            <Icon name="frame" size={17} /><span class="sr-only">Reset view</span>
          </button>
          {#if canFullscreen}
            <button type="button" title="Fullscreen" onclick={fullscreen}>
              <Icon name="expand" size={17} /><span class="sr-only">Fullscreen</span>
            </button>
          {/if}
        </div>
      </div>

      {#if stats}
        <dl class="stats glass mono" aria-live="polite">
          <div><dt>Triangles</dt><dd>{stats.triangles.toLocaleString('en-US')}</dd></div>
          <div><dt>Vertices</dt><dd>{stats.vertices.toLocaleString('en-US')}</dd></div>
          <div><dt>File</dt><dd>{formatBytes(file.bytes)}</dd></div>
          <div class="extra"><dt>Textures</dt><dd>{stats.textures}{stats.maxTexture ? ` · ${stats.maxTexture}px` : ''}</dd></div>
          <div class="extra"><dt>Materials</dt><dd>{stats.materials}</dd></div>
        </dl>
      {/if}
    </div>

    {#if loading || failed}
      <div class="status glass mono" role="status">
        {#if failed}
          The 3D preview could not be loaded.
        {:else}
          <span class="bar" class:indeterminate={progress == null}><span style:width={progress == null ? '35%' : `${Math.round(progress * 100)}%`}></span></span>
          Loading {progress == null ? '' : `${Math.round(progress * 100)}%`}
        {/if}
      </div>
    {/if}

    <p class="hint">Drag to orbit, scroll or pinch to zoom</p>
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
    background-color: var(--canvas);
    background-image:
      radial-gradient(70% 60% at 50% 42%, rgb(255 228 196 / 0.2), transparent 75%),
      radial-gradient(var(--dot) 1px, transparent 1px);
    background-size:
      auto,
      18px 18px;
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
    object-fit: contain;
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

  /* The Segmented control brings its own frame; the glass wrapper replaces it here. */
  .viewer .glass :global(.segmented) {
    border: 0;
    background: transparent;
  }

  .ui {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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

  .top > *,
  .stats {
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

  .stats {
    align-self: flex-start;
    display: flex;
    flex-wrap: wrap;
    margin: 0;
    padding: 7px 2px;
  }

  .stats div {
    padding: 0 10px;
  }

  .stats div + div {
    border-left: 1px solid rgb(163 122 92 / 0.45);
  }

  dt {
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--faint);
  }

  dd {
    margin: 0;
    font-size: 12px;
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
    color: rgb(255 244 230 / 0.55);
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

    .hint,
    .extra {
      display: none;
    }

    .stats div {
      padding: 0 8px;
    }
  }
</style>
