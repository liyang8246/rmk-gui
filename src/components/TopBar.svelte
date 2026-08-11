<script lang='ts'>
  import type { TransportInfo } from '../rynk'
  import Icon from '@iconify/svelte'
  import { screens, SCREENS } from '../lib/screens.svelte'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, deviceStore, keyboardStore } from '../stores'
  import LogoCard from './LogoCard.svelte'
  import UnlockOverlay from './UnlockOverlay.svelte'

  /// How this app reached the keyboard. Deliberately not the keyboard's own
  /// output transport — that answers a different question and lives on the
  /// Device screen; here, beside the link state, the session is what matters.
  const LINKS: Record<TransportInfo['kind'], { label: string, icon: string, tone: string }> = {
    usb: { label: 'USB', icon: 'lucide:usb', tone: 'text-muted-foreground' },
    ble: { label: 'BLE', icon: 'lucide:bluetooth', tone: 'text-info' },
    hid: { label: 'HID', icon: 'lucide:usb', tone: 'text-muted-foreground' },
    tcp: { label: 'TCP', icon: 'lucide:wifi', tone: 'text-muted-foreground' },
  }

  const connected = $derived(keyboardStore.connection?.phase === 'connected')
  const link = $derived(deviceStore.connectedKind ? LINKS[deviceStore.connectedKind] : null)

  let unlocking = $state(false)

  const lockStatus = $derived(keyboardStore.status?.lockStatus)
  /// A device built without unlock_keys reports no challenge: unlocked ones
  /// are insecure (lock() is a no-op), locked ones are permanently locked.
  const lockable = $derived((lockStatus?.key_positions.length ?? 0) > 0)

  function relock() {
    void keyboardStore.lock().match(
      () => toast.success('Keyboard locked'),
      e => toast.error(describeKeyboardError(e)),
    )
  }
</script>

<div
  class={`
    flex h-14 min-w-0 flex-1 items-center gap-1.5 rounded-[14px] border
    border-base-300 bg-base-100 px-2 shadow-card
  `}
>
  <LogoCard />

  <span class='h-[26px] w-px flex-none bg-base-300'></span>

  <nav class='
    noscroll flex min-w-0 flex-1 justify-center gap-0.5 overflow-x-auto
  '>
    {#each SCREENS as screen (screen.id)}
      {@const on = screens.current === screen.id}
      <button
        class={[
          `
            inline-flex h-[38px] flex-none cursor-pointer items-center gap-1.5
            rounded-[10px] px-[13px] text-[12.5px] whitespace-nowrap
            transition-colors
          `,
          on
            ? 'bg-brand-tint-strong font-bold text-brand-darker'
            : `
              font-semibold text-muted-foreground
              hover:bg-base-200 hover:text-foreground
            `,
        ]}
        type='button'
        title={screen.label}
        onclick={() => screens.go(screen.id)}
      >
        <Icon icon={screen.icon} width={15} height={15} />
        {screen.label}
      </button>
    {/each}
  </nav>

  <span class='h-[26px] w-px flex-none bg-base-300'></span>

  <!-- Edits are written to the keyboard as they are made, so this reports the
       link rather than offering a save. -->
  <div class='flex flex-none items-center gap-2.5 pr-1 pl-2'>
    {#if lockStatus?.locked}
      <button
        class={[
          `
            inline-flex items-center gap-1 text-xs font-semibold
            whitespace-nowrap text-brand-darker
          `,
          lockable
            ? `
              cursor-pointer
              hover:brightness-90
            `
            : 'cursor-default',
        ]}
        type='button'
        title={lockable
          ? 'Security-sensitive commands are locked — click to unlock'
          : 'This firmware has no unlock keys, so the lock is permanent'}
        onclick={() => { if (lockable) unlocking = true }}
      >
        <Icon icon='lucide:lock' width={14} height={14} />
        Locked
      </button>
    {:else if lockable}
      <button
        class={`
          inline-flex cursor-pointer items-center gap-1 text-xs font-semibold
          whitespace-nowrap text-muted-foreground
          hover:text-foreground
        `}
        type='button'
        title='Unlocked — click to lock security-sensitive commands again'
        onclick={relock}
      >
        <Icon icon='lucide:lock-open' width={14} height={14} />
        Unlocked
      </button>
    {/if}
    {#if link}
      <span
        class={[
          `
            inline-flex items-center gap-1 text-xs font-semibold
            whitespace-nowrap
          `,
          link.tone,
        ]}
        title='This app is connected over {link.label}'
      >
        <Icon icon={link.icon} width={14} height={14} />
        {link.label}
      </span>
    {/if}
    <span
      class={[
        'inline-flex items-center gap-1.5 text-xs font-semibold',
        connected ? 'text-ok' : 'text-muted-foreground',
      ]}
    >
      <span
        class={['size-[7px] rounded-full', connected
          ? 'bg-ok-bright'
          : `bg-muted-foreground`]}
      ></span>
      {connected ? 'Connected' : 'Disconnected'}
    </span>
    <button
      class={`
        inline-flex size-8 cursor-pointer items-center justify-center rounded-lg
        text-muted-foreground transition-colors
        hover:bg-base-200 hover:text-foreground
      `}
      type='button'
      title='Disconnect'
      aria-label='Disconnect'
      onclick={() => deviceStore.disconnect()}
    >
      <Icon icon='lucide:plug' width={16} height={16} />
    </button>
  </div>
</div>

{#if unlocking}
  <UnlockOverlay onclose={() => (unlocking = false)} />
{/if}
