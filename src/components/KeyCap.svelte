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
/// Per-side visual gap between the cap face and its outline.
const CAP_GAP = 3
</script>

<div {...rest} class={['relative', rest.class]}>
  <div
    class={[
      'pointer-events-auto absolute cursor-pointer rounded-md border shadow-sm',
      selected ? 'border-primary bg-primary' : 'border-base-300 bg-base-200',
    ]}
    style:left={`${-key.rect.w * KEY_UNIT / 2 + CAP_GAP}px`}
    style:top={`${-key.rect.h * KEY_UNIT / 2 + CAP_GAP}px`}
    style:width={`${key.rect.w * KEY_UNIT - CAP_GAP * 2}px`}
    style:height={`${key.rect.h * KEY_UNIT - CAP_GAP * 2}px`}
  ></div>
  {#if key.rect2}
    <div
      class={[
        `
          pointer-events-auto absolute cursor-pointer rounded-md border
          shadow-sm
        `,
        selected ? 'border-primary bg-primary' : 'border-base-300 bg-base-200',
      ]}
      style:left={`${(key.rect2.x - key.rect.x) * KEY_UNIT - (key.rect2.w * KEY_UNIT) / 2 + CAP_GAP}px`}
      style:top={`${(key.rect2.y - key.rect.y) * KEY_UNIT - (key.rect2.h * KEY_UNIT) / 2 + CAP_GAP}px`}
      style:width={`${key.rect2.w * KEY_UNIT - CAP_GAP * 2}px`}
      style:height={`${key.rect2.h * KEY_UNIT - CAP_GAP * 2}px`}
    ></div>
  {/if}
</div>
