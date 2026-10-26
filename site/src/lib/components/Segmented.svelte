<script lang="ts" generics="T extends string">
  let {
    value = $bindable(),
    choices,
    label,
  }: { value: T; choices: { value: T; label: string }[]; label: string } = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
  {#each choices as choice (choice.value)}
    <button
      type="button"
      role="radio"
      aria-checked={value === choice.value}
      class:on={value === choice.value}
      onclick={() => (value = choice.value)}
    >
      {choice.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    flex-wrap: wrap;
    padding: 2px;
    gap: 2px;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background: var(--canvas);
  }

  button {
    height: 26px;
    padding: 0 11px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--muted);
    font-size: 12.5px;
    font-weight: 500;
  }

  button:hover {
    color: var(--text);
  }

  button.on {
    background: var(--hover);
    color: var(--text);
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }
</style>
