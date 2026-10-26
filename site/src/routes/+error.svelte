<script lang="ts">
  import { page } from '$app/state';
  import NotFound from '#lib/components/NotFound.svelte';
</script>

<svelte:head>
  <title>{page.status === 404 ? "Page not found" : "Something went wrong"} | tevy</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if page.status === 404}
  <NotFound />
{:else}
  <NotFound title="Something went wrong." message={page.error?.message ?? "Please try again in a moment."} />
{/if}
