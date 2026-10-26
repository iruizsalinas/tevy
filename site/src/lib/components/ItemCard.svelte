<script lang="ts">
  import { cardMeta, itemUrl, type Item } from '#lib/catalog';

  let { item, eager = false, label = '' }: { item: Item; eager?: boolean; label?: string } = $props();
</script>

<a class="card" class:sky={item.kind === 'skies'} href={itemUrl(item)}>
  <span class="media">
    <img
      src={item.preview}
      alt="{item.name}, {item.kind === 'skies' ? 'sky panorama' : '3D model'} preview"
      width={item.kind === 'skies' ? 1280 : 1024}
      height={item.kind === 'skies' ? 720 : 1024}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
    {#if label}<span class="label mono">{label}</span>{/if}
  </span>
  <span class="body">
    <span class="name">{item.name}</span>
    <span class="meta mono">{cardMeta(item)}</span>
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
    position: relative;
    display: block;
    aspect-ratio: 1;
    overflow: hidden;
    background: radial-gradient(58% 52% at 50% 46%, rgb(255 226 190 / 0.17), transparent 72%);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  /* Sky previews are landscape photos of the sky: they fill the square instead. */
  .sky img {
    object-fit: cover;
  }

  .card:hover img {
    transform: translateY(-3px) scale(1.03);
  }

  .sky:hover img {
    transform: scale(1.04);
  }

  .label {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 7px;
    border-radius: 5px;
    background: rgb(40 24 14 / 0.62);
    backdrop-filter: blur(8px);
    font-size: 10.5px;
    color: rgb(255 244 230 / 0.8);
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
