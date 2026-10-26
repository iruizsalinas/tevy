<script lang="ts">
  // Tevy, the teddy. Blinks on its own; can follow the pointer with its
  // eyes, rest its paws on whatever it peeks over, and bob while waiting.
  let {
    size = 120,
    track = false,
    paws = false,
    bob = false,
    simple = false,
    label,
  }: {
    size?: number;
    /** Eyes and head follow the pointer. */
    track?: boolean;
    /** Paws along the bottom edge, for peeking over things. */
    paws?: boolean;
    /** Bounce gently, for loading states. */
    bob?: boolean;
    /** Fewer details, for small sizes like the logo. */
    simple?: boolean;
    label?: string;
  } = $props();

  let svg = $state<SVGSVGElement>();
  let look = $state({ x: 0, y: 0 });

  function follow(event: PointerEvent) {
    if (!track || !svg) return;
    const box = svg.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height * 0.45);
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, d / 400);
    look = { x: (dx / d) * reach, y: (dy / d) * reach };
  }
</script>

<svelte:window onpointermove={follow} />

<svg
  bind:this={svg}
  class="bear"
  class:bob
  class:track
  viewBox="0 0 200 {paws ? 212 : 190}"
  width={size}
  height={(size * (paws ? 212 : 190)) / 200}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <g transform={paws ? 'translate(0 18)' : undefined}>
  <g class="head" style:transform="rotate({look.x * 6}deg) translate({look.x * 3}px, {look.y * 2}px)">
    <g class="ear left">
      <circle cx="46" cy="50" r="28" fill="var(--fur)" />
      <circle cx="46" cy="50" r="15" fill="var(--fur-dark)" />
    </g>
    <g class="ear right">
      <circle cx="154" cy="50" r="28" fill="var(--fur)" />
      <circle cx="154" cy="50" r="15" fill="var(--fur-dark)" />
    </g>
    <ellipse cx="100" cy="106" rx="76" ry="70" fill="var(--fur)" />
    <ellipse cx="100" cy="136" rx="37" ry="28" fill="var(--muzzle)" />
    {#if !simple}
      <circle cx="54" cy="126" r="11" fill="var(--blush)" opacity="0.45" />
      <circle cx="146" cy="126" r="11" fill="var(--blush)" opacity="0.45" />
    {/if}
    <g transform="translate({look.x * 7} {look.y * 5})">
      <g class="eyes">
        <circle cx="70" cy="97" r={simple ? 10 : 8} fill="var(--nose)" />
        <circle cx="130" cy="97" r={simple ? 10 : 8} fill="var(--nose)" />
        {#if !simple}
          <circle cx="72.8" cy="94" r="2.6" fill="#fff" />
          <circle cx="132.8" cy="94" r="2.6" fill="#fff" />
        {/if}
      </g>
    </g>
    <path d="M87 121c8-6 18-6 26 0-2 9-7 12-13 13-6-1-11-4-13-13z" fill="var(--nose)" />
    {#if !simple}
      <path d="M100 134v6m0 0c-3 6-10 7-14 2m14-2c3 6 10 7 14 2" fill="none" stroke="var(--nose)" stroke-width="3" stroke-linecap="round" />
    {/if}
  </g>
  </g>

  {#if paws}
    {#each [52, 148] as x (x)}
      <g class="paw">
        <ellipse cx={x} cy="194" rx="28" ry="18" fill="var(--fur)" />
        <ellipse cx={x} cy="198" rx="12" ry="8" fill="var(--muzzle)" />
        <circle cx={x - 13} cy="186" r="4.5" fill="var(--muzzle)" />
        <circle cx={x} cy="183" r="4.5" fill="var(--muzzle)" />
        <circle cx={x + 13} cy="186" r="4.5" fill="var(--muzzle)" />
      </g>
    {/each}
  {/if}
</svg>

<style>
  .bear {
    display: block;
    overflow: visible;
  }

  .head {
    transform-box: fill-box;
    transform-origin: 50% 70%;
    transition: transform 0.25s ease-out;
  }

  .eyes {
    transform-box: fill-box;
    transform-origin: center;
    animation: blink 5s infinite;
  }

  @keyframes blink {
    0%,
    94%,
    100% {
      transform: scaleY(1);
    }
    96% {
      transform: scaleY(0.1);
    }
  }

  .ear {
    transform-box: fill-box;
    transform-origin: 50% 90%;
    transition: transform 0.3s cubic-bezier(0.3, 1.8, 0.5, 1);
  }

  .ear.left {
    animation: wiggle-left 7s ease-in-out infinite;
  }

  .ear.right {
    animation: wiggle-right 7s ease-in-out 0.15s infinite;
  }

  @keyframes wiggle-left {
    0%,
    88%,
    100% {
      transform: rotate(0);
    }
    91% {
      transform: rotate(-12deg);
    }
    94% {
      transform: rotate(4deg);
    }
  }

  @keyframes wiggle-right {
    0%,
    88%,
    100% {
      transform: rotate(0);
    }
    91% {
      transform: rotate(12deg);
    }
    94% {
      transform: rotate(-4deg);
    }
  }

  .bear:hover .ear.left {
    animation: none;
    transform: rotate(-14deg);
  }

  .bear:hover .ear.right {
    animation: none;
    transform: rotate(14deg);
  }

  .bob {
    animation: bob 1.1s ease-in-out infinite;
  }

  @keyframes bob {
    50% {
      transform: translateY(-8%);
    }
  }
</style>
