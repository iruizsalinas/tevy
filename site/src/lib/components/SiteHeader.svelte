<script lang="ts">
  import Logo from './Logo.svelte';
</script>

<!-- The top bar every page shares. -->
<header class="nav">
  <a href="/" class="home" aria-label="tevy home"><Logo size={26} track /><span class="word display">tevy</span></a>
  <span class="spacer"></span>
  <a class="btn ghost small" href="/docs">Docs</a>
  <a class="btn ghost small" href="/license">License</a>
  <a class="btn ghost small" href="https://github.com/iruizsalinas/tevy">
    <svg class="mark" viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path
        d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z"
      />
    </svg>
    GitHub
  </a>
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

  .mark {
    flex: none;
  }

  @media (max-width: 640px) {
    .nav {
      padding: 0 10px;
      gap: 2px;
    }
  }
</style>
