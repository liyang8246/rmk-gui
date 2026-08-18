<script lang='ts'>
  import type { MacroStep, StepKind } from '../lib/macro-codec'
  import type { HidKeyCode, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import AddChip from '../components/ui/AddChip.svelte'
  import Button from '../components/ui/Button.svelte'
  import EmptyCard from '../components/ui/EmptyCard.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import KeyChip from '../components/ui/KeyChip.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import SlotCard from '../components/ui/SlotCard.svelte'
  import Unsupported from '../components/ui/Unsupported.svelte'
  import { catalog } from '../lib/catalog.svelte'
  import { asHidKey, MACRO_SLOTS } from '../lib/keycatalog'
  import { hidLabel } from '../lib/keycode'
  import {
    decodeMacros,
    encodedSize,
    encodeMacros,
    keyLabel,
    MAX_DELAY_MS,
    printableAscii,
  } from '../lib/macro-codec'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const STEP_KINDS = [
    { kind: 'tap', label: 'Tap' },
    { kind: 'press', label: 'Press' },
    { kind: 'release', label: 'Release' },
    { kind: 'text', label: 'Type text' },
    { kind: 'delay', label: 'Delay' },
  ] as const satisfies readonly { kind: StepKind, label: string }[]

  const TONES: Record<StepKind, string> = {
    tap: 'bg-brand-tint-strong text-brand-darker',
    press: 'bg-brand-tint-strong text-brand-darker',
    release: 'bg-brand-tint-strong text-brand-darker',
    text: 'bg-info/14 text-info',
    delay: 'bg-muted text-muted-foreground',
  }

  /// Set while the key picker is open, to the step it will fill.
  let picking = $state<{ slot: number, at: number } | null>(null)
  /// Slot drafted by "New macro": shown as a card so the macro is built in
  /// place. Nothing is written until the first step; deleting a still-empty
  /// draft touches no storage.
  let draft = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const capacity = $derived(caps?.macro_space_size ?? 0)
  const region = $derived(keyboardStore.config?.macros ?? [])
  const slots = $derived(decodeMacros(region, MACRO_SLOTS))
  /// A slot the codec could not read is not editable: rewriting the region
  /// would drop whatever it actually holds.
  const locked = $derived(slots.some(s => s === null))
  /// Unreadable slots count as occupied; an empty readable one is free.
  const visible = $derived(slots
    .map((steps, slot) => ({ steps, slot }))
    .filter(e => e.steps === null || e.steps.length > 0 || e.slot === draft))
  const firstFree = $derived(slots.findIndex(s => s !== null && s.length === 0))
  const usedBytes = $derived(encodedSize(slots.map(s => s ?? [])))
  const percent = $derived(capacity ? Math.min(100, Math.round((usedBytes / capacity) * 100)) : 0)
  /// Enter is 2 bytes of prefix plus the code; refuse before the write fails.
  const full = $derived(usedBytes + 4 > capacity)

  const newTitle = $derived(
    locked
      ? 'Editing is disabled while an unreadable macro is stored'
      : firstFree < 0
      ? 'Every macro slot is in use'
      : full
      ? 'Macro storage is full'
      : 'Add a macro',
  )

  function commit(next: (MacroStep[] | null)[]) {
    const bytes = encodeMacros(next.map(s => s ?? []), capacity)
    if (!bytes) {
      toast.warning('Macro storage is full')
      return
    }
    void keyboardStore.setMacroRegion(bytes).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function update(slot: number, steps: MacroStep[]) {
    commit(slots.map((s, i) => (i === slot ? steps : s)))
  }

  function add() {
    if (firstFree >= 0) draft = firstFree
  }

  function remove(slot: number) {
    const steps = slots[slot]
    if (draft === slot) draft = null
    // A draft nothing was written to has nothing to clear on the keyboard.
    if (!steps || steps.length === 0) return
    update(slot, [])
    toast.success(`Deleted macro ${slot}`)
  }

  function addStep(slot: number, kind: StepKind) {
    const step: MacroStep = kind === 'text'
      ? { kind, value: 'text' }
      : kind === 'delay'
      ? { kind, ms: 100 }
      : { kind, code: catalog.table.byCode('A') ?? 0x04 }
    update(slot, [...(slots[slot] ?? []), step])
  }

  function replaceStep(slot: number, at: number, step: MacroStep) {
    update(slot, (slots[slot] ?? []).map((s, i) => (i === at ? step : s)))
  }

  function removeStep(slot: number, at: number) {
    update(slot, (slots[slot] ?? []).filter((_, i) => i !== at))
  }

  function pickKey(action: KeyAction) {
    const target = picking
    const hid = asHidKey(action)
    picking = null
    if (!target || hid === null) return
    const code = catalog.table.byCode(hid)
    if (code === undefined) {
      toast.warning(`${hidLabel(hid)} has no macro encoding`)
      return
    }
    const step = slots[target.slot]?.[target.at]
    if (step && step.kind !== 'text' && step.kind !== 'delay') replaceStep(target.slot, target.at, { ...step, code })
  }

  function stepName(step: MacroStep): HidKeyCode | string {
    return step.kind === 'text' || step.kind === 'delay' ? '' : keyLabel(step.code, catalog.table)
  }
</script>

<ScreenScroll
  title='Macros'
  desc='A sequence of keystrokes, text, and delays. Assign one to any key with Macro n.'
>
  {#snippet actions()}
    {#if capacity > 0}
      <div class='flex flex-col justify-center gap-1'>
        <span class='text-right text-xs font-bold text-muted-foreground'>
          {usedBytes} / {capacity} B
        </span>
        <div class='h-[5px] w-32 overflow-hidden rounded-full bg-base-200'>
          <div
            class={['h-full', percent > 90 ? 'bg-destructive' : 'bg-brand-dark']}
            style:width='{percent}%'
          ></div>
        </div>
      </div>
      <Button
        variant='brand'
        disabled={locked || firstFree < 0 || full}
        title={newTitle}
        onclick={add}
      >
        <Icon icon='lucide:plus' width={15} height={15} />
        New macro
      </Button>
    {/if}
  {/snippet}

  {#if capacity === 0}
    <EmptyCard>This firmware was built without macro storage.</EmptyCard>
  {:else}
    {#if locked}
      <p class='mb-3'>
        <Unsupported>
          One of the stored macros uses the extended 16-bit keycode form,
          which this editor cannot represent. Editing is disabled so the
          region is not rewritten and lost.
        </Unsupported>
      </p>
    {/if}

    <div class='flex flex-col gap-3'>
      {#each visible as entry (entry.slot)}
        {@const steps = entry.steps}
        <SlotCard
          label='Macro {entry.slot}'
          hint='Assign with the Macro {entry.slot} keycode'
          fresh={entry.slot === draft && steps !== null && steps.length === 0}
          deleteTitle='Delete macro'
          deleteDisabled={locked}
          ondelete={() => remove(entry.slot)}
        >
          {#if steps === null}
            <p class='text-xs text-muted-foreground'>
              Stored in a form this editor cannot read.
            </p>
          {:else}
            {#if steps.length > 0}
              <div class='flex flex-col gap-1.5'>
                {#each steps as step, i (i)}
                  <div class='
                    flex items-center gap-2.5 rounded-md bg-base-200 px-3 py-1.5
                  '>
                    <span class='
                      w-4.5 text-right text-xs text-muted-foreground
                    '>{i + 1}</span>
                    <span
                      class={[
                        `
                          inline-flex h-6.5 flex-none items-center rounded-full
                          px-2.5 text-[11.5px] font-bold
                        `,
                        TONES[step.kind],
                      ]}
                    >{STEP_KINDS.find(k => k.kind === step.kind)?.label}</span>

                    {#if step.kind === 'text'}
                      <input
                        class={`
                          h-8 flex-1 rounded-md border border-input
                          bg-background px-2.5 text-[12.5px] text-foreground
                          outline-none
                        `}
                        aria-label='Text for step {i + 1}'
                        disabled={locked}
                        value={step.value}
                        onchange={e => replaceStep(entry.slot, i, { kind: 'text', value: printableAscii(e.currentTarget.value) })}
                      />
                    {:else if step.kind === 'delay'}
                      <input
                        class={`
                          h-8 w-28 rounded-md border border-input bg-background
                          px-2.5 font-mono text-[12.5px] text-foreground
                          outline-none
                        `}
                        type='number'
                        min='0'
                        max={MAX_DELAY_MS}
                        aria-label='Delay for step {i + 1}'
                        disabled={locked}
                        value={step.ms}
                        onchange={e => replaceStep(entry.slot, i, { kind: 'delay', ms: e.currentTarget.valueAsNumber || 0 })}
                      />
                      <span class='text-xs text-muted-foreground'>ms</span>
                    {:else}
                      <KeyChip
                        label={stepName(step)}
                        title='Change the key for step {i + 1}'
                        disabled={locked}
                        onclick={() => (picking = { slot: entry.slot, at: i })}
                      />
                    {/if}

                    <span class='flex-1'></span>
                    <IconBtn
                      icon='lucide:x'
                      title='Remove step {i + 1}'
                      size={28}
                      disabled={locked}
                      onclick={() => removeStep(entry.slot, i)}
                    />
                  </div>
                {/each}
              </div>
            {:else}
              <p class='text-xs text-muted-foreground'>
                No steps yet — add taps, text, or delays below.
              </p>
            {/if}

            <div class='flex flex-wrap items-center gap-1.5'>
              {#each STEP_KINDS as kind (kind.kind)}
                <AddChip
                  label={kind.label}
                  title={full ? 'Macro storage is full' : `Add a ${kind.label} step`}
                  disabled={locked || full}
                  onclick={() => addStep(entry.slot, kind.kind)}
                />
              {/each}
            </div>
          {/if}
        </SlotCard>
      {/each}

      {#if visible.length === 0}
        <EmptyCard>
          No macros yet — press “New macro” to record a sequence of
          keystrokes, text, and delays.
        </EmptyCard>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      Macros share one {capacity}-byte region, so every edit rewrites all
      {MACRO_SLOTS} slots. Text is stored as ASCII and carries no modifiers —
      use Press and Release around a Tap for capitals and symbols.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay
    title='Step key'
    subtitle='Macro {picking.slot} · step {picking.at + 1}'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} hidOnly onpick={pickKey} />
  </Overlay>
{/if}
