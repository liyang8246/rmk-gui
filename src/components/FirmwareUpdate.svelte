<script lang='ts'>
  import type { DfuMode, DfuTarget } from '../lib/dfu'
  import Icon from '@iconify/svelte'
  import { isTauri } from '@tauri-apps/api/core'
  import { onMount } from 'svelte'
  import { detach, DetachRefused, DfuError, download } from '../lib/dfu'
  import { toast } from '../lib/toast.svelte'
  import { discoverDfu, TauriDfu } from '../rynk/dfu-tauri'
  import { dfuModeOf, grantedDfuDevices, requestDfuDevice, WebUsbDfu } from '../rynk/dfu-web'
  import { canUseWebUsb, usbLabel } from '../rynk/web'
  import Button from './ui/Button.svelte'
  import Overlay from './ui/Overlay.svelte'
  import Unsupported from './ui/Unsupported.svelte'

  interface Props {
    onclose: () => void
  }

  const { onclose }: Props = $props()

  /// A DFU-capable device the app can open: native builds enumerate them, the
  /// browser lists what this origin was granted. `runtime` is an application
  /// that can reboot into its bootloader; `dfu` is a bootloader.
  interface Candidate {
    id: string
    label: string
    mode: DfuMode
    open: () => Promise<DfuTarget>
  }

  type Phase
    = | { kind: 'pick' }
      | { kind: 'flashing', label: string, sent: number, total: number }
      | { kind: 'done', label: string, total: number }
      | { kind: 'failed', label: string, message: string }

  const native = isTauri()
  const supported = native || canUseWebUsb()

  let fileInput = $state<HTMLInputElement | null>(null)
  let file = $state<{ name: string, bytes: Uint8Array } | null>(null)
  let candidates = $state.raw<Candidate[]>([])
  let phase = $state<Phase>({ kind: 'pick' })

  const busy = $derived(phase.kind === 'flashing')
  const applications = $derived(candidates.filter(c => c.mode === 'runtime'))
  const bootloaders = $derived(candidates.filter(c => c.mode === 'dfu'))

  function webCandidate(device: USBDevice): Candidate | null {
    const mode = dfuModeOf(device)
    if (!mode) return null
    return {
      id: `${device.vendorId}:${device.productId}:${device.serialNumber ?? ''}`,
      label: usbLabel(device),
      mode,
      open: () => WebUsbDfu.open(device),
    }
  }

  async function refresh() {
    candidates = native
      ? (await discoverDfu().catch(() => [])).map(d => ({
        id: d.id,
        label: d.name,
        mode: d.mode,
        open: () => TauriDfu.open(d.id),
      }))
      : (await grantedDfuDevices()).flatMap(d => webCandidate(d) ?? [])
  }

  onMount(() => {
    if (!supported) return
    void refresh()
    // A bootloader that enumerates after a reboot joins the list on its own:
    // native by polling, the browser by its own device events.
    if (native) {
      const timer = setInterval(refresh, 1500)
      return () => clearInterval(timer)
    }
    navigator.usb.addEventListener('connect', refresh)
    navigator.usb.addEventListener('disconnect', refresh)
    return () => {
      navigator.usb.removeEventListener('connect', refresh)
      navigator.usb.removeEventListener('disconnect', refresh)
    }
  })

  async function readFile(picked: File) {
    file = { name: picked.name, bytes: new Uint8Array(await picked.arrayBuffer()) }
    phase = { kind: 'pick' }
  }

  /// Browser only: the picker needs the click, and it only grants access —
  /// the device is opened when it is used. What was picked decides the step.
  async function choose() {
    try {
      const candidate = webCandidate(await requestDfuDevice())
      if (!candidate) return
      if (candidate.mode === 'runtime') await reboot(candidate)
      else await flash(candidate)
    }
    catch (e) {
      // NotFoundError is the user dismissing the picker, not a failure.
      if (!(e instanceof DOMException && e.name === 'NotFoundError')) {
        toast.error(e instanceof Error ? e.message : String(e))
      }
    }
  }

  /// DFU_DETACH on the application's runtime interface. Goes straight to the
  /// device, so it works with no Rynk session — and reboots the device the
  /// cable is plugged into, not a keyboard behind a dongle.
  async function reboot(candidate: Candidate) {
    let target: DfuTarget | null = null
    try {
      target = await candidate.open()
      await detach(target)
      toast.info(`${candidate.label} is rebooting into its bootloader…`)
    }
    catch (e) {
      if (e instanceof DetachRefused) {
        toast.error(
          `${candidate.label} did not reboot`,
          'A dongle only accepts this within 30 seconds of being plugged in: unplug it, plug it back in, and try again.',
        )
      }
      else {
        toast.error(e instanceof Error ? e.message : String(e))
      }
    }
    finally {
      await target?.close()
      void refresh()
    }
  }

  async function flash(candidate: Candidate) {
    const image = file
    if (!image) return
    const { label } = candidate
    phase = { kind: 'flashing', label, sent: 0, total: image.bytes.length }
    let target: DfuTarget | null = null
    try {
      target = await candidate.open()
      await download(target, image.bytes, (sent, total) => {
        phase = { kind: 'flashing', label, sent, total }
      })
      phase = { kind: 'done', label, total: image.bytes.length }
    }
    catch (e) {
      // A device-reported failure leaves it in DFU: retrying is the next step.
      const message = e instanceof DfuError
        ? e.message
        : `${e instanceof Error ? e.message : String(e)} — unplug the device and plug it back in, then try again.`
      phase = { kind: 'failed', label, message }
    }
    finally {
      await target?.close()
      void refresh()
    }
  }

  function kb(n: number): string {
    return `${(n / 1024).toFixed(1)} KB`
  }
