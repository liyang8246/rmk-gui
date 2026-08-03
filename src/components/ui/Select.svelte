<script lang='ts'>
  import Icon from '@iconify/svelte'
  import { Select } from 'bits-ui'

  interface Item {
    value: string
    label: string
  }

  interface Props {
    items: Item[]
    value: string
    /// Names the closed trigger for a screen reader; the visible value alone
    /// only says what is picked, not what it is.
    label: string
    onchange: (value: string) => void
  }

  const { items, value, label, onchange }: Props = $props()

  const current = $derived(items.find(i => i.value === value)?.label ?? value)
</script>

<Select.Root
  type='single'
  allowDeselect={false}
  bind:value={() => value, v => onchange(v)}
  {items}
>
  <Select.Trigger
    class={`
      inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border
      border-input bg-background px-2 text-[12.5px] text-foreground outline-none
    `}
    aria-label={label}
  >
    {current}
    <Icon class='text-muted-foreground' icon='lucide:chevron-down' width={13} height={13} />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      class={`
        z-90 max-h-(--bits-select-content-available-height)
        min-w-(--bits-select-anchor-width) overflow-y-auto rounded-md border
        border-border bg-popover p-1 shadow-card
      `}
      sideOffset={4}
    >
      <Select.Viewport>
        {#each items as item (item.value)}
          <Select.Item
            class={`
              flex cursor-pointer items-center justify-between gap-2 rounded-sm
              px-2 py-1 text-[12.5px] text-foreground outline-none
              data-highlighted:bg-base-200
            `}
            value={item.value}
            label={item.label}
          >
            {#snippet children({ selected })}
              {item.label}
              {#if selected}
                <Icon icon='lucide:check' width={13} height={13} />
              {/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
