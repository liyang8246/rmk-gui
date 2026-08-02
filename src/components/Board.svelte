<script lang='ts'>
  import type { KeyAction, Variant } from '../rynk'
  import { variantBounds } from '../lib/layout'
  import Keycap from './Keycap.svelte'

  interface Props {
    variant: Variant
    /// The active layer's actions, indexed `[row][col]`.
    layer: KeyAction[][]
    /// Layer 0 has nothing beneath it, so nothing on it is an override.
    layerIndex: number
    selected: { row: number, col: number } | null
    onselect: (row: number, col: number) => void
    onassign: (row: number, col: number) => void
  }

  const { variant, layer, layerIndex, selected, onselect, onassign }: Props = $props()

  /// The design's key unit; the board is then scaled to whatever space it gets.
  const UNIT = 60
  /// Never draw a board bigger than the design does, however much room there is.
  const MAX_SCALE = 0.9

  let boxWidth = $state(0)
  let boxHeight = $state(0)
  let dragOver = $state<string | null>(null)

  const bounds = $derived(variantBounds(variant))
  const width = $derived(bounds.w * UNIT)
  const height = $derived(bounds.h * UNIT)
  const originX = $derived(bounds.x - bounds.w / 2)
  const originY = $derived(bounds.y - bounds.h / 2)

  const scale = $derived.by(() => {
    if (!width || !height || !boxWidth || !boxHeight) return MAX_SCALE
    return Math.min((boxWidth - 8) / width, (boxHeight - 8) / height, MAX_SCALE)
  })

  const cell = (row: number, col: number) => `${row},${col}`
</script>

<div
  class='
    flex min-h-[120px] flex-1 shrink items-center justify-center overflow-hidden
    p-3
  '
  bind:clientWidth={boxWidth}
  bind:clientHeight={boxHeight}
>
  <div style:transform='scale({scale})' style:transform-origin='center'>
    <div
      class='relative'
      style:width='{width}px'
      style:height='{height}px'
    >
      {#each variant.keys as key (cell(key.row, key.col))}
        {@const action = layer[key.row]?.[key.col] ?? 'Transparent'}
        <Keycap
          {action}
          rect={key.rect}
          rect2={key.rect2}
          rotation={key.r}
          {originX}
          {originY}
          unit={UNIT}
          selected={selected?.row === key.row && selected?.col === key.col}
          overridden={layerIndex > 0 && action !== 'Transparent'}
          dragOver={dragOver === cell(key.row, key.col)}
          onclick={() => onselect(key.row, key.col)}
          ondropaction={() => onassign(key.row, key.col)}
          ondragstate={(over) => { dragOver = over ? cell(key.row, key.col) : null }}
        />
      {/each}

      <!-- Encoders are part of the physical layout, so the board shows where
           they sit; the design has no editor for their actions. -->
      {#each variant.encoders as encoder (encoder.id)}
        <div
          class={`
            absolute flex items-center justify-center rounded-full border
            border-dashed border-kc-border bg-kc-mod-top text-[10px]
            font-semibold text-muted-foreground
          `}
          style:left='{(encoder.x - originX - 0.5) * UNIT + 4}px'
          style:top='{(encoder.y - originY - 0.5) * UNIT + 4}px'
          style:width='{UNIT - 8}px'
          style:height='{UNIT - 8}px'
          title='Encoder {encoder.id}'
        >
          E{encoder.id}
        </div>
      {/each}
    </div>
  </div>
</div>
