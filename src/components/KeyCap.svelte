<script lang='ts'>
import type { Key } from '../rynk'

interface Props {
  /// Firmware layout entry — row/col/rect/rect2 the content can draw on.
  key: Key
  selected?: boolean
  onpointerdown?: (e: PointerEvent) => void
}

const {
  key,
  selected = false,
  onpointerdown,
}: Props = $props()

const KEY_UNIT = 64

const rect2Style = $derived(
  key.rect2
    ? [
      `width:${key.rect2.w * KEY_UNIT}px`,
      `height:${key.rect2.h * KEY_UNIT}px`,
      `left:calc(50% + ${(key.rect2.x - key.rect.x) * KEY_UNIT}px)`,
      `top:calc(50% + ${(key.rect2.y - key.rect.y) * KEY_UNIT}px)`,
    ].join(';')
    : '',
)
</script>

<div
  class={[
    'absolute inset-0 cursor-pointer rounded-lg',
    selected ? 'bg-primary' : 'bg-base-300',
  ].join(' ')}
  role='button'
  tabindex='0'
  data-row={key.row}
  data-col={key.col}
  {onpointerdown}
>
  {#if key.rect2}
    <div class='absolute rounded-lg' style={rect2Style}></div>
  {/if}
</div>
