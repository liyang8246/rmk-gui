<script lang='ts'>
  interface Props {
    value: number
    min: number
    max: number
    step?: number
    unit?: string
    label: string
    disabled?: boolean
    onchange: (value: number) => void
  }

  const {
    value,
    min,
    max,
    step = 10,
    unit = 'ms',
    label,
    disabled = false,
    onchange,
  }: Props = $props()

  // Tracks the thumb while dragging, then snaps back to whatever the device
  // confirms. Every commit is a write, so it waits for the drag to end.
  let display = $derived(value)
</script>

<input
  class='
    w-50 accent-brand
    disabled:cursor-not-allowed disabled:opacity-45
  '
  type='range'
  aria-label={label}
  {min}
  {max}
  {step}
  {disabled}
  value={display}
  oninput={e => (display = e.currentTarget.valueAsNumber)}
  onchange={e => onchange(e.currentTarget.valueAsNumber)}
/>
<span
  class={[
    `
      min-w-[58px] text-right font-mono text-[13px] font-semibold
      text-foreground
    `,
    disabled && 'opacity-45',
  ]}
>
  {display}{unit}
</span>
