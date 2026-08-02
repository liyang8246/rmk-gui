<script lang='ts'>
  import type { MacroStep, StepKind } from '../lib/macro-codec'
  import type { HidKeyCode, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import Card from '../components/ui/Card.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
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

  let selected = $state(0)
  /// Set while the key picker is open, to the step it will fill.
  let picking = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const capacity = $derived(caps?.macro_space_size ?? 0)
  const region = $derived(keyboardStore.config?.macros ?? [])
  const slots = $derived(decodeMacros(region, MACRO_SLOTS))
  const current = $derived(slots[selected] ?? [])
  /// A slot the codec could not read is not editable: rewriting the region
  /// would drop whatever it actually holds.
  const locked = $derived(slots.some(s => s === null))
  const used = $derived(encodedSize(slots.map(s => s ?? [])))
  const percent = $derived(capacity ? Math.min(100, Math.round((used / capacity) * 100)) : 0)
  /// Enter is 2 bytes of prefix plus the code; refuse before the write fails.
  const full = $derived(used + 4 > capacity)

  function commit(next: (MacroStep[] | null)[]) {
    const bytes = encodeMacros(next.map(s => s ?? []), capacity)
    if (!bytes) {
      toast.show('Macro storage is full')
      return
    }
    void keyboardStore.setMacroRegion(bytes).mapErr(e => toast.show(describeKeyboardError(e)))
  }

  function update(steps: MacroStep[]) {
    commit(slots.map((s, i) => (i === selected ? steps : s)))
  }

  function addStep(kind: StepKind) {
    const step: MacroStep = kind === 'text'
      ? { kind, value: 'text' }
      : kind === 'delay'
      ? { kind, ms: 100 }
      : { kind, code: catalog.table.byCode('A') ?? 0x04 }
    update([...current, step])
  }

  function replace(at: number, step: MacroStep) {
    update(current.map((s, i) => (i === at ? step : s)))
  }

  function pickKey(action: KeyAction) {
    const at = picking
    const hid = asHidKey(action)
    picking = null
    if (at === null || hid === null) return
    const code = catalog.table.byCode(hid)
    if (code === undefined) {
      toast.show(`${hidLabel(hid)} has no macro encoding`)
      return
    }
    const step = current[at]
    if (step && step.kind !== 'text' && step.kind !== 'delay') replace(at, { ...step, code })
  }

  function stepName(step: MacroStep): HidKeyCode | string {
    return step.kind === 'text' || step.kind === 'delay' ? '' : keyLabel(step.code, catalog.table)
  }
</script>

<ScreenScroll
  title='Macros'
  desc='A sequence of keystrokes, text, and delays. Assign one to any key with Macro n.'
>
  {#if capacity === 0}
    <Card>
      <p class='py-3 text-center text-[13px] text-muted-foreground'>
        This firmware was built without macro storage.
      </p>
    </Card>
  {:else}
    <div class='flex items-start gap-[18px]'>
      <Card class='w-48 flex-none p-1.5' flush>
        {#each slots as steps, i (i)}
          <button
            class={[
              `
                mb-0.5 flex w-full cursor-pointer items-center gap-2.5
                rounded-md px-3 py-2.5 text-left
              `,
              i === selected ? 'bg-brand-tint-strong' : 'hover:bg-base-200',
            ]}
            type='button'
            onclick={() => (selected = i)}
          >
            <span class='w-6.5 text-xs font-extrabold text-brand-darker'>M{i}</span>
            <span
              class={[
                'text-[13.5px]',
                i === selected
                  ? 'font-bold text-foreground'
                  : `text-muted-foreground`,
              ]}
            >{steps === null ? 'Unreadable' : steps.length ? `${steps.length} steps` : 'Empty'}</span>
          </button>
        {/each}

        <div class='px-3 pt-2.5 pb-1'>
          <div class='mb-1.5 flex items-baseline gap-1.5'>
            <span class='text-xs font-bold text-muted-foreground'>
              {used} / {capacity} B
            </span>
            <span class='ml-auto text-xs text-muted-foreground'>{percent}%</span>
          </div>
          <div class='h-[5px] overflow-hidden rounded-full bg-base-200'>
            <div
              class={['h-full', percent > 90
                ? 'bg-destructive'
                : `bg-brand-dark`]}
              style:width='{percent}%'
            ></div>
          </div>
        </div>
      </Card>

      <Card class='flex-1'>
        <div class='mb-4 flex items-center gap-2.5'>
          <span class='text-xs font-extrabold text-brand-darker'>M{selected}</span>
          <span class='text-[13.5px] font-semibold text-foreground'>
            Assign with the <b class='text-brand-darker'>Macro {selected}</b> keycode
          </span>
        </div>

        {#if locked}
          <p class='mb-4'>
            <Unsupported>
              One of the stored macros uses the extended 16-bit keycode form,
              which this editor cannot represent. Editing is disabled so the
              region is not rewritten and lost.
            </Unsupported>
          </p>
        {/if}

        <div class='mb-4 flex flex-col gap-2'>
          {#if current.length === 0}
            <p class='py-3 text-xs text-muted-foreground'>This macro is empty.</p>
          {/if}
          {#each current as step, i (i)}
            <div class='
              flex items-center gap-2.5 rounded-md bg-base-200 px-2.5 py-2
            '>
              <span class='w-4.5 text-right text-xs text-muted-foreground'>{i + 1}</span>
              <span
                class={[
                  `
                    inline-flex h-6.5 flex-none items-center rounded-full px-2.5
                    text-[11.5px] font-bold
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
                  onchange={e => replace(i, { kind: 'text', value: printableAscii(e.currentTarget.value) })}
                />
              {:else if step.kind === 'delay'}
                <input
                  class={`
                    h-8 w-28 rounded-md border border-input bg-background px-2.5
                    font-mono text-[12.5px] text-foreground outline-none
                  `}
                  type='number'
                  min='0'
                  max={MAX_DELAY_MS}
                  aria-label='Delay for step {i + 1}'
                  disabled={locked}
                  value={step.ms}
                  onchange={e => replace(i, { kind: 'delay', ms: e.currentTarget.valueAsNumber || 0 })}
                />
                <span class='text-xs text-muted-foreground'>ms</span>
              {:else}
                <button
                  class={`
                    inline-flex h-8 min-w-24 cursor-pointer items-center gap-2
                    rounded-md border border-input bg-background px-2.5
                    text-left text-[12.5px] font-semibold text-foreground
                    hover:enabled:border-brand
                    disabled:cursor-not-allowed disabled:opacity-45
                  `}
                  type='button'
                  disabled={locked}
                  onclick={() => (picking = i)}
                >
                  {stepName(step)}
                  <Icon
                    class='ml-auto text-muted-foreground'
                    icon='lucide:chevron-down'
                    width={14}
                    height={14}
                  />
                </button>
              {/if}

              <span class='flex-1'></span>
              <IconBtn
                icon='lucide:x'
                title='Remove step {i + 1}'
                size={30}
                disabled={locked}
                onclick={() => update(current.filter((_, j) => j !== i))}
              />
            </div>
          {/each}
        </div>

        <div class='flex flex-wrap gap-[7px] border-t border-border pt-3.5'>
          {#each STEP_KINDS as kind (kind.kind)}
            <button
              class={`
                inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md
                border border-dashed border-border px-3 text-[12.5px]
                font-semibold text-muted-foreground
                hover:enabled:border-brand hover:enabled:text-brand-darker
                disabled:cursor-not-allowed disabled:opacity-45
              `}
              type='button'
              disabled={locked || full}
              title={full ? 'Macro storage is full' : `Add a ${kind.label} step`}
              onclick={() => addStep(kind.kind)}
            >
              <Icon icon='lucide:plus' width={13} height={13} />
              {kind.label}
            </button>
          {/each}
        </div>
      </Card>
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      Macros share one {capacity}-byte region, so every edit rewrites all
      {MACRO_SLOTS} slots. Text is stored as ASCII and carries no modifiers —
      use Press and Release around a Tap for capitals and symbols.
    </p>
  {/if}
</ScreenScroll>

{#if picking !== null}
  <Overlay
    title='Macro key'
    subtitle='Choose the key for step {picking + 1} of M{selected}.'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} hidOnly onpick={pickKey} />
  </Overlay>
{/if}
