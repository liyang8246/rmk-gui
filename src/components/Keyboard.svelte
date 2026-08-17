<script lang='ts'>
import type { Variant } from '../rynk'
import { variantBounds } from '../lib/layout'
import KeyCap from './KeyCap.svelte'

const KEY_UNIT = 64

interface Props {
  variant: Variant | undefined
}

const { variant }: Props = $props()

let selected = $state<string | null>(null)

function keyId(row: number, col: number): string {
  return `${row},${col}`
}

const bounds = $derived.by(() => {
  if (!variant)
    return { minX: 0, minY: 0, w: 0, h: 0 }
  const b = variantBounds(variant)
  return { minX: b.x - b.w / 2, minY: b.y - b.h / 2, w: b.w * KEY_UNIT, h: b.h * KEY_UNIT }
})
</script>

<div
  class='relative'
  role='presentation'
  style={`width:${bounds.w}px;height:${bounds.h}px`}
>
  {#each variant?.keys ?? [] as key (keyId(key.row, key.col))}
    <div
      class='absolute'
      style={`
        left:${(key.rect.x - bounds.minX) * KEY_UNIT}px;
        top:${(key.rect.y - bounds.minY) * KEY_UNIT}px;
        transform: rotate(${key.r}deg);
      `}
    >
      <KeyCap
        {key}
        selected={selected === keyId(key.row, key.col)}
        onclick={(e) => {
          e.stopPropagation()
          selected = keyId(key.row, key.col)
        }}
      />
    </div>
  {/each}
</div>
