<script lang='ts'>
import type { HTMLAttributes } from 'svelte/elements'
import type { Key } from '../rynk'

interface Props extends HTMLAttributes<HTMLDivElement> {
  key: Key
  selected?: boolean
}

const {
  key,
  selected = false,
  ...rest
}: Props = $props()

const KEY_UNIT = 64
const KEY_GAP = 3
const KEY_RING = 1
</script>

<div {...rest} class={['group relative', rest.class]}>
  <!-- key ring -->
  {#if key.rect2}
    <div
      class='
        absolute rounded-md bg-base-200 shadow-xs transition-all
        group-hover:shadow-sm
      '
      style:left={`${(key.rect2.x - key.rect.x) * KEY_UNIT - (key.rect2.w * KEY_UNIT) / 2 + KEY_GAP}px`}
      style:top={`${(key.rect2.y - key.rect.y) * KEY_UNIT - (key.rect2.h * KEY_UNIT) / 2 + KEY_GAP}px`}
      style:width={`${key.rect2.w * KEY_UNIT - KEY_GAP * 2}px`}
      style:height={`${key.rect2.h * KEY_UNIT - KEY_GAP * 2}px`}
    ></div>
  {/if}
  <div
    class='
      absolute rounded-md bg-base-200 shadow-xs transition-all
      group-hover:shadow-sm
    '
    style:left={`${-key.rect.w * KEY_UNIT / 2 + KEY_GAP}px`}
    style:top={`${-key.rect.h * KEY_UNIT / 2 + KEY_GAP}px`}
    style:width={`${key.rect.w * KEY_UNIT - KEY_GAP * 2}px`}
    style:height={`${key.rect.h * KEY_UNIT - KEY_GAP * 2}px`}
  ></div>
  <!-- key base -->
  {#if key.rect2}
    <div
      class='
        absolute cursor-pointer rounded-md bg-base-100 transition-all
        group-hover:brightness-[0.98]
      '
      style:left={`${(key.rect2.x - key.rect.x) * KEY_UNIT - (key.rect2.w * KEY_UNIT) / 2 + KEY_GAP}px`}
      style:top={`${(key.rect2.y - key.rect.y) * KEY_UNIT - (key.rect2.h * KEY_UNIT) / 2 + KEY_GAP}px`}
      style:width={`${key.rect2.w * KEY_UNIT - (KEY_GAP + KEY_RING) * 2}px`}
      style:height={`${key.rect2.h * KEY_UNIT - (KEY_GAP + KEY_RING) * 2}px`}
      style:margin={`${KEY_RING}px`}
    ></div>
  {/if}
  <div
    class='
      absolute cursor-pointer rounded-md bg-base-100 transition-all
      group-hover:brightness-[0.98]
    '
    style:left={`${-key.rect.w * KEY_UNIT / 2 + KEY_GAP}px`}
    style:top={`${-key.rect.h * KEY_UNIT / 2 + KEY_GAP}px`}
    style:width={`${key.rect.w * KEY_UNIT - (KEY_GAP + KEY_RING) * 2}px`}
    style:height={`${key.rect.h * KEY_UNIT - (KEY_GAP + KEY_RING) * 2}px`}
    style:margin={`${KEY_RING}px`}
  ></div>
</div>