</script>

<Overlay
  title='Update firmware'
  subtitle='Flash a firmware image over USB'
  onclose={() => { if (!busy) onclose() }}
  slim
>
  <div class='flex flex-1 flex-col gap-4'>
    {#if !supported}
      <Unsupported>
        Flashing needs a browser with WebUSB, such as Chrome or Edge. From a
        terminal, <b>dfu-util -D firmware.bin</b> does the same.
      </Unsupported>
    {:else}
      <div class='flex items-center gap-3'>
        <div class='flex-1'>
          <div class='text-[13.5px] font-semibold text-foreground'>1. Firmware image</div>
          <div class='text-xs text-muted-foreground'>
            {file ? `${file.name} · ${kb(file.bytes.length)}` : 'The .bin built for this device.'}
          </div>
        </div>
        <input
          class='hidden'
          type='file'
          accept='.bin,application/octet-stream'
          bind:this={fileInput}
          onchange={(e) => {
            const picked = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (picked) void readFile(picked)
          }}
        />
        <Button disabled={busy} onclick={() => fileInput?.click()}>
          <Icon icon='lucide:folder-open' width={15} height={15} />
          {file ? 'Change' : 'Choose'}
        </Button>
      </div>

      <div class='flex flex-col gap-2 border-t border-border pt-4'>
        <div class='text-[13.5px] font-semibold text-foreground'>2. Enter the bootloader</div>
        {#each applications as app (app.id)}
          <div class='
            flex items-center gap-3 rounded-md border border-border px-3 py-2
          '>
            <Icon icon='lucide:usb' width={16} height={16} />
            <span class='flex-1 text-[13px] font-semibold text-foreground'>{app.label}</span>
            <Button size='sm' disabled={busy} onclick={() => reboot(app)}>Reboot</Button>
          </div>
        {/each}
        {#if !applications.length}
          <p class='text-xs text-muted-foreground'>
            {native
              ? 'No running device with a DFU interface is plugged in. Skip this step for one already in bootloader mode.'
              : 'Choose the device below while it is running, and it reboots into its bootloader. Skip this step for one already there.'}
          </p>
        {/if}
      </div>

      <div class='flex flex-col gap-2 border-t border-border pt-4'>
        <div class='text-[13.5px] font-semibold text-foreground'>3. Flash the bootloader device</div>
        {#each bootloaders as bootloader (bootloader.id)}
          <div class='
            flex items-center gap-3 rounded-md border border-border px-3 py-2
          '>
            <Icon icon='lucide:usb' width={16} height={16} />
            <span class='flex-1 text-[13px] font-semibold text-foreground'>{bootloader.label}</span>
            <Button size='sm' variant='brand' disabled={busy || !file} onclick={() => flash(bootloader)}>
              Flash
            </Button>
          </div>
        {/each}
        {#if native}
          {#if !bootloaders.length}
            <p class='text-xs text-muted-foreground'>
              No device in bootloader mode yet. It appears here as soon as one is
              plugged in.
            </p>
          {/if}
        {:else}
          <Button disabled={busy} onclick={choose}>
            <Icon icon='lucide:usb' width={15} height={15} />
            {candidates.length ? 'Choose another device…' : 'Choose the device…'}
          </Button>
          {#if !bootloaders.length}
            <p class='text-xs text-muted-foreground'>
              A bootloader shows up as “RMK … Bootloader” in the browser's picker.
            </p>
          {/if}
        {/if}
      </div>

      {#if phase.kind !== 'pick'}
        <div class='flex flex-col gap-2 border-t border-border pt-4'>
          {#if phase.kind === 'flashing'}
            <div class='text-[13px] text-foreground'>
              Flashing {phase.label}… {kb(phase.sent)} of {kb(phase.total)}
            </div>
            <div class='h-2.5 overflow-hidden rounded-full bg-muted'>
              <div
                class='h-full rounded-full bg-brand transition-[width]'
                style:width='{phase.total ? (100 * phase.sent) / phase.total : 0}%'
              ></div>
            </div>
            <p class='text-xs text-muted-foreground'>
              Keep the device plugged in. An interrupted update is not fatal:
              the bootloader stays in DFU mode until an image is installed.
            </p>
          {:else if phase.kind === 'done'}
            <div class='flex items-center gap-2 text-[13px] text-ok'>
              <Icon icon='lucide:circle-check' width={16} height={16} />
              Installed {kb(phase.total)} on {phase.label}. It restarted into the new firmware.
            </div>
          {:else}
            <div class='flex items-start gap-2 text-[13px] text-destructive'>
              <Icon icon='lucide:circle-alert' width={16} height={16} />
              <span>{phase.label}: {phase.message}</span>
            </div>
          {/if}
        </div>
      {/if}
    {/if}

    <div class='mt-auto flex justify-end gap-2'>
      <Button disabled={busy} onclick={onclose}>
        {phase.kind === 'done' ? 'Done' : 'Close'}
      </Button>
    </div>
  </div>
</Overlay>
