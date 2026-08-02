<script lang='ts'>
  import Icon from '@iconify/svelte'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import Pill from '../components/ui/Pill.svelte'
  import Row from '../components/ui/Row.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Segmented from '../components/ui/Segmented.svelte'
  import Unsupported from '../components/ui/Unsupported.svelte'
  import { activeOutput, batteryCells, firmwareVersion, formFactor, outputLabel } from '../lib/device'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  const device = $derived(keyboardStore.device)
  const status = $derived(keyboardStore.status)
  const caps = $derived(device?.capabilities)
  const cells = $derived(batteryCells(status))
  const output = $derived(outputLabel(activeOutput(status)))
  const connected = $derived(keyboardStore.connection?.phase === 'connected')
  const profiles = $derived(caps?.ble_enabled ? (caps.num_ble_profiles ?? 0) : 0)
  const activeProfile = $derived(status?.bleStatus?.profile ?? -1)

  function bootloader() {
    void keyboardStore.bootloaderJump().match(
      () => toast.show('Rebooting into bootloader…'),
      e => toast.show(describeKeyboardError(e)),
    )
  }

  function switchProfile(slot: number) {
    void keyboardStore.switchBleProfile(slot).match(
      () => toast.show(`Switched to profile ${slot}`),
      e => toast.show(describeKeyboardError(e)),
    )
  }

  function clearProfile(slot: number) {
    void keyboardStore.clearBleProfile(slot).match(
      () => toast.show(`Cleared profile ${slot}`),
      e => toast.show(describeKeyboardError(e)),
    )
  }
</script>

<ScreenScroll
  title='Device'
  desc='Connection, battery, firmware, and Bluetooth profiles for this keyboard.'
>
  <div class='mb-4 grid grid-cols-2 gap-4'>
    <Card>
      <div class='flex items-center gap-3.5'>
        <span
          class={`
            flex h-12 w-[66px] flex-none items-center justify-center rounded-lg
            bg-muted text-muted-foreground
          `}
        >
          <Icon icon='lucide:keyboard' width={26} height={26} />
        </span>
        <div class='flex-1'>
          <div class='text-[15px] font-semibold text-foreground'>
            {keyboardStore.connection?.label}
          </div>
          <div class='text-xs text-muted-foreground'>
            {formFactor(device)}{device?.info.manufacturer ? ` · ${device.info.manufacturer}` : ''}
          </div>
        </div>
        {#if connected}
          <Pill tone='ok' dot>Connected</Pill>
        {:else}
          <Pill tone='muted' dot>Offline</Pill>
        {/if}
      </div>

      <div class='mt-3.5'>
        <!-- Output routing is decided on the keyboard: the protocol reports the
             active transport but has no command to change it. -->
        <Segmented
          items={[
            { value: 'USB', label: 'USB', icon: 'lucide:usb' },
            { value: 'BLE', label: 'Bluetooth', icon: 'lucide:bluetooth' },
          ]}
          value={output}
          fill
          height={36}
          disabled
          onchange={() => {}}
        />
        <p class='mt-2'>
          <Unsupported>
            Switch output from the keyboard itself — bind the
            <b>OutputUsb</b> / <b>OutputBluetooth</b> keycodes.
          </Unsupported>
        </p>
      </div>
    </Card>

    <Card>
      <div class='flex items-baseline gap-2'>
        <div class='text-[13.5px] font-semibold text-foreground'>Battery</div>
        <div class='ml-auto text-xs text-muted-foreground'>current</div>
      </div>
      {#if cells.length}
        <div class='my-2.5 flex flex-col gap-2'>
          {#each cells as cell, i (cell.label || i)}
            <div class='flex items-center gap-3'>
              {#if cell.label}
                <span class='w-3.5 text-xs font-bold text-muted-foreground'>
                  {cell.label}
                </span>
              {/if}
              <div class='h-2.5 flex-1 overflow-hidden rounded-full bg-muted'>
                <div
                  class={[
                    'h-full rounded-full',
                    (cell.level ?? 0) > 20 ? 'bg-brand' : 'bg-destructive',
                  ]}
                  style:width='{cell.level}%'
                ></div>
              </div>
              <span
                class={`
                  min-w-10 text-right text-[15px] font-extrabold text-foreground
                `}
              >{cell.level}%</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class='my-2.5 text-[13px] text-muted-foreground'>
          This keyboard reports no battery.
        </p>
      {/if}
      <Unsupported>
        The keyboard stores no charge history, so there is no trend to plot.
      </Unsupported>
    </Card>
  </div>

  <Card class='mb-4'>
    <div class='flex items-center gap-4'>
      <div
        class={`
          inline-flex size-12 flex-none items-center justify-center rounded-xl
          bg-brand-tint-strong text-brand-darker
        `}
      >
        <Icon icon='lucide:cpu' width={24} height={24} />
      </div>
      <div class='flex-1'>
        <div class='text-[15px] font-semibold text-foreground'>RMK firmware</div>
        <div class='text-xs text-muted-foreground'>
          Installed {firmwareVersion(device)} · Rynk protocol
          {device?.version.major}.{device?.version.minor}
        </div>
      </div>
      <!-- There is no firmware-transfer endpoint in the protocol. -->
      <Button disabled title='The protocol has no firmware-transfer endpoint'>
        Check for updates
      </Button>
    </div>

    <div class='mt-3.5 flex items-center gap-3.5 border-t border-border pt-3.5'>
      <div>
        <div class='text-[13.5px] font-semibold text-foreground'>Bootloader mode</div>
        <div class='text-xs text-muted-foreground'>
          Enter DFU to recover or flash a custom build. This ends the session.
        </div>
      </div>
      <Button class='ml-auto' onclick={bootloader}>Enter bootloader</Button>
    </div>
  </Card>

  <Card flush>
    <div class='px-4 pt-4 pb-1 text-[13.5px] font-semibold text-foreground'>
      Bluetooth profiles
    </div>
    <p class='px-4 pb-2.5 text-xs text-muted-foreground'>
      {profiles > 0
        ? `Pair up to ${profiles} hosts and switch between them.`
        : 'This firmware was built without Bluetooth.'}
    </p>

    {#each { length: profiles } as _, slot (slot)}
      {@const active = slot === activeProfile}
      <Row class='border-t border-border'>
        <span
          class={[
            `
              inline-flex size-[30px] flex-none items-center justify-center
              rounded-lg text-xs font-extrabold
            `,
            active
              ? 'bg-brand text-[#1a1205]'
              : `bg-muted text-muted-foreground`,
          ]}
        >{slot}</span>
        <span class='text-[13.5px] font-semibold text-foreground'>
          Profile {slot}
        </span>
        {#if active}
          <Pill tone='ok'>{status?.bleStatus?.state.toLowerCase() ?? 'active'}</Pill>
        {/if}
        <div class='ml-auto flex gap-2'>
          {#if !active}
            <Button size='sm' onclick={() => switchProfile(slot)}>Switch</Button>
          {/if}
          <Button
            size='sm'
            disabled
            title='Pairing is driven by the keyboard, not by the host'
          >
            Pair
          </Button>
          <Button size='sm' onclick={() => clearProfile(slot)}>
            <Icon icon='lucide:trash-2' width={14} height={14} />
            Clear
          </Button>
        </div>
      </Row>
    {/each}

    {#if profiles > 0}
      <Row class='border-t border-border'>
        <Unsupported>
          The keyboard stores a bond per slot, not the host's name, so slots are
          shown by number. Clearing a bond is unlock-gated by the firmware.
        </Unsupported>
      </Row>
    {/if}
  </Card>
</ScreenScroll>
