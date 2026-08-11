<script lang='ts'>
  import type { MorseStep } from '../lib/morse'
  import type { Action, KeyAction, Morse, MorseMode, MorseProfile } from '../rynk'
  import Icon from '@iconify/svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import Overlay from '../components/ui/Overlay.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Select from '../components/ui/Select.svelte'
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

  /// Set while the action picker overlay is open: which slot, and which
  /// pattern the picked action will be bound to.
  let picking = $state<{ slot: number, pattern: number } | null>(null)
  /// Custom-pattern draft, one card at a time.
  let building = $state<{ slot: number, steps: MorseStep[] } | null>(null)
  /// Which card shows its timing profile.
  let profileOpen = $state<number | null>(null)

  const caps = $derived(keyboardStore.device?.capabilities)
  const morses = $derived(keyboardStore.config?.morses ?? [])
  const used = $derived(morses.map((m, slot) => ({ morse: m, slot })).filter(e => e.morse.actions.length > 0))
  const firstFree = $derived(morses.findIndex(m => m.actions.length === 0))
  const maxPatterns = $derived(caps?.max_patterns_per_key ?? 0)

  function save(slot: number, morse: Morse) {
    void keyboardStore.setMorse(slot, morse).mapErr(e => toast.error(describeKeyboardError(e)))
  }

  function remove(slot: number) {
    save(slot, { profile: { ...EMPTY_PROFILE }, actions: [] })
    toast.success(`Cleared morse ${slot}`)
  }

  function apply(action: KeyAction) {
    const target = picking
    if (!target) return
    const plain = asAction(action)
    if (plain === null) {
      toast.warning('A morse action must be a plain action — not transparent or another morse key')
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
      toast.warning(`This firmware allows ${maxPatterns} patterns per morse key`)
      return
    }
    picking = { slot, pattern }
  }

  function confirmBuild() {
    const draft = building
    if (!draft || draft.steps.length === 0) return
    const pattern = encodePattern(draft.steps)
    const morse = morses[draft.slot]
    if (morse?.actions.some(([p]) => p === pattern)) {
      toast.warning(`${patternName(pattern)} is already bound on this key`)
      return
    }
    building = null
    pickFor(draft.slot, pattern)
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
    { field: 'hold_timeout_ms', label: 'Hold timeout', hint: 'Held longer than this counts as a hold.' },
    { field: 'gap_timeout_ms', label: 'Gap timeout', hint: 'A longer pause ends the tap sequence.' },
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
  desc='Tap dance: one key runs a different action for each tap/hold pattern.'
>
  {#snippet actions()}
    <Button
      variant='brand'
      disabled={firstFree < 0}
      title={firstFree < 0 ? 'Every morse slot is in use' : 'Add a morse key'}
      onclick={() => pickFor(firstFree, TAP)}
    >
      <Icon icon='lucide:plus' width={15} height={15} />
      New morse key
    </Button>
  {/snippet}

  {#if (caps?.max_morse ?? 0) === 0}
    <Card>
      <p class='py-3 text-center text-[13px] text-muted-foreground'>
        This firmware was built without morse keys.
      </p>
    </Card>
  {:else}
    <div class='flex flex-col gap-3'>
      {#each used as entry (entry.slot)}
        {@const morse = entry.morse}
        <Card class='flex flex-col gap-3'>
          <div class='flex items-center gap-2.5'>
            <span class='text-xs font-extrabold text-brand-darker'>Morse {entry.slot}</span>
            <span class='text-[13px] text-muted-foreground'>
              Assign with the <b class='text-brand-darker'>Morse {entry.slot}</b> keycode
            </span>
            <div class='ml-auto flex items-center gap-1'>
              <IconBtn
                icon='lucide:timer'
                title='Timing profile'
                size={32}
                active={profileOpen === entry.slot}
                onclick={() => (profileOpen = profileOpen === entry.slot ? null : entry.slot)}
              />
              <IconBtn
                icon='lucide:trash-2'
                title='Delete morse key'
                size={32}
                onclick={() => remove(entry.slot)}
              />
            </div>
          </div>

          <div class='flex flex-col gap-1.5'>
            {#each morse.actions as [pattern, action] (pattern)}
              <div class='
                flex items-center gap-3 rounded-md bg-base-200 px-3 py-1.5
              '>
                {@render patternChips(pattern)}
                <span class='w-24 text-xs text-muted-foreground'>{patternName(pattern)}</span>
                <Icon class='text-brand' icon='lucide:chevron-right' width={15} height={15} />
                <button
                  class={`
                    inline-flex h-8 min-w-12 cursor-pointer items-center
                    justify-center rounded-[7px] border border-base-300
                    bg-base-100 px-2 text-[13px] font-bold text-foreground
                    hover:border-brand
                  `}
                  type='button'
                  onclick={() => pickFor(entry.slot, pattern)}
                >
                  {actionLabel(action)}
                </button>
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

          <div class='flex flex-wrap items-center gap-1.5'>
            {#each PRESETS as preset (preset)}
              {@const taken = morse.actions.some(([p]) => p === preset)}
              <button
                class={`
                  inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md
                  border border-dashed border-border px-2.5 text-xs
                  font-semibold text-muted-foreground
                  hover:enabled:border-brand hover:enabled:text-brand-darker
                  disabled:cursor-not-allowed disabled:opacity-45
                `}
                type='button'
                disabled={taken}
                title={taken ? `${patternName(preset)} is already bound` : `Bind ${patternName(preset)}`}
                onclick={() => pickFor(entry.slot, preset)}
              >
                <Icon icon='lucide:plus' width={12} height={12} />
                {patternName(preset)}
              </button>
            {/each}

            {#if building?.slot === entry.slot}
              {@const draft = building}
              <span class='
                inline-flex h-7 items-center gap-1.5 rounded-md bg-base-200 px-2
              '>
                {#if draft.steps.length}
                  {@render patternChips(encodePattern(draft.steps))}
                {:else}
                  <span class='text-xs text-muted-foreground'>tap or hold…</span>
                {/if}
              </span>
              <Button size='sm' disabled={draft.steps.length >= MAX_PATTERN_STEPS} onclick={() => { draft.steps = [...draft.steps, 'tap'] }}>Tap</Button>
              <Button size='sm' disabled={draft.steps.length >= MAX_PATTERN_STEPS} onclick={() => { draft.steps = [...draft.steps, 'hold'] }}>Hold</Button>
              <IconBtn
                icon='lucide:delete'
                title='Remove last step'
                size={28}
                disabled={draft.steps.length === 0}
                onclick={() => { draft.steps = draft.steps.slice(0, -1) }}
              />
              <IconBtn
                icon='lucide:check'
                title='Pick the action for this pattern'
                size={28}
                disabled={draft.steps.length === 0}
                onclick={confirmBuild}
              />
              <IconBtn
                icon='lucide:x'
                title='Cancel'
                size={28}
                onclick={() => (building = null)}
              />
            {:else}
              <button
                class={`
                  inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md
                  border border-dashed border-border px-2.5 text-xs
                  font-semibold text-muted-foreground
                  hover:border-brand hover:text-brand-darker
                `}
                type='button'
                onclick={() => (building = { slot: entry.slot, steps: [] })}
              >
                <Icon icon='lucide:plus' width={12} height={12} />
                Custom…
              </button>
            {/if}
          </div>

          {#if profileOpen === entry.slot}
            <div class='
              flex flex-col gap-2.5 border-t border-border pt-3 text-[13px]
            '>
              <div class='flex items-center gap-3'>
                <span class='w-28 font-semibold text-foreground'>Decision mode</span>
                <Select
                  items={MODES}
                  value={morse.profile.mode ?? 'default'}
                  label='Decision mode'
                  onchange={v => setProfile(entry.slot, { mode: v === 'default' ? undefined : v as MorseMode })}
                />
                <span class='text-xs text-muted-foreground'>
                  How a press decides between tap and hold.
                </span>
              </div>
              {#each TIMEOUTS as t (t.field)}
                <div class='flex items-center gap-3'>
                  <span class='w-28 font-semibold text-foreground'>{t.label}</span>
                  <input
                    class={`
                      h-8 w-24 rounded-md border border-input bg-background
                      px-2.5 font-mono text-[12.5px] text-foreground
                      outline-none
                    `}
                    type='number'
                    min='0'
                    max='8191'
                    placeholder='default'
                    aria-label={t.label}
                    value={morse.profile[t.field] ?? ''}
                    onchange={e => timeout(entry.slot, t.field, e.currentTarget.value)}
                  />
                  <span class='text-xs text-muted-foreground'>ms · {t.hint}</span>
                </div>
              {/each}
              <div class='flex items-center gap-3'>
                <span class='w-28 font-semibold text-foreground'>Unilateral tap</span>
                <Select
                  items={TRI}
                  value={triValue(morse.profile.unilateral_tap)}
                  label='Unilateral tap'
                  onchange={v => setProfile(entry.slot, { unilateral_tap: triSet(v) })}
                />
                <span class='text-xs text-muted-foreground'>
                  A same-hand key after this one forces a tap.
                </span>
              </div>
              <div class='flex items-center gap-3'>
                <span class='w-28 font-semibold text-foreground'>Flow tap</span>
                <Select
                  items={TRI}
                  value={triValue(morse.profile.enable_flow_tap)}
                  label='Flow tap'
                  onchange={v => setProfile(entry.slot, { enable_flow_tap: triSet(v) })}
                />
                <span class='text-xs text-muted-foreground'>
                  Fast typing resolves this key as a tap.
                </span>
              </div>
            </div>
          {/if}
        </Card>
      {/each}

      {#if used.length === 0}
        <Card>
          <p class='py-3 text-center text-xs text-muted-foreground'>
            No morse keys yet.
          </p>
        </Card>
      {/if}
    </div>

    <p class='mt-3.5 text-xs text-muted-foreground'>
      This firmware has {morses.length} morse slots, each holding up to
      {maxPatterns} patterns of at most {MAX_PATTERN_STEPS} steps. Timing
      fields left at “default” inherit the keyboard-wide values.
    </p>
  {/if}
</ScreenScroll>

{#if picking}
  <Overlay
    title='{patternName(picking.pattern)} action'
    subtitle='Choose what morse {picking.slot} does on {patternName(picking.pattern).toLowerCase()}.'
    onclose={() => (picking = null)}
  >
    <KeycodeSelect {caps} onpick={apply} />
  </Overlay>
{/if}
