<script lang="ts">
  import Layout from './Layout.svelte';
  import NotFound from '#lib/components/NotFound.svelte';
</script>

<svelte:head>
  <title>Page not found | tevy</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<Layout>
  <NotFound />
</Layout>
