<script lang='ts'>
  import type { Combo, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import AddChip from '../components/ui/AddChip.svelte'
  import Button from '../components/ui/Button.svelte'
  import EmptyCard from '../components/ui/EmptyCard.svelte'
  import FieldRow from '../components/ui/FieldRow.svelte'
  import KeyChip from '../components/ui/KeyChip.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Select from '../components/ui/Select.svelte'
  import SlotCard from '../components/ui/SlotCard.svelte'
  import Unsupported from '../components/ui/Unsupported.svelte'
  import { capLegend } from '../lib/legend'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const EMPTY: Combo = { actions: [], output: 'No', layer: undefined }

  /// Which chip the picker overlay is currently filling.
  type Target
    = | { slot: number, kind: 'output' }
      | { slot: number, kind: 'trigger', at: number }
      | { slot: number, kind: 'add' }

  let picking = $state<Target | null>(null)
  /// Slot drafted by "New combo": shown as a card so the combo is built in
  /// place. Nothing is written until the first edit; deleting a still-blank
  /// draft touches no storage.
  let draft = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const combos = $derived(keyboardStore.config?.combos ?? [])
  /// A slot with no trigger keys is free; the firmware always reports the full
  /// array, so a draft claims the first empty one.
  const visible = $derived(combos
    .map((combo, slot) => ({ combo, slot }))
    .filter(e => e.combo.actions.length > 0 || e.slot === draft))
  const usedCount = $derived(combos.filter(c => c.actions.length > 0).length)
  const firstFree = $derived(combos.findIndex(c => c.actions.length === 0))
  const maxKeys = $derived(caps?.max_combo_keys ?? 0)

  const pickTitle = $derived(picking?.kind === 'output' ? 'Output key' : 'Trigger key')
  const pickSubtitle = $derived.by(() => {
    if (!picking) return ''
    if (picking.kind === 'output') return `Combo ${picking.slot} · the key the chord sends`
    if (picking.kind === 'add') return `Combo ${picking.slot} · another key of the chord`
    return `Combo ${picking.slot} · key ${picking.at + 1} of the chord`
  })

  function save(slot: number, combo: Combo) {
    void keyboardStore.setCombo(slot, combo).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function add() {
    if (firstFree >= 0) draft = firstFree
  }

  function remove(slot: number) {
    const combo = combos[slot]
    if (draft === slot) draft = null
    // A draft nothing was written to has nothing to clear on the keyboard.
    if (!combo || JSON.stringify(combo) === JSON.stringify(EMPTY)) return
    const had = combo.actions.length > 0
    save(slot, { ...EMPTY })
    if (had) toast.success(`Deleted combo ${slot}`)
  }

  function apply(action: KeyAction) {
    const target = picking
    if (!target) return
    const combo = combos[target.slot]
    if (!combo) return
    if (target.kind === 'output') {
      save(target.slot, { ...combo, output: action })
    }
    else if (target.kind === 'add') {
      save(target.slot, { ...combo, actions: [...combo.actions, action] })
    }
    else {
      const actions = combo.actions.slice()
      actions[target.at] = action
      save(target.slot, { ...combo, actions })
    }
    picking = null
  }

  function dropKey(slot: number, at: number) {
    const combo = combos[slot]
    if (!combo) return
    save(slot, { ...combo, actions: combo.actions.filter((_, i) => i !== at) })
  }

  function setLayer(slot: number, value: string) {
    const combo = combos[slot]
    if (!combo) return
    save(slot, { ...combo, layer: value === 'any' ? undefined : Number(value) })
  }
</script>

<ScreenScroll
  title='Combos'
  desc='Press several keys at once to emit a different keycode.'
>
  {#snippet actions()}
    {#if combos.length > 0}
      <span class='self-center text-xs text-muted-foreground'>
        {usedCount} / {combos.length} used
      </span>
      <Button
        variant='brand'
        disabled={firstFree < 0}
        title={firstFree < 0 ? 'Every combo slot is in use' : 'Add a combo'}
        onclick={add}
      >
        <Icon icon='lucide:plus' width={15} height={15} />
        New combo
      </Button>
    {/if}
  {/snippet}

  {#if combos.length === 0}
    <EmptyCard>This firmware was built without combos.</EmptyCard>
  {:else}
    <div class='flex flex-col gap-3'>
      {#each visible as entry (entry.slot)}
        {@const combo = entry.combo}
        <SlotCard
          label='Combo {entry.slot}'
          fresh={entry.slot === draft && combo.actions.length === 0}
          deleteTitle='Delete combo'
          advancedTitle='Combo options'
          ondelete={() => remove(entry.slot)}
        >
          <div class='flex flex-wrap items-center gap-2'>
            {#each combo.actions as action, at (at)}
              <KeyChip
                label={capLegend(action, caps).main}
                title='Change trigger key {at + 1}'
                onclick={() => (picking = { slot: entry.slot, kind: 'trigger', at })}
                onremove={() => dropKey(entry.slot, at)}
                removeTitle='Remove trigger key {at + 1}'
              />
            {/each}
            <AddChip
              title={combo.actions.length >= maxKeys
                ? `This firmware allows ${maxKeys} keys per combo`
                : 'Add a trigger key'}
              disabled={combo.actions.length >= maxKeys}
              onclick={() => (picking = { slot: entry.slot, kind: 'add' })}
            />
            <Icon class='mx-1 text-brand' icon='lucide:chevron-right' width={18} height={18} />
            <KeyChip
              emphasis
              label={combo.output === 'No' ? '—' : capLegend(combo.output, caps).main}
              title='Change the output key'
              onclick={() => (picking = { slot: entry.slot, kind: 'output' })}
            />
          </div>

          {#if combo.actions.length < 2}
            <Unsupported>Select at least two trigger keys.</Unsupported>
          {/if}

          {#snippet advanced()}
            <FieldRow label='Active layer' hint='Trigger only while this layer is active.'>
              <Select
                items={[
                  { value: 'any', label: 'any' },
                  ...Array.from({ length: caps?.num_layers ?? 0 }, (_, l) => ({
                    value: String(l),
                    label: String(l),
                  })),
                ]}
                value={combo.layer === undefined ? 'any' : String(combo.layer)}
                label='Combo layer'
                onchange={v => setLayer(entry.slot, v)}
              />
            </FieldRow>
          {/snippet}
        </SlotCard>
      {/each}

      {#if visible.length === 0}
        <EmptyCard>
          No combos yet — press “New combo” to chord several keys into one.
        </EmptyCard>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      This firmware has {combos.length} combo slots, each holding up to {maxKeys} keys.
      Position-based triggering is not part of the protocol — a combo is always
      described by the keycodes its trigger keys carry.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay title={pickTitle} subtitle={pickSubtitle} onclose={() => (picking = null)}>
    <KeycodeSelect {caps} onpick={apply} />
  </Overlay>
{/if}
