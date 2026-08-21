<script lang='ts'>
  import Icon from '@iconify/svelte'
  import { capLegend } from '../lib/legend'
  import { toast } from '../lib/toast.svelte'
  import { keyboardStore } from '../stores'
  import Overlay from './ui/Overlay.svelte'

  interface Props {
    onclose: () => void
  }

  const { onclose }: Props = $props()

  /// The firmware samples the held challenge on each poll and lapses ~500ms
  /// after polls stop, so cancelling is simply closing this overlay.
  const POLL_MS = 150

  const status = $derived(keyboardStore.status?.lockStatus)
  const positions = $derived(status?.key_positions ?? [])
  const held = $derived(positions.length - (status?.remaining_keys ?? positions.length))

  function keyLabel(row: number, col: number): string {
    const action = keyboardStore.config?.keymap[0]?.[row]?.[col]
    if (!action) return `R${row}C${col}`
    const legend = capLegend(action, keyboardStore.device?.capabilities).main
    // The base layer can hold a glyph with no name at this position.
    return legend === '✕' || legend === '▽' ? `R${row}C${col}` : legend
  }

  $effect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    // Self-scheduling rather than an interval: a poll is a queued client call,
    // and a slow link must not pile up a burst of them.
    const poll = () => {
      void keyboardStore.unlockPoll().match(
        (s) => {
          if (cancelled) return
          if (!s.locked) {
            toast.success('Keyboard unlocked')
            onclose()
            return
          }
          timer = setTimeout(poll, POLL_MS)
        },
        () => { if (!cancelled) timer = setTimeout(poll, POLL_MS * 4) },
      )
    }
    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  })
</script>

<Overlay
  title='Unlock keyboard'
  subtitle='Physical-presence check'
  {onclose}
>
  <div class='flex flex-1 flex-col items-center justify-center gap-5'>
    <p class='max-w-105 text-center text-[13px] text-muted-foreground'>
      Press and hold
      {positions.length === 1 ? 'this key' : `all ${positions.length} keys at once`}
      on the keyboard until it unlocks.
    </p>

    <div class='flex flex-wrap items-center justify-center gap-2'>
      {#each positions as [row, col], i ([row, col].join())}
        {#if i > 0}
          <Icon class='text-muted-foreground' icon='lucide:plus' width={14} height={14} />
        {/if}
        <span
          class={`
            inline-flex h-12 min-w-12 items-center justify-center rounded-lg
            border-2 border-brand bg-brand-tint px-3 text-[15px] font-bold
            text-brand-darker
          `}
        >
          {keyLabel(row, col)}
        </span>
      {/each}
    </div>

    <div class='flex items-center gap-2 text-[13px] font-semibold'>
      {#if status?.unlocking}
        <span class='size-2 animate-pulse rounded-full bg-brand'></span>
        <span class='text-foreground'>{held} of {positions.length} keys held…</span>
      {:else}
        <span class='size-2 rounded-full bg-muted-foreground'></span>
        <span class='text-muted-foreground'>Waiting for the keyboard…</span>
      {/if}
    </div>
  </div>
</Overlay>
