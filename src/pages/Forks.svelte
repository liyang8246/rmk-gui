<script lang='ts'>
  import type { Fork, KeyAction, LedIndicator, ModifierCombination, MouseButtons, StateBits } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import Button from '../components/ui/Button.svelte'
  import EmptyCard from '../components/ui/EmptyCard.svelte'
  import FieldRow from '../components/ui/FieldRow.svelte'
  import KeyChip from '../components/ui/KeyChip.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import SlotCard from '../components/ui/SlotCard.svelte'
  import ToggleChip from '../components/ui/ToggleChip.svelte'
  import { NO_MODIFIERS } from '../lib/keycode'
  import { capLegend } from '../lib/legend'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const NO_LEDS: LedIndicator = { num_lock: false, caps_lock: false, scroll_lock: false, compose: false, kana: false }
  const NO_MOUSE: MouseButtons = { button1: false, button2: false, button3: false, button4: false, button5: false, button6: false, button7: false, button8: false }
  const NO_STATE: StateBits = { modifiers: { ...NO_MODIFIERS }, leds: NO_LEDS, mouse: NO_MOUSE }

  const EMPTY: Fork = {
    trigger: 'No',
    negative_output: 'No',
    positive_output: 'No',
    match_any: structuredClone(NO_STATE),
    match_none: structuredClone(NO_STATE),
    kept_modifiers: { ...NO_MODIFIERS },
    bindable: false,
  }

  const MODS = [
    ['left_ctrl', 'LCtl'],
    ['left_shift', 'LSft'],
    ['left_alt', 'LAlt'],
    ['left_gui', 'LGui'],
    ['right_ctrl', 'RCtl'],
    ['right_shift', 'RSft'],
    ['right_alt', 'RAlt'],
    ['right_gui', 'RGui'],
  ] as const satisfies readonly (readonly [keyof ModifierCombination, string])[]

  type Field = 'trigger' | 'positive_output' | 'negative_output'

  let picking = $state<{ slot: number, field: Field } | null>(null)
  /// Slot drafted by "New override": shown as a card so the override is built
  /// in place. Nothing is written until the first edit; deleting a still-blank
  /// draft touches no storage.
  let draft = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const forks = $derived(keyboardStore.config?.forks ?? [])
  /// A slot with no trigger key is free; the firmware always reports the full
  /// array, so a draft claims the first empty one.
  const visible = $derived(forks
    .map((fork, slot) => ({ fork, slot }))
    .filter(e => e.fork.trigger !== 'No' || e.slot === draft))
  const usedCount = $derived(forks.filter(f => f.trigger !== 'No').length)
  const firstFree = $derived(forks.findIndex(f => f.trigger === 'No'))

  const FIELD_TITLES: Record<Field, string> = {
    trigger: 'Trigger key',
    positive_output: 'Matched output',
    negative_output: 'Fallback output',
  }

  const pickSubtitle = $derived(picking ? `Override ${picking.slot}` : '')

  function save(slot: number, fork: Fork) {
    void keyboardStore.setFork(slot, fork).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function add() {
    if (firstFree >= 0) draft = firstFree
  }

  function remove(slot: number) {
    const fork = forks[slot]
    if (draft === slot) draft = null
    // A draft nothing was written to has nothing to clear on the keyboard.
    if (!fork || JSON.stringify(fork) === JSON.stringify(EMPTY)) return
    const had = fork.trigger !== 'No'
    save(slot, structuredClone(EMPTY))
    if (had) toast.success(`Deleted override ${slot}`)
  }

  function apply(action: KeyAction) {
    const target = picking
    if (!target) return
    picking = null
    const fork = forks[target.slot]
    if (!fork) return
    if (action === 'Transparent') {
      toast.warning('An override cannot be transparent')
      return
    }
    save(target.slot, { ...fork, [target.field]: action })
  }

  function toggleMod(slot: number, side: 'match_any' | 'match_none' | 'kept', flag: keyof ModifierCombination) {
    const fork = forks[slot]
    if (!fork) return
    if (side === 'kept') {
      const kept = { ...fork.kept_modifiers, [flag]: !fork.kept_modifiers[flag] }
      save(slot, { ...fork, kept_modifiers: kept })
      return
    }
    const state = fork[side]
    const modifiers = { ...state.modifiers, [flag]: !state.modifiers[flag] }
    save(slot, { ...fork, [side]: { ...state, modifiers } })
  }

  function toggleCaps(slot: number, side: 'match_any' | 'match_none') {
    const fork = forks[slot]
    if (!fork) return
    const state = fork[side]
    const leds = { ...state.leds, caps_lock: !state.leds.caps_lock }
    save(slot, { ...fork, [side]: { ...state, leds } })
  }
</script>

{#snippet keyChip(slot: number, field: Field, action: KeyAction, emphasis: boolean)}
  <KeyChip
    {emphasis}
    label={action === 'No' ? '—' : capLegend(action, caps).main}
    title={FIELD_TITLES[field]}
    onclick={() => (picking = { slot, field })}
  />
{/snippet}

{#snippet modChips(slot: number, side: 'match_any' | 'match_none' | 'kept', mods: ModifierCombination)}
  <span class='inline-flex flex-wrap gap-1'>
    {#each MODS as [flag, label] (flag)}
      <ToggleChip mono pressed={mods[flag]} onclick={() => toggleMod(slot, side, flag)}>
        {label}
      </ToggleChip>
    {/each}
  </span>
{/snippet}

<ScreenScroll
  title='Key overrides'
  desc='Send one of two actions, decided by which modifiers are held.'
>
  {#snippet actions()}
    {#if forks.length > 0}
      <span class='self-center text-xs text-muted-foreground'>
        {usedCount} / {forks.length} used
      </span>
      <Button
        variant='brand'
        disabled={firstFree < 0}
        title={firstFree < 0 ? 'Every slot is in use' : undefined}
        onclick={add}
      >
        <Icon icon='lucide:plus' width={15} height={15} />
        New override
      </Button>
    {/if}
  {/snippet}

  {#if forks.length === 0}
    <EmptyCard>This firmware was built without key overrides.</EmptyCard>
  {:else}
    <div class='flex flex-col gap-3'>
      {#each visible as entry (entry.slot)}
        {@const fork = entry.fork}
        <SlotCard
          label='Override {entry.slot}'
          fresh={entry.slot === draft && fork.trigger === 'No'}
          deleteTitle='Delete override'
          advancedTitle='Advanced conditions'
          ondelete={() => remove(entry.slot)}
        >
          <div class='flex flex-wrap items-center gap-2.5'>
            <span class='text-xs text-muted-foreground'>When</span>
            {@render keyChip(entry.slot, 'trigger', fork.trigger, false)}
            <span class='text-xs text-muted-foreground'>is pressed with</span>
            {@render modChips(entry.slot, 'match_any', fork.match_any.modifiers)}
            <ToggleChip
              pressed={fork.match_any.leds.caps_lock}
              title='Also match while Caps Lock is on'
              onclick={() => toggleCaps(entry.slot, 'match_any')}
            >
              <Icon icon='lucide:lightbulb' width={11} height={11} />
              Caps
            </ToggleChip>
          </div>

          <div class='flex flex-wrap items-center gap-2.5'>
            <span class='text-xs text-muted-foreground'>matched</span>
            <Icon class='text-brand' icon='lucide:chevron-right' width={16} height={16} />
            {@render keyChip(entry.slot, 'positive_output', fork.positive_output, true)}
            <span class='ml-3 text-xs text-muted-foreground'>otherwise</span>
            <Icon class='text-muted-foreground' icon='lucide:chevron-right' width={16} height={16} />
            {@render keyChip(entry.slot, 'negative_output', fork.negative_output, false)}
          </div>

          {#snippet advanced()}
            <FieldRow label='Suppress when' hint='Any of these held keeps the override off.'>
              {@render modChips(entry.slot, 'match_none', fork.match_none.modifiers)}
            </FieldRow>
            <FieldRow label='Keep modifiers' hint='Matched modifiers are swallowed unless kept here.'>
              {@render modChips(entry.slot, 'kept', fork.kept_modifiers)}
            </FieldRow>
            <FieldRow label='Chainable' hint="Lets this override's output trigger other overrides.">
              <ToggleChip
                pressed={fork.bindable}
                onclick={() => save(entry.slot, { ...fork, bindable: !fork.bindable })}
              >
                {fork.bindable ? 'on' : 'off'}
              </ToggleChip>
            </FieldRow>
          {/snippet}
        </SlotCard>
      {/each}

      {#if visible.length === 0}
        <EmptyCard>
          No overrides yet — Shift+Backspace → Delete is the classic one.
        </EmptyCard>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      With no modifier condition, an override always takes its “matched” branch.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay
    title={FIELD_TITLES[picking.field]}
    subtitle={pickSubtitle}
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} onpick={apply} />
  </Overlay>
{/if}
