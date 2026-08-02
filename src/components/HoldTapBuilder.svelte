<script lang='ts'>
  import type { CatalogEntry } from '../lib/keycatalog'
  import type { Action, KeyAction, ModifierCombination } from '../rynk'
  import Icon from '@iconify/svelte'
  import { asAction } from '../lib/keycatalog'
  import { actionLabel, NO_MODIFIERS } from '../lib/keycode'
  import MiniKey from './MiniKey.svelte'
  import Segmented from './ui/Segmented.svelte'

  interface Props {
    /// Every plain key the firmware offers; the tap half is picked from these.
    taps: CatalogEntry[]
    layerCount: number
    onpick: (action: KeyAction) => void
  }

  const { taps, layerCount, onpick }: Props = $props()

  const MODS = [
    { value: 'left_ctrl', label: 'Ctrl' },
    { value: 'left_shift', label: 'Shift' },
    { value: 'left_alt', label: 'Alt' },
    { value: 'left_gui', label: 'Gui' },
  ] as const satisfies readonly { value: keyof ModifierCombination, label: string }[]

  const LIMIT = 60

  let kind = $state<'LT' | 'MT'>('LT')
  let holdLayer = $state(1)
  let holdMod = $state<keyof ModifierCombination>('left_shift')
  let query = $state('')

  const layers = $derived(
    Array.from({ length: Math.max(1, layerCount - 1) }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    })),
  )

  const hold = $derived<Action>(
    kind === 'LT'
      ? { LayerOn: holdLayer }
      : { Modifier: { ...NO_MODIFIERS, [holdMod]: true } },
  )

  // A hold-tap holds two plain actions, so composite picks (morse, transparent)
  // cannot be a tap and are not offered.
  const candidates = $derived(taps.filter(entry => asAction(entry.action) !== null))

  const results = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates.slice(0, LIMIT)
    return candidates
      .filter(e => e.label.toLowerCase().includes(q) || (e.title ?? '').toLowerCase().includes(q))
      .slice(0, LIMIT)
  })

  /// The trailing index selects a morse profile; `0xFF` has no table entry, so
  /// the firmware falls back to its default timings — what the picker wants.
  const DEFAULT_PROFILE = 0xFF

  function build(entry: CatalogEntry): KeyAction {
    return { TapHold: [asAction(entry.action)!, hold, DEFAULT_PROFILE] }
  }
</script>

<div class='flex h-full flex-col gap-2.5'>
  <div class='flex flex-wrap items-center gap-3'>
    <Segmented
      items={[{ value: 'LT', label: 'Layer-Tap' }, { value: 'MT', label: 'Mod-Tap' }]}
      value={kind}
      height={28}
      onchange={v => (kind = v)}
    />
    <span class='text-[11.5px] text-muted-foreground'>
      {kind === 'LT'
        ? 'Hold → switch layer · Tap → send key'
        : 'Hold → modifier · Tap → send key'}
    </span>
  </div>

  <div class='flex flex-wrap items-center gap-2.5'>
    <span class='
      text-xs font-bold tracking-wider text-muted-foreground uppercase
    '>
      {kind === 'LT' ? 'Hold layer' : 'Hold mod'}
    </span>
    {#if kind === 'LT'}
      <Segmented
        items={layers}
        value={String(holdLayer)}
        height={28}
        onchange={v => (holdLayer = Number(v))}
      />
    {:else}
      <Segmented
        items={MODS.map(m => ({ value: m.value, label: m.label }))}
        value={holdMod}
        height={28}
        onchange={v => (holdMod = v)}
      />
    {/if}
    <div class='relative ml-auto w-50'>
      <Icon
        class='absolute top-[9px] left-2.5 text-muted-foreground'
        icon='lucide:search'
        width={14}
        height={14}
      />
      <input
        class={`
          h-8 w-full rounded-md border border-input bg-background pr-2.5 pl-8
          text-[12.5px] text-foreground outline-none
        `}
        placeholder='Find tap key…'
        bind:value={query}
      />
    </div>
  </div>

  <div class='text-[11.5px] text-muted-foreground'>
    Tap key → assigns
    <b class='font-mono text-brand-darker'>hold {actionLabel(hold)} / tap …</b>
  </div>

  <div class='flex-1 overflow-y-auto'>
    <div class='flex flex-wrap gap-1'>
      {#each results as entry (entry.id)}
        <MiniKey
          label={entry.label}
          sub={entry.sub}
          w={1.25}
          title={entry.title ?? entry.label}
          onpick={() => onpick(build(entry))}
        />
      {/each}
    </div>
  </div>
</div>
