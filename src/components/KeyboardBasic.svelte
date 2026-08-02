<script lang='ts'>
  import type { CatalogEntry } from '../lib/keycatalog'
  import type { Cell } from '../lib/picker-layout'
  import type { HidKeyCode } from '../rynk'
  import { hidLegend } from '../lib/keycode'
  import { capLegend } from '../lib/legend'
  import {
    FUNCTION_FLAT,
    MAIN_ROWS,
    NAV_CLUSTER,
    NAV_FLAT,
    NUMPAD,
    NUMPAD_FLAT,
    NUMPAD_UNITS,
    rowWidth,
    span,
    PICKER_UNIT as U,
  } from '../lib/picker-layout'
  import MiniKey from './MiniKey.svelte'

  interface Props {
    /// Basic entries the drawn board has no place for — `No`, `Transparent`,
    /// `Menu` — offered at one unit beside it so nothing is unreachable.
    extras: CatalogEntry[]
    onpick: (code: HidKeyCode) => void
    onpickentry: (entry: CatalogEntry) => void
  }

  const { extras, onpick, onpickentry }: Props = $props()

  const GAP = 18
  const mainWidth = Math.max(...MAIN_ROWS.map(rowWidth)) * U
  const navWidth = 3 * U
  const padWidth = NUMPAD_UNITS.w * U

  let available = $state(880)

  /// Widest layout that fits: full 104-key, then TKL, then 60% (which drops the
  /// F-row).
  const mode = $derived.by(() => {
    if (available >= mainWidth + navWidth + padWidth + GAP * 2) return '104'
    if (available >= mainWidth + navWidth + GAP) return '80'
    return '60'
  })

  const rows = $derived(mode === '60' ? MAIN_ROWS.slice(1) : MAIN_ROWS)
  // Whatever the current width drops is re-offered flat, the F-row included —
  // no keycode may become unreachable just because the window is narrow.
  const below = $derived.by(() => {
    if (mode === '104') return []
    if (mode === '80') return NUMPAD_FLAT
    return [...FUNCTION_FLAT, ...NAV_FLAT, ...NUMPAD_FLAT]
  })
  const totalWidth = $derived.by(() => {
    const nav = mode !== '60' ? navWidth + GAP : 0
    const pad = mode === '104' ? padWidth + GAP : 0
    return mainWidth + nav + pad
  })
  const scale = $derived(Math.min(1, available / totalWidth))
</script>

{#snippet keyMini(code: HidKeyCode, w = 1, h = 1)}
  {@const legend = hidLegend(code)}
  <MiniKey
    label={legend.long ?? legend.label}
    sub={legend.qualifier}
    {w}
    {h}
    title={code}
    onpick={() => onpick(code)}
  />
{/snippet}

{#snippet block(cells: Cell[][])}
  <div class='flex flex-col gap-1'>
    {#each cells as row, ri (ri)}
      <div class='flex gap-1'>
        {#each row as cell, ci (ci)}
          {#if 'gap' in cell}
            <div style:width='{span(cell.gap)}px'></div>
          {:else}
            {@render keyMini(cell.code, cell.w)}
          {/if}
        {/each}
      </div>
    {/each}
  </div>
{/snippet}

<div class='flex w-full flex-col gap-2.5' bind:clientWidth={available}>
  <!-- The board is one rigid unit that scales to fit; the strip below it is a
       plain wrapping list, so it flows to the panel's width rather than the
       board's — which would wrap it a row early. -->
  <div class='flex justify-center'>
    <div
      style:transform='scale({scale})'
      style:transform-origin='top center'
      style:width='{totalWidth}px'
    >
      <div class='flex items-start' style:gap='{GAP}px'>
        {@render block(rows)}
        {#if mode !== '60'}
          <div class='self-end'>{@render block(NAV_CLUSTER)}</div>
        {/if}
        {#if mode === '104'}
          <!-- Placed, not rowed: `+` and `Enter` span two rows. -->
          <div
            class='relative self-end'
            style:width='{NUMPAD_UNITS.w * U}px'
            style:height='{NUMPAD_UNITS.h * U}px'
          >
            {#each NUMPAD as key (key.code)}
              <div class='absolute' style:left='{key.x * U}px' style:top='{key.y * U}px'>
                {@render keyMini(key.code, key.w, key.h)}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if below.length || extras.length}
    <div class='
      flex flex-wrap justify-center gap-1 border-t border-border pt-2
    '>
      {#each below as code (code)}
        {@render keyMini(code)}
      {/each}
      {#each extras as entry (entry.id)}
        <MiniKey
          label={entry.label}
          sub={entry.sub}
          tint={capLegend(entry.action).tint}
          title={entry.title ?? entry.label}
          action={entry.action}
          onpick={() => onpickentry(entry)}
        />
      {/each}
    </div>
  {/if}
</div>
