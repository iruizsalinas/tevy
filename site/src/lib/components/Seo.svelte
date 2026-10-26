<script lang="ts">
  import { SITE_URL } from '#lib/models';

  // The search and social tags of a page, the same on every page. Titles read "<page> | tevy".
  interface Props {
    title: string;
    description: string;
    /** Site path of the page, e.g. /models/norway-spruce. */
    path: string;
    /** Social preview image; the logo when not given. */
    image?: { path: string; width: number; height: number; alt: string };
    /** The page's metadata file, linked as a JSON alternate. */
    json?: string;
  }

  let { title, description, path, image, json }: Props = $props();

  const full = $derived(`${title} | tevy`);
  const url = $derived(`${SITE_URL}${path}`);
  const og = $derived(image ?? { path: '/tevy.png', width: 1024, height: 1024, alt: 'The tevy bear logo' });
</script>

<svelte:head>
  <title>{full}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  {#if json}<link rel="alternate" type="application/json" href={json} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="tevy" />
  <meta property="og:title" content={full} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content="{SITE_URL}{og.path}" />
  <meta property="og:image:width" content={String(og.width)} />
  <meta property="og:image:height" content={String(og.height)} />
  <meta property="og:image:alt" content={og.alt} />
  <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
</svelte:head>
