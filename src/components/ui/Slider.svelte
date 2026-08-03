<script lang='ts'>
  import { Slider } from 'bits-ui'

  interface Props {
    value: number
    min: number
    max: number
    step?: number
    label: string
    disabled?: boolean
    onchange: (value: number) => void
  }

  const {
    value,
    min,
    max,
    step = 10,
    label,
    disabled = false,
    onchange,
  }: Props = $props()

  // Tracks the thumb while dragging, then snaps back to whatever the device
  // confirms. Every commit is a write, so it waits for the drag to end.
  let display = $derived(value)
</script>

<Slider.Root
  class={`
    relative flex h-4 w-50 touch-none items-center select-none
    data-disabled:opacity-45
  `}
  type='single'
  bind:value={() => display, v => (display = v)}
  onValueCommit={onchange}
  {min}
  {max}
  {step}
  {disabled}
>
  <span class='relative h-1 w-full grow overflow-hidden rounded-full bg-muted'>
    <Slider.Range class='absolute h-full bg-brand' />
  </span>
  <Slider.Thumb
    class={`
      block size-4 cursor-pointer rounded-full border border-border bg-white
      shadow-xs outline-none
      focus-visible:ring-2 focus-visible:ring-brand/40
      data-disabled:cursor-not-allowed
    `}
    index={0}
    aria-label={label}
  />
</Slider.Root>
<span
  class={[
    `
      min-w-[58px] text-right font-mono text-[13px] font-semibold
      text-foreground
    `,
    disabled && 'opacity-45',
  ]}
>
  {display}ms
</span>
