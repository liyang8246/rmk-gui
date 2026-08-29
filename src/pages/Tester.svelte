<script lang='ts'>
  import type { Variant } from '../rynk'
  import Icon from '@iconify/svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import Board from '../components/Board.svelte'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import UnlockOverlay from '../components/UnlockOverlay.svelte'
  import { renderVariants } from '../lib/layout'
  import { pressedCells } from '../lib/matrix'
  import { keyboardStore } from '../stores'

  const POLL_MS = 120

  let unlocking = $state(false)
  /// Cells seen pressed since the page opened, so a flaky switch leaves a trace.
  const seen = new SvelteSet<string>()

  const caps = $derived(keyboardStore.device?.capabilities)
  const status = $derived(keyboardStore.status)
  const locked = $derived(status?.lockStatus.locked ?? true)
  /// Permanently locked firmware has no challenge to hold, so no way in.
  const lockable = $derived((status?.lockStatus.key_positions.length ?? 0) > 0)
  const variants = $derived(renderVariants(keyboardStore.device?.layout, caps))
  const variant = $derived<Variant | undefined>(
    variants[keyboardStore.device?.layout.default_variant ?? 0] ?? variants[0],
  )
  const pressed = $derived.by(() => {
    const state = status?.matrixState
    if (!state || !caps) return new Set<string>()
    return pressedCells(state, caps.num_rows, caps.num_cols)
  })

  $effect(() => {
    for (const cell of pressed) seen.add(cell)
  })

  $effect(() => {
    if (locked) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    // Self-scheduling: each poll is a queued client call, and a slow link must
    // not pile up a burst of them.
    const poll = () => {
      void keyboardStore.refreshMatrixState().match(
        () => { if (!cancelled) timer = setTimeout(poll, POLL_MS) },
        () => { if (!cancelled) timer = setTimeout(poll, POLL_MS * 8) },
      )
    }
    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  })
</script>

<div class='flex min-h-0 min-w-0 flex-1 flex-col gap-[14px] p-[14px] pb-4'>
  <div class='flex flex-none items-center justify-between'>
    <div>
      <h1 class='text-lg font-extrabold tracking-tight text-foreground'>
        Matrix tester
      </h1>
      <p class='text-xs text-muted-foreground'>
        Press keys on the keyboard — every one pressed stays marked.
      </p>
    </div>
    <div class='flex items-center gap-4 text-xs text-muted-foreground'>
      <span title='Keys pressed since this page opened'>
        Tested <b class='text-foreground'>{seen.size}</b>
        / {variant?.keys.length ?? 0}
      </span>
      <Button size='sm' disabled={seen.size === 0} onclick={() => seen.clear()}>
        Reset
      </Button>
    </div>
  </div>

  {#if locked}
    <Card class='flex flex-1 flex-col items-center justify-center gap-3'>
      <Icon class='text-muted-foreground' icon='lucide:lock' width={28} height={28} />
      <p class='max-w-105 text-center text-[13px] text-muted-foreground'>
        Reading the key matrix needs a physical-presence check first.
      </p>
      {#if lockable}
        <Button variant='brand' onclick={() => (unlocking = true)}>
          <Icon icon='lucide:lock-open' width={15} height={15} />
          Unlock keyboard
        </Button>
      {:else}
        <p class='text-xs text-muted-foreground'>
          This firmware has no unlock keys, so the lock is permanent.
        </p>
      {/if}
    </Card>
  {:else if variant}
    <Board
      {variant}
      {caps}
      layer={keyboardStore.config?.keymap[status?.currentLayer ?? 0] ?? []}
      layerIndex={0}
      selected={null}
      {pressed}
      marked={seen}
      onselect={() => {}}
      onassign={() => {}}
    />
    <div class='
      flex flex-none items-center justify-center gap-5 text-xs
      text-muted-foreground
    '>
      <span>Layer <b class='text-foreground'>{status?.currentLayer ?? 0}</b></span>
      <span>WPM <b class='text-foreground'>{status?.wpm ?? 0}</b></span>
      {#each [['Caps', status?.ledIndicator.caps_lock], ['Num', status?.ledIndicator.num_lock], ['Scroll', status?.ledIndicator.scroll_lock]] as [label, on] (label)}
        <span class='inline-flex items-center gap-1.5'>
          <span
            class={[
              'size-1.5 rounded-full',
              on ? 'bg-ok-bright' : 'bg-muted-foreground/40',
            ]}
          ></span>
          {label}
        </span>
      {/each}
    </div>
  {/if}
</div>

{#if unlocking}
  <UnlockOverlay onclose={() => (unlocking = false)} />
{/if}
