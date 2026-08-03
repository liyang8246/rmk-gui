<script lang='ts'>
  import type { Combo, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Segmented from '../components/ui/Segmented.svelte'
  import Select from '../components/ui/Select.svelte'
  import Unsupported from '../components/ui/Unsupported.svelte'
  import { capLegend } from '../lib/legend'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  /// Which chip the picker overlay is currently filling.
  type Target
    = | { slot: number, kind: 'output' }
      | { slot: number, kind: 'trigger', at: number }
      | { slot: number, kind: 'add' }

  let picking = $state<Target | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const combos = $derived(keyboardStore.config?.combos ?? [])
  /// A slot with no trigger keys is free; the firmware always reports the full
  /// array, so "adding" means claiming the first empty one.
  const used = $derived(combos.map((c, slot) => ({ combo: c, slot })).filter(e => e.combo.actions.length > 0))
  const firstFree = $derived(combos.findIndex(c => c.actions.length === 0))
  const maxKeys = $derived(caps?.max_combo_keys ?? 0)

  function save(slot: number, combo: Combo) {
    void keyboardStore.setCombo(slot, combo).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function add() {
    if (firstFree < 0) return
    save(firstFree, { actions: [], output: 'No', layer: undefined })
    picking = { slot: firstFree, kind: 'add' }
  }

  function remove(slot: number) {
    save(slot, { actions: [], output: 'No', layer: undefined })
    toast.success(`Cleared combo ${slot}`)
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

{#snippet chip(action: KeyAction, brand: boolean, onclick: () => void)}
  <button
    class={[
      `
        inline-flex h-[38px] min-w-10 cursor-pointer items-center justify-center
        rounded-[7px] px-2 text-sm font-bold
      `,
      brand
        ? 'border-2 border-brand bg-brand-tint text-brand-darker'
        : 'border border-base-300 bg-base-100 text-foreground',
    ]}
    type='button'
    onclick={onclick}
  >
    {capLegend(action).main}
  </button>
{/snippet}

<ScreenScroll
  title='Combos'
  desc='Press several keys at once to emit a different keycode.'
>
  {#snippet actions()}
    <Button
      variant='brand'
      disabled={firstFree < 0}
      title={firstFree < 0 ? 'Every combo slot is in use' : 'Add a combo'}
      onclick={add}
    >
      <Icon icon='lucide:plus' width={15} height={15} />
      New combo
    </Button>
  {/snippet}

  <div class='flex flex-col gap-3'>
    {#each used as entry (entry.slot)}
      {@const combo = entry.combo}
      <Card class='flex flex-col gap-3.5'>
        <div class='flex flex-wrap items-center gap-3'>
          <!-- The protocol describes a combo by the actions its trigger keys
               carry, never by matrix position. -->
          <Segmented
            items={[{ value: 'position', label: 'Position' }, { value: 'keys', label: 'Keys' }]}
            value='keys'
            disabled
            onchange={() => {}}
          />
          <span class='text-xs text-muted-foreground'>
            Pick the keys that trigger this combo
          </span>
          <span class='flex items-center gap-2 text-xs text-muted-foreground'>
            on layer
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
          </span>
          <div class='ml-auto flex items-center gap-2'>
            <span class='text-xs text-muted-foreground'>outputs</span>
            {@render chip(combo.output, true, () => (picking = { slot: entry.slot, kind: 'output' }))}
            <IconBtn
              icon='lucide:trash-2'
              title='Delete combo'
              size={34}
              onclick={() => remove(entry.slot)}
            />
          </div>
        </div>

        <div class='flex flex-wrap items-center gap-2'>
          {#each combo.actions as action, at (at)}
            {@render chip(action, false, () => (picking = { slot: entry.slot, kind: 'trigger', at }))}
            <button
              class={`
                inline-flex cursor-pointer p-0.5 text-muted-foreground
                hover:text-foreground
              `}
              type='button'
              title='Remove key'
              aria-label='Remove trigger key {at + 1}'
              onclick={() => dropKey(entry.slot, at)}
            >
              <Icon icon='lucide:x' width={13} height={13} />
            </button>
          {/each}
          <button
            class={`
              inline-flex size-[38px] cursor-pointer items-center justify-center
              rounded-[7px] border border-dashed border-border
              text-muted-foreground
              hover:border-brand hover:text-brand-darker
              disabled:cursor-not-allowed disabled:opacity-45
            `}
            type='button'
            aria-label='Add trigger key'
            title={combo.actions.length >= maxKeys
              ? `This firmware allows ${maxKeys} keys per combo`
              : 'Add trigger key'}
            disabled={combo.actions.length >= maxKeys}
            onclick={() => (picking = { slot: entry.slot, kind: 'add' })}
          >
            <Icon icon='lucide:plus' width={15} height={15} />
          </button>
          <Icon class='mx-1 text-brand' icon='lucide:chevron-right' width={18} height={18} />
          {@render chip(combo.output, true, () => (picking = { slot: entry.slot, kind: 'output' }))}
        </div>

        {#if combo.actions.length < 2}
          <Unsupported>Select at least two trigger keys.</Unsupported>
        {/if}
      </Card>
    {/each}

    {#if used.length === 0}
      <Card>
        <p class='py-3 text-center text-xs text-muted-foreground'>No combos yet.</p>
      </Card>
    {/if}
  </div>

  <p class='mt-3.5 text-xs text-muted-foreground'>
    This firmware has {combos.length} combo slots, each holding up to {maxKeys} keys.
    Position-based triggering is not part of the protocol — a combo is always
    described by the keycodes its trigger keys carry.
  </p>
</ScreenScroll>

{#if picking}
  <Overlay
    title={picking.kind === 'output' ? 'Combo output' : 'Trigger key'}
    subtitle='Choose a keycode for combo {picking.slot}.'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} onpick={apply} />
  </Overlay>
{/if}
