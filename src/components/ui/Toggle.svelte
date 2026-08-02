<script lang='ts'>
  interface Props {
    checked: boolean
    label: string
    disabled?: boolean
    onchange: (checked: boolean) => void
  }

  const { checked, label, disabled = false, onchange }: Props = $props()
</script>

<button
  class={[
    `
      relative h-6.5 w-11 flex-none cursor-pointer rounded-full
      transition-colors
      disabled:cursor-not-allowed disabled:opacity-45
    `,
    checked ? 'bg-brand' : 'bg-muted',
  ]}
  role='switch'
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={() => onchange(!checked)}
>
  <span
    class={[
      'absolute top-[3px] size-5 rounded-full bg-white shadow-xs transition-all',
      checked ? 'left-[21px]' : 'left-[3px]',
    ]}
  ></span>
</button>
