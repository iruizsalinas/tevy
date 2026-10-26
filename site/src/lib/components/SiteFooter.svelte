<script lang="ts">
  import { CC0_URL } from '#lib/models';
</script>

<footer>
  <p>
    Assets <a href={CC0_URL} rel="license">CC0 1.0</a>, site code MIT. <a href="/license">License</a>
  </p>
  <p class="links mono">
    <a href="/models.json">models.json</a>
    <a href="/skies.json">skies.json</a>
    <a href="/materials.json">materials.json</a>
    <a href="/llms.txt">llms.txt</a>
    <a href="/sitemap.xml">sitemap.xml</a>
  </p>
</footer>

<style>
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 24px;
    margin-top: auto;
    padding: 12px 16px;
    border-top: 1px solid var(--line);
    font-size: 12.5px;
    line-height: 1.4;
    color: var(--faint);
  }

  p {
    margin: 0;
  }

  a {
    color: var(--muted);
    text-underline-offset: 3px;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 11.5px;
  }

  .links a {
    text-decoration: none;
  }

  .links a:hover {
    color: var(--text);
  }
</style>
