<script lang="ts">
  import '@fontsource-variable/inter';
  import '@fontsource-variable/bricolage-grotesque/standard.css';
  import '@fontsource-variable/jetbrains-mono';
  import '../app.css';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';

  let { children } = $props();
</script>

<div class="page">
  <SiteHeader />
  <main>{@render children()}</main>
  <SiteFooter />
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  main {
    flex: 1;
    width: 100%;
    min-width: 0;
  }
</style>
