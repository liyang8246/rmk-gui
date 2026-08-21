<script lang='ts'>
  import type { MorseStep } from '../lib/morse'
  import type { Action, KeyAction, Morse, MorseMode, MorseProfile } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import AddChip from '../components/ui/AddChip.svelte'
  import Button from '../components/ui/Button.svelte'
  import EmptyCard from '../components/ui/EmptyCard.svelte'
  import FieldRow from '../components/ui/FieldRow.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import KeyChip from '../components/ui/KeyChip.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Select from '../components/ui/Select.svelte'
  import SlotCard from '../components/ui/SlotCard.svelte'
  import { asAction } from '../lib/keycatalog'
  import { actionLabel } from '../lib/keycode'
  import { decodePattern, DOUBLE_TAP, encodePattern, HOLD, HOLD_AFTER_TAP, MAX_PATTERN_STEPS, patternName, TAP } from '../lib/morse'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const PRESETS = [TAP, HOLD, DOUBLE_TAP, HOLD_AFTER_TAP]

  const EMPTY_PROFILE: MorseProfile = {
    unilateral_tap: undefined,
    enable_flow_tap: undefined,
    mode: undefined,
    hold_timeout_ms: undefined,
    gap_timeout_ms: undefined,
    quick_tap_timeout_ms: undefined,
  }

  const EMPTY: Morse = { profile: { ...EMPTY_PROFILE }, actions: [] }

  /// Set while the action picker overlay is open: which slot, and which
  /// pattern the picked action will be bound to.
  let picking = $state<{ slot: number, pattern: number } | null>(null)
  /// Custom-pattern draft, one card at a time.
  let building = $state<{ slot: number, steps: MorseStep[] } | null>(null)
  /// Slot drafted by "New morse key": shown as a card so the key is built in
  /// place. Nothing is written until the first pattern is bound; deleting a
  /// still-blank draft touches no storage.
  let draft = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const morses = $derived(keyboardStore.config?.morses ?? [])
  /// A slot with no bound patterns is free; the firmware always reports the
  /// full array, so a draft claims the first empty one.
  const visible = $derived(morses
    .map((morse, slot) => ({ morse, slot }))
    .filter(e => e.morse.actions.length > 0 || e.slot === draft))
  const usedCount = $derived(morses.filter(m => m.actions.length > 0).length)
  const firstFree = $derived(morses.findIndex(m => m.actions.length === 0))
  const maxPatterns = $derived(caps?.max_patterns_per_key ?? 0)

  function save(slot: number, morse: Morse) {
    void keyboardStore.setMorse(slot, morse).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function add() {
    if (firstFree >= 0) draft = firstFree
  }

  function remove(slot: number) {
    const morse = morses[slot]
    if (draft === slot) draft = null
    if (building?.slot === slot) building = null
    // A draft nothing was written to has nothing to clear on the keyboard.
    if (!morse || JSON.stringify(morse) === JSON.stringify(EMPTY)) return
    const had = morse.actions.length > 0
    save(slot, { profile: { ...EMPTY_PROFILE }, actions: [] })
    if (had) toast.success(`Deleted morse key ${slot}`)
  }

  function apply(action: KeyAction) {
    const target = picking
    if (!target) return
    const plain = asAction(action)
    if (plain === null) {
      toast.warning('A morse action must be a plain key')
      return
    }
    picking = null
    const morse = morses[target.slot]
    if (!morse) return
    const at = morse.actions.findIndex(([p]) => p === target.pattern)
    const actions: [number, Action][] = at >= 0
      ? morse.actions.map(([p, a], i) => (i === at ? [p, plain] : [p, a]))
      : [...morse.actions, [target.pattern, plain]]
    save(target.slot, { ...morse, actions })
  }

  function dropPattern(slot: number, pattern: number) {
    const morse = morses[slot]
    if (!morse) return
    save(slot, { ...morse, actions: morse.actions.filter(([p]) => p !== pattern) })
  }

  function pickFor(slot: number, pattern: number) {
    const morse = morses[slot]
    if (morse && morse.actions.every(([p]) => p !== pattern) && morse.actions.length >= maxPatterns) {
      toast.warning(`Limit: ${maxPatterns} patterns per morse key`)
      return
    }
    picking = { slot, pattern }
  }

  function confirmBuild() {
    const b = building
    if (!b || b.steps.length === 0) return
    const pattern = encodePattern(b.steps)
    const morse = morses[b.slot]
    if (morse?.actions.some(([p]) => p === pattern)) {
      toast.warning(`${patternName(pattern)} is already bound on this key`)
      return
    }
    building = null
    pickFor(b.slot, pattern)
  }

  function setProfile(slot: number, patch: Partial<MorseProfile>) {
    const morse = morses[slot]
    if (!morse) return
    save(slot, { ...morse, profile: { ...morse.profile, ...patch } })
  }

  function timeout(slot: number, field: 'hold_timeout_ms' | 'gap_timeout_ms' | 'quick_tap_timeout_ms', raw: string) {
    const n = raw === '' ? undefined : Math.max(0, Math.min(8191, Number(raw) || 0))
    setProfile(slot, { [field]: n })
  }

  const TRI = [
    { value: 'default', label: 'default' },
    { value: 'on', label: 'on' },
    { value: 'off', label: 'off' },
  ]

  function triValue(v: boolean | undefined): string {
    return v === undefined ? 'default' : v ? 'on' : 'off'
  }

  function triSet(v: string): boolean | undefined {
    return v === 'default' ? undefined : v === 'on'
  }

  const MODES = [
    { value: 'default', label: 'default' },
    { value: 'PermissiveHold', label: 'Permissive hold' },
    { value: 'HoldOnOtherPress', label: 'Hold on other press' },
    { value: 'Normal', label: 'On timeout' },
  ]

  const TIMEOUTS = [
    { field: 'hold_timeout_ms', label: 'Hold timeout', hint: 'Held longer counts as a hold.' },
    { field: 'gap_timeout_ms', label: 'Gap timeout', hint: 'A longer pause ends the sequence.' },
    { field: 'quick_tap_timeout_ms', label: 'Quick tap', hint: 'Retapping within this repeats the tap.' },
  ] as const
</script>

{#snippet patternChips(pattern: number)}
  <span class='inline-flex items-center gap-1' title={patternName(pattern)}>
    {#each decodePattern(pattern) as step, i (i)}
      <span
        class={[
          'inline-block rounded-full bg-brand-dark',
          step === 'tap' ? 'size-[7px]' : 'h-[7px] w-4',
        ]}
      ></span>
    {/each}
  </span>
{/snippet}

<ScreenScroll
  title='Morse'
  desc='One key, a different action for each tap and hold pattern.'
>
  {#snippet actions()}
    {#if morses.length > 0}
      <span class='self-center text-xs text-muted-foreground'>
        {usedCount} / {morses.length} used
      </span>
      <Button
        variant='brand'
        disabled={firstFree < 0}
        title={firstFree < 0 ? 'Every slot is in use' : undefined}
        onclick={add}
      >
        <Icon icon='lucide:plus' width={15} height={15} />
        New morse key
      </Button>
    {/if}
  {/snippet}

  {#if morses.length === 0}
    <EmptyCard>This firmware was built without morse keys.</EmptyCard>
  {:else}
    <div class='flex flex-col gap-3'>
      {#each visible as entry (entry.slot)}
        {@const morse = entry.morse}
        <SlotCard
          label='Morse {entry.slot}'
          hint='Assign with the Morse {entry.slot} keycode'
          fresh={entry.slot === draft && morse.actions.length === 0}
          deleteTitle='Delete morse key'
          advancedTitle='Timing profile'
          ondelete={() => remove(entry.slot)}
        >
          {#if morse.actions.length > 0}
            <div class='flex flex-col gap-1.5'>
              {#each morse.actions as [pattern, action] (pattern)}
                <div class='
                  flex items-center gap-3 rounded-md bg-base-200 px-3 py-1.5
                '>
                  {@render patternChips(pattern)}
                  <span class='w-24 text-xs text-muted-foreground'>{patternName(pattern)}</span>
                  <Icon class='text-brand' icon='lucide:chevron-right' width={15} height={15} />
                  <KeyChip
                    label={actionLabel(action)}
                    title='Change the {patternName(pattern).toLowerCase()} action'
                    onclick={() => pickFor(entry.slot, pattern)}
                  />
                  <span class='flex-1'></span>
                  <IconBtn
                    icon='lucide:x'
                    title='Remove pattern'
                    size={28}
                    onclick={() => dropPattern(entry.slot, pattern)}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <p class='text-xs text-muted-foreground'>
              No patterns yet — bind one below.
            </p>
          {/if}

          <div class='flex flex-wrap items-center gap-1.5'>
            {#each PRESETS as preset (preset)}
              {@const taken = morse.actions.some(([p]) => p === preset)}
              {@const capped = !taken && morse.actions.length >= maxPatterns}
              <AddChip
                label={patternName(preset)}
                title={taken
                  ? `${patternName(preset)} is already bound`
                  : capped
                  ? `Limit: ${maxPatterns} patterns per morse key`
                  : `Bind ${patternName(preset)}`}
                disabled={taken || capped}
                onclick={() => pickFor(entry.slot, preset)}
              />
            {/each}

            {#if building?.slot === entry.slot}
              {@const b = building}
              <span class='
                inline-flex h-8 items-center gap-1.5 rounded-md bg-base-200 px-2
              '>
                {#if b.steps.length}
                  {@render patternChips(encodePattern(b.steps))}
                {:else}
                  <span class='text-xs text-muted-foreground'>tap or hold…</span>
                {/if}
              </span>
              <Button size='sm' disabled={b.steps.length >= MAX_PATTERN_STEPS} onclick={() => { b.steps = [...b.steps, 'tap'] }}>Tap</Button>
              <Button size='sm' disabled={b.steps.length >= MAX_PATTERN_STEPS} onclick={() => { b.steps = [...b.steps, 'hold'] }}>Hold</Button>
              <IconBtn
                icon='lucide:delete'
                title='Remove last step'
                size={28}
                disabled={b.steps.length === 0}
                onclick={() => { b.steps = b.steps.slice(0, -1) }}
              />
              <IconBtn
                icon='lucide:check'
                title='Pick the action for this pattern'
                size={28}
                disabled={b.steps.length === 0}
                onclick={confirmBuild}
              />
              <IconBtn
                icon='lucide:x'
                title='Cancel'
                size={28}
                onclick={() => (building = null)}
              />
            {:else}
              <AddChip
                label='Custom…'
                title='Build a custom tap/hold pattern'
                onclick={() => (building = { slot: entry.slot, steps: [] })}
              />
            {/if}
          </div>

          {#snippet advanced()}
            <FieldRow label='Decision mode' hint='How a press picks tap or hold.'>
              <Select
                items={MODES}
                value={morse.profile.mode ?? 'default'}
                label='Decision mode'
                onchange={v => setProfile(entry.slot, { mode: v === 'default' ? undefined : v as MorseMode })}
              />
            </FieldRow>
            {#each TIMEOUTS as t (t.field)}
              <FieldRow label={t.label} hint={t.hint}>
                <input
                  class={`
                    h-8 w-24 rounded-md border border-input bg-background px-2.5
                    font-mono text-[12.5px] text-foreground outline-none
                  `}
                  type='number'
                  min='0'
                  max='8191'
                  placeholder='default'
                  aria-label={t.label}
                  value={morse.profile[t.field] ?? ''}
                  onchange={e => timeout(entry.slot, t.field, e.currentTarget.value)}
                />
                <span class='text-xs text-muted-foreground'>ms</span>
              </FieldRow>
            {/each}
            <FieldRow label='Unilateral tap' hint='A same-hand key after this one forces a tap.'>
              <Select
                items={TRI}
                value={triValue(morse.profile.unilateral_tap)}
                label='Unilateral tap'
                onchange={v => setProfile(entry.slot, { unilateral_tap: triSet(v) })}
              />
            </FieldRow>
            <FieldRow label='Flow tap' hint='Fast typing resolves this key as a tap.'>
              <Select
                items={TRI}
                value={triValue(morse.profile.enable_flow_tap)}
                label='Flow tap'
                onchange={v => setProfile(entry.slot, { enable_flow_tap: triSet(v) })}
              />
            </FieldRow>
          {/snippet}
        </SlotCard>
      {/each}

      {#if visible.length === 0}
        <EmptyCard>No morse keys yet.</EmptyCard>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      Timing left at “default” follows the keyboard-wide values.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay
    title='{patternName(picking.pattern)} action'
    subtitle='Morse {picking.slot}'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} onpick={apply} />
  </Overlay>
{/if}
