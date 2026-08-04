<script lang='ts'>
  import type { TransportInfo } from '../rynk'
  import Icon from '@iconify/svelte'
  import { isTauri } from '@tauri-apps/api/core'
  import logo from '../assets/img/logo.svg'
  import Card from '../components/ui/Card.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import Pill from '../components/ui/Pill.svelte'
  import Segmented from '../components/ui/Segmented.svelte'
  import { deviceStore, keyboardStore } from '../stores'

  type Method = 'serial' | 'ble'

  const METHODS = [
    { value: 'serial', label: 'USB', icon: 'lucide:usb' },
    { value: 'ble', label: 'Bluetooth', icon: 'lucide:bluetooth' },
  ] as const satisfies readonly { value: Method, label: string, icon: string }[]

  /// Each tab covers the transports that reach a keyboard that way. The
  /// debug-only TCP transport rides with USB rather than becoming unreachable,
  /// and WebHID is how the browser reaches an already-bonded Bluetooth board.
  const KINDS: Record<Method, TransportInfo['kind'][]> = {
    serial: ['serial', 'tcp'],
    ble: ['ble', 'hid'],
  }

  const KIND_LABELS: Record<TransportInfo['kind'], string> = {
    serial: 'USB',
    ble: 'Bluetooth',
    tcp: 'Network',
    hid: 'Bluetooth',
  }

  /// In the browser only a picker can open a device, and it must run inside the
  /// click. `hid` is the Bluetooth path: Web Bluetooth would demand its own
  /// pairing and cannot see the bond the OS already holds.
  const PICKS: Record<Method, 'serial' | 'hid'> = { serial: 'serial', ble: 'hid' }

  let method = $state<Method>('serial')

  const native = isTauri()

  /// What to try when a tab is empty. Native scans the radio itself, so its
  /// hint is about the keyboard; the browser build must explain the OS bond
  /// it rides on instead.
  const HINTS: Record<Method, string> = {
    serial: 'Plug the keyboard in over USB.',
    ble: native
      ? 'Turn the keyboard on and bring it in range.'
      : 'Pair the keyboard with this computer first — the browser can only reach a keyboard the system has already bonded.',
  }
  const available = $derived(deviceStore.browserTransports)
  const canPick = $derived(!native && available.includes(PICKS[method]))
  const found = $derived(deviceStore.devices.filter(d => KINDS[method].includes(d.kind)))
  const connecting = $derived(keyboardStore.connection?.phase === 'connecting')
  const busy = $derived(connecting || deviceStore.connecting !== null)

  function label(kind: TransportInfo['kind']): string {
    return KIND_LABELS[kind]
  }

  function selectMethod(next: Method) {
    method = next
    void deviceStore.scan()
  }
</script>

<!-- One centred column: heading and card travel together, so the pair sits in
     the middle of the viewport instead of hanging off its lower half. The
     device list carries its own cap and scrollbar, so a long list cannot walk
     the heading off screen; and when the viewport itself is too short for the
     column — a phone with its keyboard up, a landscape phone — the outer layer
     scrolls rather than clipping what fell outside. -->
