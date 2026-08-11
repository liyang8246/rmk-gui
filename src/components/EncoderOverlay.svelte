<script lang='ts'>
  import type { KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import { keyActionText } from '../lib/keycode'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'
  import KeycodeSelect from './KeycodeSelect.svelte'
  import Overlay from './ui/Overlay.svelte'

  interface Props {
    encoder: number
    layer: number
    onclose: () => void
  }

  const { encoder, layer, onclose }: Props = $props()

  type Direction = 'clockwise' | 'counter_clockwise'

  let direction = $state<Direction>('clockwise')

  const caps = $derived(keyboardStore.device?.capabilities)
  const action = $derived(keyboardStore.config?.encoders[encoder]?.[layer])

  function assign(picked: KeyAction) {
    const current = action
    if (!current) return
    const filled = direction
    void keyboardStore
      .setEncoder(encoder, layer, { ...current, [filled]: picked })
      .match(
        // Flip to the other direction so CW then CCW is two picks, not four clicks.
        () => { if (filled === 'clockwise') direction = 'counter_clockwise' },
        e => toast.error(describeKeyboardError(e)),
      )
  }

  const DIRECTIONS = [
    { value: 'clockwise', label: 'Clockwise', icon: 'lucide:rotate-cw' },
    { value: 'counter_clockwise', label: 'Counter-clockwise', icon: 'lucide:rotate-ccw' },
  ] as const satisfies readonly { value: Direction, label: string, icon: string }[]
</script>

<Overlay
  title='Encoder {encoder}'
  subtitle='What each turn direction does on layer {layer}.'
  {onclose}
>
  <div class='flex min-h-0 flex-1 flex-col gap-3'>
    <div class='flex flex-none items-center gap-2'>
      {#each DIRECTIONS as dir (dir.value)}
        {@const on = direction === dir.value}
        <button
          class={[
            `
              inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px]
              border px-3 text-[13px] transition-colors
            `,
            on
              ? `border-brand bg-brand-tint font-bold text-brand-darker`
              : `
                border-base-300 bg-base-100 font-semibold text-muted-foreground
                hover:text-foreground
              `,
          ]}
          type='button'
          aria-pressed={on}
          onclick={() => (direction = dir.value)}
        >
          <Icon icon={dir.icon} width={15} height={15} />
          {dir.label}
          <span class='font-mono text-xs opacity-80'>
            {action ? keyActionText(action[dir.value]) : ''}
          </span>
        </button>
      {/each}
    </div>

    <div class='flex min-h-0 flex-1'>
      <KeycodeSelect {caps} onpick={assign} />
    </div>
  </div>
</Overlay>
