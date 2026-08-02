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

  const HINTS: Record<Method, string> = {
    serial: 'Plug the keyboard in over USB.',
    ble: 'Pair the keyboard with this computer first — the browser can only reach a keyboard the system has already bonded.',
  }

  let method = $state<Method>('serial')

  const native = isTauri()
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

<!-- Two equal halves rather than one centred column: the heading sits at the
     bottom of the top half and the card grows down from the middle, so the
     heading holds still however long the list is. The grid is exactly the
     viewport, so neither row can grow and shove the heading; a long list
     scrolls inside the card instead. -->
<div class='absolute inset-0 z-20 grid-canvas'>
  <div class='
    grid h-full grid-rows-[minmax(0,1fr)_minmax(0,1fr)] justify-items-center
    gap-6 px-6 py-8
  '>
    <div class='w-[460px] max-w-full self-end text-center'>
      <img class='mx-auto mb-4 h-11 w-auto' src={logo} alt='RMK' />
      <h1 class='text-[26px] font-extrabold tracking-tight text-foreground'>
        Connect your keyboard
      </h1>
      <p class='mt-1.5 text-[13.5px] text-muted-foreground'>
        Plug in over USB, or reach a paired keyboard over Bluetooth.
      </p>
    </div>

    <Card class='flex max-h-full w-[460px] max-w-full flex-col self-start'>
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
           for a spinner collapses the card and reads as the window blinking. The
           floor holds that empty state open, so a listed keyboard is not made to
           sit above a block of reserved space. -->
      <div
        class={[
          'flex min-h-0 flex-col gap-2 overflow-y-auto',
          found.length === 0 && 'min-h-[120px]',
        ]}
      >
        {#each found as device (device.id)}
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
                flex size-10 flex-none items-center justify-center rounded-md
                bg-muted text-muted-foreground
              `}
            >
              <Icon icon='lucide:keyboard' width={20} height={20} />
            </span>
            <span class='flex-1'>
              <span class='block text-[13.5px] font-semibold text-foreground'>
                {device.label}
              </span>
              <span class='block text-xs text-muted-foreground'>
                {label(device.kind)}
              </span>
            </span>
            {#if deviceStore.connecting === device.id}
              <Pill tone='blue'>connecting…</Pill>
            {:else}
              <Pill tone='ok' dot>ready</Pill>
            {/if}
          </button>
        {/each}

        {#if deviceStore.scanning && found.length === 0}
          <p
            class={`
              flex items-center justify-center gap-2.5 px-2 py-3 text-center
              text-[13px] text-muted-foreground
            `}
          >
            <span
              class={`
                inline-block size-[15px] flex-none animate-spin rounded-full
                border-2 border-muted border-t-brand
              `}
            ></span>
            Looking for {label(method)} keyboards…
          </p>
        {:else if found.length === 0}
          <p class='px-2 py-3 text-center text-[13px] text-muted-foreground'>
            No {label(method)} keyboards yet. {HINTS[method]}
          </p>
        {/if}
      </div>

      {#if canPick}
        <button
          class={`
            mt-2 flex w-full flex-none cursor-pointer items-center
            justify-center gap-2 rounded-md bg-brand px-4 py-3 text-[13.5px]
            font-bold text-[#1a1205] transition-[filter]
            hover:brightness-95
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
        <p class='mt-2 py-1.5 text-center text-xs text-muted-foreground'>
          This browser has no {label(method)} support.
        </p>
      {/if}

      {#if deviceStore.error}
        <p class='mt-3 flex-none text-center text-[12.5px] text-destructive'>
          {deviceStore.error}
        </p>
      {/if}
    </Card>
  </div>
</div>
