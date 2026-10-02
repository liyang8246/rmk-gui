<script lang='ts'>
  import type { CatalogEntry } from '../lib/keycatalog'
  import type { Action, KeyAction, ModifierCombination } from '../rynk'
  import { asAction } from '../lib/keycatalog'
  import { actionLabel, MOD_FLAGS, modifierLabel, NO_MODIFIERS } from '../lib/keycode'
  import MiniKey from './MiniKey.svelte'
  import Segmented from './ui/Segmented.svelte'
  import Select from './ui/Select.svelte'
  import ToggleChip from './ui/ToggleChip.svelte'

  interface Props {
    kind: 'MK' | 'LT' | 'MT'
    /// Every plain key the firmware offers; the base key is picked from these.
    keys: CatalogEntry[]
    layerCount: number
    /// Morse slots on the firmware; their profiles carry per-key timing.
    morseCount: number
    /// Lowercased text from the picker's own search box — this tab has none of its own.
    query: string
    onpick: (action: KeyAction) => void
  }

  const { kind, keys, layerCount, morseCount, query, onpick }: Props = $props()

  const HOLD_MODS = [
    { value: 'left_ctrl', label: 'Ctrl' },
    { value: 'left_shift', label: 'Shift' },
    { value: 'left_alt', label: 'Alt' },
    { value: 'left_gui', label: 'Gui' },
  ] as const satisfies readonly { value: keyof ModifierCombination, label: string }[]

  const LIMIT = 60

  const mods = $state<ModifierCombination>({ ...NO_MODIFIERS, left_ctrl: true })
  let holdLayer = $state(1)
  let holdMod = $state<keyof ModifierCombination>('left_shift')

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

  const armed = $derived(kind !== 'MK' || MOD_FLAGS.some(([flag]) => mods[flag]))

  // `KeyWithModifier` takes a keycode and a hold-tap holds two plain actions,
  // so composite picks (morse, transparent) serve neither.
  const candidates = $derived(
    keys.filter(e => (kind === 'MK' ? e.hid !== undefined : asAction(e.action) !== null)),
  )

  const results = $derived.by(() => {
    if (!query) return candidates.slice(0, LIMIT)
    return candidates
      .filter(e => e.label.toLowerCase().includes(query) || (e.title ?? '').toLowerCase().includes(query))
      .slice(0, LIMIT)
  })

  /// The trailing index selects a morse profile; `0xFF` has no table entry, so
  /// the firmware falls back to its default timings.
  const DEFAULT_PROFILE = 0xFF

  let profile = $state(DEFAULT_PROFILE)

  const profiles = $derived([
    { value: String(DEFAULT_PROFILE), label: 'default' },
    ...Array.from({ length: morseCount }, (_, i) => ({
      value: String(i),
      label: `Morse ${i}`,
    })),
  ])

  function build(entry: CatalogEntry): KeyAction {
    if (kind === 'MK') return { Single: { KeyWithModifier: [entry.hid!, { ...mods }] } }
    return { TapHold: [asAction(entry.action)!, hold, profile] }
  }
</script>

<div class='flex h-full flex-col gap-2.5'>
  <div class='flex flex-wrap items-center gap-2.5'>
    <span class='
      text-xs font-bold tracking-wider text-muted-foreground uppercase
    '>
      {kind === 'MK' ? 'Modifiers' : kind === 'LT' ? 'Hold layer' : 'Hold mod'}
    </span>
    {#if kind === 'MK'}
      <div class='flex flex-wrap gap-1.5'>
        {#each MOD_FLAGS as [flag, short] (flag)}
          <ToggleChip
            pressed={mods[flag]}
            title={flag.replace('_', ' ')}
            mono
            onclick={() => (mods[flag] = !mods[flag])}
          >
            {short}
          </ToggleChip>
        {/each}
      </div>
    {:else if kind === 'LT'}
      <Segmented
        items={layers}
        value={String(holdLayer)}
        height={28}
        onchange={v => (holdLayer = Number(v))}
      />
    {:else}
      <Segmented
        items={HOLD_MODS.map(m => ({ value: m.value, label: m.label }))}
        value={holdMod}
        height={28}
        onchange={v => (holdMod = v)}
      />
    {/if}
    {#if kind !== 'MK' && morseCount > 0}
      <span class='
        ml-2 text-xs font-bold tracking-wider text-muted-foreground uppercase
      '>
        Timing
      </span>
      <Select
        items={profiles}
        value={String(profile)}
        label='Timing profile'
        onchange={v => (profile = Number(v))}
      />
    {/if}
  </div>

  <div class='text-[11.5px] text-muted-foreground'>
    {#if !armed}
      Turn on at least one modifier
    {:else}
      Pick a key below to assign
      <b class='font-mono text-brand-darker'>
        {kind === 'MK' ? `${modifierLabel(mods)}+key` : `hold ${actionLabel(hold)} / tap it`}
      </b>
    {/if}
  </div>

  {#if armed}
    <div class='flex-1 overflow-y-auto'>
      <div class='flex flex-wrap gap-1'>
        {#each results as entry (entry.id)}
          <MiniKey
            label={entry.label}
            sub={entry.sub}
            w={1.25}
            title={entry.title ?? entry.label}
            highlight={query || undefined}
            onpick={() => onpick(build(entry))}
          />
        {/each}
      </div>
    </div>
  {/if}
</div>
