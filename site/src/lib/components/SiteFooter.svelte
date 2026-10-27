<script lang="ts">
  import { CC0_URL } from '#lib/models';
</script>

<footer>
  <p>All assets are <a href={CC0_URL} rel="license">CC0 1.0</a>.</p>
</footer>

<style>
  footer {
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
</style>
