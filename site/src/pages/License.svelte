<script lang="ts">
  import Layout from './Layout.svelte';
  import { CC0_URL } from '#lib/models';
  import Seo from '#lib/components/Seo.svelte';
</script>

<Seo
  title="License"
  description="Every tevy model and sky is CC0 1.0: public domain and free for personal and commercial use, with no attribution required. The website code is MIT."
  path="/license"
/>

<Layout>
  <article class="license">
    <h1 class="display">License</h1>
    <p class="lead">
      Every model and sky on tevy is released under <a href={CC0_URL} rel="license">CC0 1.0</a>. That puts it in the public domain: you can use it
      for anything, without asking and without giving credit.
    </p>

    <section>
      <h2>What you can do</h2>
      <ul>
        <li>Use the models, skies and materials in games, apps, websites, films, renders and prints, commercial or not.</li>
        <li>Change them: re-texture, cut apart, combine, convert to other formats.</li>
        <li>Redistribute them, in your own projects or as files, and sell work that contains them.</li>
        <li>Load them straight from tevy.dev or host your own copies.</li>
      </ul>
      <p>You do not need an account, a license key or written permission, and you do not have to credit tevy.</p>
    </section>

    <section>
      <h2>Credit is optional</h2>
      <p>If you want to mention where an asset came from, something like this is enough:</p>
      <p class="credit mono">Model: Norway Spruce from tevy.dev (CC0)</p>
    </section>

    <section>
      <h2>What CC0 does not cover</h2>
      <ul>
        <li>
          No warranty. Models are provided as they are; check that they suit your use, for example scale, polygon budget and how they
          look in your engine.
        </li>
        <li>
          CC0 waives copyright, not other people's rights. tevy assets are original designs and do not depict real brands, logos or
          products, but if you add trademarks or likenesses to them, those rights are yours to clear.
        </li>
      </ul>
    </section>

    <section>
      <h2>Website code</h2>
      <p>The source code of this website is released under the MIT license. The full CC0 legal text is at <a href={CC0_URL} rel="license">creativecommons.org</a>.</p>
    </section>
  </article>
</Layout>

<style>
  .license {
    max-width: 720px;
    margin: 0 auto;
    padding: clamp(28px, 5vw, 56px) clamp(16px, 3vw, 32px) 48px;
  }

  h1 {
    font-size: clamp(30px, 4vw, 44px);
    line-height: 1.05;
  }

  .lead {
    margin: 14px 0 0;
    font-size: 16.5px;
    line-height: 1.55;
  }

  section {
    margin-top: 32px;
  }

  h2 {
    margin-bottom: 10px;
    font-size: 18px;
  }

  p,
  li {
    color: var(--muted);
    font-size: 14.5px;
    line-height: 1.6;
  }

  p {
    margin: 0 0 10px;
  }

  ul {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  li + li {
    margin-top: 6px;
  }

  a {
    color: var(--accent-text);
    text-underline-offset: 3px;
  }

  .credit {
    display: inline-block;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--canvas);
    color: var(--text);
    font-size: 13px;
  }
</style>
