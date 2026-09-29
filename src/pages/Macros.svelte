<script lang='ts'>
  import type { MacroStep, StepKind } from '../lib/macro-editor'
  import type { KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import { tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { prefersReducedMotion } from 'svelte/motion'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import AddChip from '../components/ui/AddChip.svelte'
  import Button from '../components/ui/Button.svelte'
  import EmptyCard from '../components/ui/EmptyCard.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import KeyChip from '../components/ui/KeyChip.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import SlotCard from '../components/ui/SlotCard.svelte'
  import { asAction } from '../lib/keycatalog'
  import { actionLabel } from '../lib/keycode'
  import { fromSteps, MAX_DELAY_MS, moveStep, stepKeys, toSteps, validateMacro } from '../lib/macro-editor'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const STEP_KINDS = [
    { kind: 'tap', label: 'Tap' },
    { kind: 'press', label: 'Press' },
    { kind: 'release', label: 'Release' },
    { kind: 'text', label: 'Type text' },
    { kind: 'delay', label: 'Delay' },
    { kind: 'pause', label: 'Wait for release' },
  ] as const satisfies readonly { kind: StepKind, label: string }[]

  const TONES: Record<StepKind, string> = {
    tap: 'bg-brand-tint-strong text-brand-darker',
    press: 'bg-brand-tint-strong text-brand-darker',
    release: 'bg-brand-tint-strong text-brand-darker',
    text: 'bg-info/14 text-info',
    delay: 'bg-muted text-muted-foreground',
    pause: 'bg-muted text-muted-foreground',
  }

  let picking = $state<{ slot: number, at: number } | null>(null)
  let draft = $state<number | null>(null)
  let dragging = $state<{ slot: number, from: number } | null>(null)
  let dropAt = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const capacity = $derived(caps?.macro_max_size ?? 0)
  const macros = $derived(keyboardStore.config?.macros ?? [])
  const slots = $derived(macros.map(toSteps))
  const locked = $derived(!caps?.macros_writable)
  const visible = $derived(slots.map((steps, slot) => ({ steps, slot }))
    .filter(e => e.steps.length > 0 || e.slot === draft))
  const firstFree = $derived(slots.findIndex(s => s.length === 0))
  const usedSlots = $derived(slots.filter(s => s.length > 0).length)
  const percent = $derived(slots.length ? Math.round(100 * usedSlots / slots.length) : 0)
  const newTitle = $derived(locked ? 'Macros are read-only on this keyboard' : firstFree < 0 ? 'Every slot is in use' : undefined)

  function update(slot: number, steps: MacroStep[]) {
    const ops = fromSteps(steps)
    const error = validateMacro(ops, capacity)
    if (error) {
      toast.warning(error)
      return
    }
    void keyboardStore.setMacro(slot, ops).mapErr(e => toast.error(describeKeyboardError(e)))
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
      : kind === 'pause'
      ? { kind }
      : { kind, action: { Key: { Hid: 'A' } } }
    update(slot, [...(slots[slot] ?? []), step])
  }

  function replaceStep(slot: number, at: number, step: MacroStep) {
    update(slot, (slots[slot] ?? []).map((s, i) => (i === at ? step : s)))
  }

  function removeStep(slot: number, at: number) {
    update(slot, (slots[slot] ?? []).filter((_, i) => i !== at))
  }

  function reorder(slot: number, from: number, to: number): boolean {
    const steps = slots[slot] ?? []
    if (to === from || to === from + 1 || to < 0 || to > steps.length) return false
    update(slot, moveStep(steps, from, to))
    return true
  }

  function nudge(e: KeyboardEvent, slot: number, from: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const up = e.key === 'ArrowUp'
    const list = (e.currentTarget as HTMLElement).closest('[role="list"]')
    if (!reorder(slot, from, up ? from - 1 : from + 2)) return
    // Moving a focused node in the DOM blurs it.
    void tick().then(() => list?.querySelectorAll<HTMLElement>('[data-handle]')[up ? from - 1 : from + 1]?.focus())
  }

  function lineAt(slot: number, at: number): boolean {
    return dragging?.slot === slot && dropAt === at && at !== dragging.from && at !== dragging.from + 1
  }

  function startDrag(e: DragEvent, slot: number, from: number) {
    const row = (e.currentTarget as HTMLElement).closest('[data-step]')
    if (!e.dataTransfer || !row) return
    e.dataTransfer.effectAllowed = 'move'
    // Firefox refuses to start a drag that carries no data.
    e.dataTransfer.setData('text/plain', '')
    e.dataTransfer.setDragImage(row, 16, row.clientHeight / 2)
    dragging = { slot, from }
  }

  function dragOver(e: DragEvent, slot: number, at: number) {
    if (dragging?.slot !== slot) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dropAt = e.clientY < rect.top + rect.height / 2 ? at : at + 1
  }

  function drop(e: DragEvent, slot: number) {
    if (dragging?.slot !== slot) return
    e.preventDefault()
    if (dropAt !== null) reorder(slot, dragging.from, dropAt)
    endDrag()
  }

  function endDrag() {
    dragging = null
    dropAt = null
  }

  function pickKey(pick: KeyAction) {
    const target = picking
    const action = asAction(pick)
    picking = null
    if (!target || action === null || (typeof action === 'object' && 'TriggerMacro' in action)) return
    const step = slots[target.slot]?.[target.at]
    if (step && 'action' in step) replaceStep(target.slot, target.at, { ...step, action })
  }

  function stepName(step: MacroStep): string {
    return 'action' in step ? actionLabel(step.action) : ''
  }
</script>

<ScreenScroll
  title='Macros'
  desc='A sequence of keystrokes, text, and delays.'
>
  {#snippet actions()}
    {#if capacity > 0}
      <div class='flex flex-col justify-center gap-1'>
        <span class='text-right text-xs font-bold text-muted-foreground'>
          {usedSlots} / {slots.length} macros
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
        disabled={locked || firstFree < 0}
        title={newTitle}
        onclick={add}
      >
        <Icon icon='lucide:plus' width={15} height={15} />
        New macro
      </Button>
    {/if}
  {/snippet}

  {#if capacity === 0}
    <EmptyCard>This firmware has no macro slots.</EmptyCard>
  {:else}
    {#if locked}
      <p class='mb-3 text-sm text-muted-foreground'>Macros are read-only on this keyboard.</p>
    {/if}

    <div class='flex flex-col gap-3'>
      {#each visible as entry (entry.slot)}
        {@const steps = entry.steps}
        {@const keys = stepKeys(steps)}
        <SlotCard
          label='Macro {entry.slot}'
          hint='{macros[entry.slot]?.length ?? 0} / {capacity} operations · assign with Macro {entry.slot}'
          fresh={entry.slot === draft && steps.length === 0}
          deleteTitle='Delete macro'
          deleteDisabled={locked}
          ondelete={() => remove(entry.slot)}
        >
          {#if steps.length > 0}
            <div
              class='flex flex-col gap-1.5'
              role='list'
              ondragover={(e) => {
                if (dragging?.slot === entry.slot) e.preventDefault()
              }}
              ondrop={e => drop(e, entry.slot)}
              ondragleave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) dropAt = null
              }}
            >
              {#each steps as step, i (keys[i])}
                <div
                  class={[
                    `
                      relative flex items-center gap-2.5 rounded-md bg-base-200
                      py-1.5 pr-3 pl-1
                    `,
                    dragging?.slot === entry.slot && dragging.from === i && `
                      opacity-45
                    `,
                  ]}
                  role='listitem'
                  data-step
                  animate:flip={{ duration: prefersReducedMotion.current ? 0 : 150 }}
                  ondragover={e => dragOver(e, entry.slot, i)}
                >
                  {#if lineAt(entry.slot, i) || (i === steps.length - 1 && lineAt(entry.slot, steps.length))}
                    <span
                      class={[
                        `
                          pointer-events-none absolute inset-x-0 h-0.5
                          rounded-full bg-brand
                        `,
                        lineAt(entry.slot, i) ? '-top-1' : '-bottom-1',
                      ]}
                    ></span>
                  {/if}
                  <button
                    class='
                      inline-flex h-7 w-5 flex-none cursor-grab items-center
                      justify-center rounded-sm text-muted-foreground
                      active:cursor-grabbing
                      hover:enabled:text-foreground
                      disabled:cursor-default disabled:opacity-45
                    '
                    type='button'
                    data-handle
                    title='Drag to reorder, or use the arrow keys'
                    aria-label='Move step {i + 1}'
                    disabled={locked || steps.length < 2}
                    draggable={!locked && steps.length > 1}
                    ondragstart={e => startDrag(e, entry.slot, i)}
                    ondragend={endDrag}
                    onkeydown={e => nudge(e, entry.slot, i)}
                  >
                    <Icon icon='lucide:grip-vertical' width={14} height={14} />
                  </button>
                  <span class='w-4.5 text-right text-xs text-muted-foreground'>{i + 1}</span>
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
                        h-8 flex-1 rounded-md border border-input bg-background
                        px-2.5 text-[12.5px] text-foreground outline-none
                      `}
                      aria-label='Text for step {i + 1}'
                      disabled={locked}
                      value={step.value}
                      onchange={e => replaceStep(entry.slot, i, { kind: 'text', value: e.currentTarget.value })}
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
                  {:else if step.kind === 'pause'}
                    <span class='text-xs text-muted-foreground'>Continue when the macro key is released</span>
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
              No steps yet — add one below.
            </p>
          {/if}

          <div class='flex flex-wrap items-center gap-1.5'>
            {#each STEP_KINDS as kind (kind.kind)}
              <AddChip
                label={kind.label}
                title={`Add ${kind.label}`}
                disabled={locked || (macros[entry.slot]?.length ?? 0) >= capacity || (kind.kind === 'pause' && steps.some(s => s.kind === 'pause'))}
                onclick={() => addStep(entry.slot, kind.kind)}
              />
            {/each}
          </div>
        </SlotCard>
      {/each}

      {#if visible.length === 0}
        <EmptyCard>No macros yet.</EmptyCard>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      Text accepts ASCII, including capitals and symbols. Each character uses one operation.
      Unpaired key and modifier presses are released when the macro ends.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay
    title='Step key'
    subtitle='Macro {picking.slot} · step {picking.at + 1}'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} macroOnly onpick={pickKey} />
  </Overlay>
{/if}
