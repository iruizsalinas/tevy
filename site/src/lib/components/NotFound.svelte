<script lang="ts">
  import Bear from './Bear.svelte';

  let { title = 'This page wandered off the map.', message = 'The address may be mistyped, or the model was renamed.' } = $props();
</script>

<div class="lost">
  <Bear size={96} bob label="tevy, looking around" />
  <p class="code mono">404</p>
  <h1 class="display">{title}</h1>
  <p class="message">{message}</p>
  <a class="btn primary" href="/">Browse all models</a>
</div>

<style>
  .lost {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: clamp(48px, 10vw, 112px) 16px 96px;
    text-align: center;
  }

  .code {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--accent-line);
  }

  h1 {
    max-width: 18ch;
    font-size: clamp(30px, 5vw, 46px);
    line-height: 1.05;
  }

  .message {
    margin: 0 0 6px;
    color: var(--muted);
    font-size: 15px;
  }
</style>
