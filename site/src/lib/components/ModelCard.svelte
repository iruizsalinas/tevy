<script lang="ts">
  import { formatBytes, formatCount, lod0, modelUrl, type Model } from '#lib/models';

  let { model, eager = false }: { model: Model; eager?: boolean } = $props();
  const main = $derived(lod0(model));
</script>

<a class="card" href={modelUrl(model)}>
  <span class="media">
    <img
      src={model.preview}
      alt="{model.name}, 3D model preview"
      width="1024"
      height="1024"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  </span>
  <span class="body">
    <span class="name">{model.name}</span>
    <span class="meta mono">{formatCount(main.triangles)} tris · {formatBytes(main.bytes)}</span>
  </span>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    overflow: hidden;
    text-decoration: none;
    transition:
      border-color 0.15s,
      background 0.15s,
      box-shadow 0.2s;
  }

  .card:hover {
    border-color: var(--line-strong);
    background: var(--raised);
    box-shadow: var(--shadow);
  }

  /* Previews are cut out, so models sit right on the panel under a soft warm light. */
  .media {
    display: block;
    aspect-ratio: 1;
    background: radial-gradient(58% 52% at 50% 46%, rgb(255 226 190 / 0.17), transparent 72%);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .card:hover img {
    transform: translateY(-3px) scale(1.03);
  }

  .body {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 12px 11px;
  }

  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13.5px;
    font-weight: 600;
  }

  .meta {
    flex: none;
    font-size: 11px;
    color: var(--faint);
  }

  @media (max-width: 640px) {
    .body {
      flex-direction: column;
      gap: 1px;
      padding: 7px 10px 9px;
    }

    .name {
      max-width: 100%;
    }
  }
</style>