<div class='absolute inset-0 z-20 overflow-y-auto grid-canvas'>
  <div class='
    flex min-h-full flex-col items-center justify-center gap-6 px-4 py-8
    sm:px-6
  '>
    <div class='w-[460px] max-w-full flex-none text-center'>
      <img class='mx-auto mb-4 h-11 w-auto' src={logo} alt='RMK' />
      <h1 class='text-[26px] font-extrabold tracking-tight text-foreground'>
        Connect your keyboard
      </h1>
      <p class='mt-1.5 text-[13.5px] text-muted-foreground'>
        Plug in over USB, or reach a paired keyboard over Bluetooth.
      </p>
    </div>

    <Card class='flex w-[460px] max-w-full flex-none flex-col'>
      <div class='mb-4 flex flex-none items-center gap-2'>
        <Segmented
          items={METHODS.map(m => ({ value: m.value, label: m.label, icon: m.icon }))}
          value={method}
          fill
          height={38}
          onchange={selectMethod}
        />
        <!-- Beside the tabs rather than on its own row: it refreshes the list
             rather than being a step in the flow, and a full-width line of text
             read as neither a button nor a label. -->
        <IconBtn
          icon='lucide:refresh-cw'
          title='Look again'
          size={38}
          disabled={deviceStore.scanning || busy}
          onclick={() => deviceStore.scan()}
        />
      </div>

      <!-- The list stays mounted while a scan runs: swapping the whole body out
           for a spinner collapses the card and reads as the window blinking.

           Both tabs' lists render stacked in the same grid cell, the inactive
           one invisible: the cell holds the taller list's height, so switching
           tabs cannot change the card's height and shove the centred column
           around the screen. The floor is exactly one device row and empty
           states centre in whatever height the other tab set, so a lone listed
           keyboard never sits above a block of reserved space. -->
      <div class='grid min-h-[66px]'>
        {#each METHODS as m (m.value)}
          {@const list = deviceStore.devices.filter(d => KINDS[m.value].includes(d.kind))}
          <div
            class={[
              `
                col-start-1 row-start-1 flex max-h-[300px] flex-col gap-2
                overflow-y-auto
              `,
              method !== m.value && 'invisible',
            ]}
          >
            {#each list as device (device.id)}
              <button
                class={`
                  flex flex-none cursor-pointer items-center gap-3.5 rounded-md
                  border border-border bg-card px-3.5 py-3 text-left
                  transition-colors
                  hover:border-brand hover:bg-brand/6
                  disabled:cursor-wait disabled:opacity-60
                `}
                type='button'
                disabled={busy}
                onclick={() => deviceStore.connect(device)}
              >
                <span
                  class={`
                    flex size-10 flex-none items-center justify-center
                    rounded-md bg-muted text-muted-foreground
                  `}
                >
                  <Icon icon='lucide:keyboard' width={20} height={20} />
                </span>
                <span class='flex-1'>
                  <span
                    class='block text-[13.5px] font-semibold text-foreground'
                  >
                    {device.label}
                  </span>
                  <span class='block text-xs text-muted-foreground'>
                    {label(device.kind)}
                  </span>
                </span>
                {#if deviceStore.connecting === device.id}
                  <Pill tone='blue'>connecting…</Pill>
                {:else if deviceStore.hasFailed(device.id)}
                  <Pill tone='bad' dot>failed</Pill>
                {:else}
                  <Pill tone='ok' dot>ready</Pill>
                {/if}
              </button>
            {/each}

            {#if deviceStore.scanning && list.length === 0}
              <p
                class={`
                  flex flex-1 items-center justify-center gap-2.5 px-2 py-3
                  text-center text-[13px] text-muted-foreground
                `}
              >
                <span
                  class={`
                    inline-block size-[15px] flex-none animate-spin rounded-full
                    border-2 border-muted border-t-brand
                  `}
                ></span>
                Looking for {m.label} keyboards…
              </p>
            {:else if list.length === 0}
              <p
                class={`
                  flex flex-1 items-center justify-center px-2 py-3 text-center
                  text-[13px] text-muted-foreground
                `}
              >
                <span>No {m.label} keyboards yet. {HINTS[m.value]}</span>
              </p>
            {/if}
          </div>
        {/each}
      </div>

      {#if canPick}
        <button
          class={`
            mt-2 flex w-full flex-none cursor-pointer items-center
            justify-center gap-2 rounded-md bg-brand-fill px-4 py-3
            text-[13.5px] font-bold text-brand-fill-fg transition-[filter]
            hover:enabled:brightness-95
            disabled:cursor-wait disabled:opacity-60
          `}
          type='button'
          disabled={busy}
          onclick={() => deviceStore.pick(PICKS[method])}
        >
          <Icon
            icon={method === 'ble' ? 'lucide:bluetooth' : 'lucide:usb'}
            width={16}
            height={16}
          />
          {connecting
            ? 'Connecting…'
            : found.length
            ? 'Choose another keyboard…'
            : 'Choose a keyboard…'}
        </button>
      {:else if !native}
        <!-- Holds the pick button's height, so a browser that supports only
             one of the two APIs still shows both tabs at one card height. -->
        <p
          class={`
            mt-2 flex min-h-[44px] items-center justify-center text-center
            text-xs text-muted-foreground
          `}
        >
          This browser has no {label(method)} support.
        </p>
      {/if}
    </Card>
  </div>
</div>
