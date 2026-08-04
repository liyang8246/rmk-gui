<script lang='ts' generics='T extends string'>
  import Icon from '@iconify/svelte'
  import { RadioGroup } from 'bits-ui'

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

<!-- A radio group rather than a row of buttons: exactly one segment is on,
     and the arrow keys walk the track. The binding stays a function pair so
     the pressed segment is whatever `value` confirms, not the last click. -->
<RadioGroup.Root
  class={[
    'flex gap-[3px] rounded-md bg-muted p-[3px]',
    disabled && 'opacity-45',
    fill && 'w-full',
  ]}
  orientation='horizontal'
  bind:value={() => value, v => onchange(v as T)}
  {disabled}
>
  {#each items as item (item.value)}
    {@const on = item.value === value}
    <RadioGroup.Item
      class={[
        `
          inline-flex cursor-pointer items-center justify-center gap-1.5
          rounded-sm px-3 font-sans text-[12.5px] font-bold whitespace-nowrap
          transition-colors
          disabled:cursor-not-allowed
        `,
        fill && 'flex-1',
        on
          ? `
            bg-card text-brand-darker shadow-xs
            dark:text-brand-fill
          `
          : `text-muted-foreground`,
      ]}
      style='height: {height}px'
      value={item.value}
    >
      {#if item.icon}
        <Icon icon={item.icon} width={15} height={15} />
      {/if}
      {item.label}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
