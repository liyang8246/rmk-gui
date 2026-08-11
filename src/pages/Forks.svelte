<script lang='ts'>
  import type { Fork, KeyAction, LedIndicator, ModifierCombination, MouseButtons, StateBits } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import { keyActionText, NO_MODIFIERS } from '../lib/keycode'
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
  let advancedOpen = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const forks = $derived(keyboardStore.config?.forks ?? [])
  const used = $derived(forks.map((f, slot) => ({ fork: f, slot })).filter(e => e.fork.trigger !== 'No'))
  const firstFree = $derived(forks.findIndex(f => f.trigger === 'No'))

  function save(slot: number, fork: Fork) {
    void keyboardStore.setFork(slot, fork).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function remove(slot: number) {
    save(slot, structuredClone(EMPTY))
    toast.success(`Cleared override ${slot}`)
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

  const FIELD_TITLES: Record<Field, string> = {
    trigger: 'Trigger key',
    positive_output: 'Output when the condition matches',
    negative_output: 'Output otherwise',
  }

  const pickSubtitle = $derived.by(() => {
    if (!picking) return ''
    if (picking.field === 'trigger') return `Override ${picking.slot} · the key that activates this override`
    return `Override ${picking.slot} · currently ${keyActionText(forks[picking.slot]?.[picking.field] ?? 'No')}`
  })
</script>

{#snippet keyChip(slot: number, field: Field, action: KeyAction, brand: boolean)}
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
    title={FIELD_TITLES[field]}
    onclick={() => (picking = { slot, field })}
  >
    {action === 'No' ? '—' : capLegend(action, caps).main}
  </button>
{/snippet}

{#snippet modChips(slot: number, side: 'match_any' | 'match_none' | 'kept', mods: ModifierCombination)}
  <span class='inline-flex flex-wrap gap-1'>
    {#each MODS as [flag, label] (flag)}
      <button
        class={[
          `
            inline-flex h-6.5 cursor-pointer items-center rounded-md border
            px-1.5 font-mono text-[11px] font-bold transition-colors
          `,
          mods[flag]
            ? 'border-brand bg-brand-tint text-brand-darker'
            : `
              border-border text-muted-foreground
              hover:text-foreground
            `,
        ]}
        type='button'
        aria-pressed={mods[flag]}
        onclick={() => toggleMod(slot, side, flag)}
      >
        {label}
      </button>
    {/each}
  </span>
{/snippet}

<ScreenScroll
  title='Key overrides'
  desc='A fork sends one of two actions, decided by which modifiers are held.'
>
  {#snippet actions()}
    <Button
      variant='brand'
      disabled={firstFree < 0}
      title={firstFree < 0 ? 'Every override slot is in use' : 'Add an override'}
      onclick={() => (picking = { slot: firstFree, field: 'trigger' })}
    >
      <Icon icon='lucide:plus' width={15} height={15} />
      New override
    </Button>
  {/snippet}

  {#if (caps?.max_forks ?? 0) === 0}
    <Card>
      <p class='py-3 text-center text-[13px] text-muted-foreground'>
        This firmware was built without key overrides.
      </p>
    </Card>
  {:else}
    <div class='flex flex-col gap-3'>
      {#each used as entry (entry.slot)}
        {@const fork = entry.fork}
        <Card class='flex flex-col gap-3'>
          <div class='flex flex-wrap items-center gap-2.5'>
            <span class='text-xs text-muted-foreground'>When</span>
            {@render keyChip(entry.slot, 'trigger', fork.trigger, false)}
            <span class='text-xs text-muted-foreground'>is pressed with</span>
            {@render modChips(entry.slot, 'match_any', fork.match_any.modifiers)}
            <button
              class={[
                `
                  inline-flex h-6.5 cursor-pointer items-center gap-1 rounded-md
                  border px-1.5 text-[11px] font-bold transition-colors
                `,
                fork.match_any.leds.caps_lock
                  ? 'border-brand bg-brand-tint text-brand-darker'
                  : `
                    border-border text-muted-foreground
                    hover:text-foreground
                  `,
              ]}
              type='button'
              aria-pressed={fork.match_any.leds.caps_lock}
              title='Also match while the Caps Lock light is on'
              onclick={() => toggleCaps(entry.slot, 'match_any')}
            >
              <Icon icon='lucide:lightbulb' width={11} height={11} />
              Caps
            </button>
            <div class='ml-auto flex items-center gap-1'>
              <IconBtn
                icon='lucide:settings-2'
                title='Advanced'
                size={32}
                active={advancedOpen === entry.slot}
                onclick={() => (advancedOpen = advancedOpen === entry.slot ? null : entry.slot)}
              />
              <IconBtn
                icon='lucide:trash-2'
                title='Delete override'
                size={32}
                onclick={() => remove(entry.slot)}
              />
            </div>
          </div>

          <div class='flex flex-wrap items-center gap-2.5'>
            <span class='text-xs text-muted-foreground'>matched</span>
            <Icon class='text-brand' icon='lucide:chevron-right' width={16} height={16} />
            {@render keyChip(entry.slot, 'positive_output', fork.positive_output, true)}
            <span class='ml-3 text-xs text-muted-foreground'>otherwise</span>
            <Icon class='text-muted-foreground' icon='lucide:chevron-right' width={16} height={16} />
            {@render keyChip(entry.slot, 'negative_output', fork.negative_output, false)}
          </div>

          {#if advancedOpen === entry.slot}
            <div class='
              flex flex-col gap-2.5 border-t border-border pt-3 text-xs
            '>
              <div class='flex flex-wrap items-center gap-2.5'>
                <span class='w-30 font-semibold text-foreground'>Suppress when</span>
                {@render modChips(entry.slot, 'match_none', fork.match_none.modifiers)}
                <span class='text-muted-foreground'>
                  Any of these held keeps the override off.
                </span>
              </div>
              <div class='flex flex-wrap items-center gap-2.5'>
                <span class='w-30 font-semibold text-foreground'>Keep modifiers</span>
                {@render modChips(entry.slot, 'kept', fork.kept_modifiers)}
                <span class='text-muted-foreground'>
                  Matched modifiers are swallowed unless kept here.
                </span>
              </div>
              <div class='flex flex-wrap items-center gap-2.5'>
                <span class='w-30 font-semibold text-foreground'>Chainable</span>
                <button
                  class={[
                    `
                      inline-flex h-6.5 cursor-pointer items-center rounded-md
                      border px-2 text-[11px] font-bold transition-colors
                    `,
                    fork.bindable
                      ? 'border-brand bg-brand-tint text-brand-darker'
                      : `
                        border-border text-muted-foreground
                        hover:text-foreground
                      `,
                  ]}
                  type='button'
                  aria-pressed={fork.bindable}
                  onclick={() => save(entry.slot, { ...fork, bindable: !fork.bindable })}
                >
                  {fork.bindable ? 'on' : 'off'}
                </button>
                <span class='text-muted-foreground'>
                  Lets this override's output trigger other overrides.
                </span>
              </div>
            </div>
          {/if}
        </Card>
      {/each}

      {#if used.length === 0}
        <Card>
          <p class='py-3 text-center text-xs text-muted-foreground'>
            No key overrides yet. Shift+Backspace → Delete is the classic one.
          </p>
        </Card>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      This firmware has {forks.length} override slots. An override with no
      modifier condition always takes its “matched” branch.
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
