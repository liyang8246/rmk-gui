<script lang='ts'>
  import type { MorseMode, MorseProfile } from '../rynk'
  import FieldRow from './ui/FieldRow.svelte'
  import Select from './ui/Select.svelte'

  interface Props {
    profile: MorseProfile
    onchange: (patch: Partial<MorseProfile>) => void
  }

  const { profile, onchange }: Props = $props()

  const TRI = [
    { value: 'default', label: 'default' },
    { value: 'on', label: 'on' },
    { value: 'off', label: 'off' },
  ]

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

  function triValue(v: boolean | undefined): string {
    return v === undefined ? 'default' : v ? 'on' : 'off'
  }

  function triSet(v: string): boolean | undefined {
    return v === 'default' ? undefined : v === 'on'
  }

  function timeout(field: typeof TIMEOUTS[number]['field'], raw: string) {
    onchange({ [field]: raw === '' ? undefined : Math.max(0, Math.min(8191, Number(raw) || 0)) })
  }
</script>

<FieldRow label='Decision mode' hint='How a press picks tap or hold.'>
  <Select
    items={MODES}
    value={profile.mode ?? 'default'}
    label='Decision mode'
    onchange={v => onchange({ mode: v === 'default' ? undefined : v as MorseMode })}
  />
</FieldRow>
{#each TIMEOUTS as t (t.field)}
  <FieldRow label={t.label} hint={t.hint}>
    <input
      class={`
        h-8 w-24 rounded-md border border-input bg-background px-2.5 font-mono
        text-[12.5px] text-foreground outline-none
      `}
      type='number'
      min='0'
      max='8191'
      placeholder='default'
      aria-label={t.label}
      value={profile[t.field] ?? ''}
      onchange={e => timeout(t.field, e.currentTarget.value)}
    />
    <span class='text-xs text-muted-foreground'>ms</span>
  </FieldRow>
{/each}
<FieldRow label='Unilateral tap' hint='A same-hand key after this one forces a tap.'>
  <Select
    items={TRI}
    value={triValue(profile.unilateral_tap)}
    label='Unilateral tap'
    onchange={v => onchange({ unilateral_tap: triSet(v) })}
  />
</FieldRow>
<FieldRow label='Flow tap' hint='Fast typing resolves this key as a tap.'>
  <Select
    items={TRI}
    value={triValue(profile.enable_flow_tap)}
    label='Flow tap'
    onchange={v => onchange({ enable_flow_tap: triSet(v) })}
  />
</FieldRow>
