<script lang="ts">
  import Bear from './Bear.svelte';

  // The teddy's head: Tevy's mark. Hops when hovered.
  let { size = 24, track = false }: { size?: number; track?: boolean } = $props();
</script>

<span class="logo"><Bear size={size * 1.15} simple {track} label="Tevy" /></span>

<style>
  .logo {
    display: inline-flex;
    transition: transform 0.35s cubic-bezier(0.3, 1.8, 0.5, 1);
  }

  :global(a:hover) > .logo,
  .logo:hover {
    transform: translateY(-3px) rotate(-6deg);
  }
</style>
