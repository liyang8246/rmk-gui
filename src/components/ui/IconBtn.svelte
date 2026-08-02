<script lang='ts'>
  import Icon from '@iconify/svelte'

  interface Props {
    icon: string
    title: string
    size?: number
    disabled?: boolean
    /// Amber fill for a control that stays on between clicks (auto-advance).
    active?: boolean
    class?: string
    onclick?: () => void
  }

  const {
    icon,
    title,
    size = 38,
    disabled = false,
    active = false,
    class: klass = '',
    onclick,
  }: Props = $props()
</script>

<button
  class={[
    `
      inline-flex flex-none cursor-pointer items-center justify-center
      rounded-md border transition-colors
      disabled:cursor-default disabled:opacity-45
    `,
    active
      ? 'border-brand bg-brand-tint-strong text-brand-darker'
      : `
        border-border bg-card text-foreground
        hover:enabled:bg-base-200
      `,
    klass,
  ]}
  style:width='{size}px'
  style:height='{size}px'
  aria-label={title}
  {title}
  {disabled}
  {onclick}
>
  <Icon {icon} width={Math.round(size * 0.45)} height={Math.round(size * 0.45)} />
</button>
