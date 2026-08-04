<script lang='ts'>
  import type { TransportInfo } from '../rynk'
  import Icon from '@iconify/svelte'
  import { isTauri } from '@tauri-apps/api/core'
  import { DropdownMenu } from 'bits-ui'
  import logo from '../assets/img/logo.svg'
  import { batteryCells, formFactor } from '../lib/device'
  import { deviceStore, keyboardStore } from '../stores'

  let open = $state(false)

  const device = $derived(keyboardStore.device)
  const name = $derived(keyboardStore.connection?.label ?? 'Keyboard')
  const form = $derived(formFactor(device))
  const cells = $derived(batteryCells(keyboardStore.status))

  function switchTo(candidate: TransportInfo, alreadyOn: boolean) {
    if (!alreadyOn) void deviceStore.connect(candidate)
  }
</script>

<div class='flex h-full flex-none items-center gap-2.5'>
  <DropdownMenu.Root
    bind:open
    onOpenChange={(o) => {
      // Cheap on both platforms, and it picks up a name learned since the last one.
      if (o) void deviceStore.scan()
    }}
  >
    <DropdownMenu.Trigger
      class={`
        flex h-10 cursor-pointer items-center gap-2.5 rounded-[10px] px-1
        transition-colors
        hover:bg-base-200
      `}
      title='Switch keyboard'
    >
      <img class='h-[22px] w-auto shrink-0' src={logo} alt='RMK' />
      <span class='text-left leading-[1.12]'>
        <span class='block text-[13px] font-bold text-foreground'>{name}</span>
        <span class='block text-[10.5px] text-muted-foreground'>{form}</span>
      </span>
      <Icon
        class='text-muted-foreground transition-transform'
        style={open ? 'transform: rotate(180deg)' : ''}
        icon='lucide:chevron-down'
        width={14}
        height={14}
      />
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        class={`
          z-70 flex w-[268px] flex-col gap-0.5 rounded-lg border border-border
          bg-popover p-1.5 shadow-lg
        `}
        align='start'
        sideOffset={6}
      >
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading
            class={`
              px-2 pt-1.5 pb-1 text-[10.5px] font-bold tracking-[0.06em]
              text-muted-foreground uppercase
            `}
          >
            Keyboards
          </DropdownMenu.GroupHeading>

          {#each deviceStore.devices as candidate (candidate.id)}
            {@const on = candidate.id === deviceStore.connectedId}
            <DropdownMenu.Item
              class={[
                `
                  flex cursor-pointer items-center gap-2.5 rounded-md p-2
                  text-left transition-colors outline-none
                `,
                on ? 'bg-brand-tint' : 'data-highlighted:bg-base-200',
              ]}
              onSelect={() => switchTo(candidate, on)}
            >
              <span
                class={`
                  flex size-8 flex-none items-center justify-center rounded-md
                  bg-muted text-muted-foreground
                `}
              >
                <Icon icon='lucide:keyboard' width={16} height={16} />
              </span>
              <span class='flex-1 leading-[1.15]'>
                <span
                  class={[
                    'block text-[13px] font-bold',
                    on ? 'text-brand-darker' : 'text-foreground',
                  ]}
                >{candidate.label}</span>
                <span class='block text-[11px] text-muted-foreground'>{candidate.kind}</span>
              </span>
              {#if on}
                <Icon class='text-brand-dark' icon='lucide:check' width={16} height={16} />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>

        {#if isTauri()}
          <DropdownMenu.Item
            class={`
              cursor-pointer rounded-md px-2 py-1.5 text-left text-[12px]
              font-semibold text-muted-foreground outline-none
              data-highlighted:bg-base-200
            `}
            closeOnSelect={false}
            onSelect={() => void deviceStore.scan()}
          >
            {deviceStore.scanning ? 'Scanning…' : 'Rescan'}
          </DropdownMenu.Item>
        {:else}
          {#each deviceStore.browserTransports as kind (kind)}
            <DropdownMenu.Item
              class={`
                cursor-pointer rounded-md px-2 py-1.5 text-left text-[12px]
                font-semibold text-muted-foreground outline-none
                data-highlighted:bg-base-200
              `}
              onSelect={() => void deviceStore.pick(kind)}
            >
              {kind === 'hid' ? 'Choose a Bluetooth keyboard…' : 'Choose a USB keyboard…'}
            </DropdownMenu.Item>
          {/each}
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>

  {#each cells as cell, i (cell.label || i)}
    <span
      class={[
        `
          inline-flex items-center gap-[3px] text-xs font-semibold
          whitespace-nowrap
        `,
        (cell.level ?? 0) > 20 ? 'text-ok' : 'text-destructive',
      ]}
      title={cell.charging ? 'Charging' : 'On battery'}
    >
      <Icon
        icon={cell.charging ? 'lucide:battery-charging' : 'lucide:battery'}
        width={14}
        height={14}
      />
      {#if cell.label}
        <span class='text-[9.5px] font-bold opacity-70'>{cell.label}</span>
      {/if}
      {cell.level}%
    </span>
  {/each}
</div>
