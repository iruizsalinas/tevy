<script lang="ts">
  import Logo from './Logo.svelte';
</script>

<!-- The top bar every page shares. -->
<header class="nav">
  <a href="/models" class="home" aria-label="tevy home"><Logo size={26} track /><span class="word display">tevy</span></a>
  <span class="spacer"></span>
  <a class="btn ghost small" href="/models">Models</a>
  <a class="btn ghost small" href="/license">License</a>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(10px);
  }

  .home {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    text-decoration: none;
  }

  .word {
    font-size: 20px;
    line-height: 1;
  }

  .spacer {
    flex: 1;
  }

  @media (max-width: 640px) {
    .nav {
      padding: 0 10px;
      gap: 2px;
    }
  }
</style>
