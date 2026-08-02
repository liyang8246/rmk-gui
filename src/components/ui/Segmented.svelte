<script lang='ts' generics='T extends string'>
  import Icon from '@iconify/svelte'

  interface Item {
    value: T
    label: string
    icon?: string
  }

  interface Props {
    items: Item[]
    value: T
    /// Stretch each segment to fill the track, as the USB/BLE switches do.
    fill?: boolean
    height?: number
    disabled?: boolean
    onchange: (value: T) => void
  }

  const { items, value, fill = false, height = 30, disabled = false, onchange }: Props = $props()
</script>

<div
  class={[
    'flex gap-[3px] rounded-md bg-muted p-[3px]',
    disabled && 'opacity-45',
    fill && 'w-full',
  ]}
>
  {#each items as item (item.value)}
    {@const on = item.value === value}
    <button
      class={[
        `
          inline-flex cursor-pointer items-center justify-center gap-1.5
          rounded-sm px-3 font-sans text-[12.5px] font-bold whitespace-nowrap
          transition-colors
          disabled:cursor-not-allowed
        `,
        fill && 'flex-1',
        on ? 'bg-card text-brand-darker shadow-xs' : 'text-muted-foreground',
      ]}
      style:height='{height}px'
      {disabled}
      onclick={() => onchange(item.value)}
    >
      {#if item.icon}
        <Icon icon={item.icon} width={15} height={15} />
      {/if}
      {item.label}
    </button>
  {/each}
</div>
