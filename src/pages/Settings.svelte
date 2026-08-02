<script lang='ts'>
  import Icon from '@iconify/svelte'
  import { isTauri } from '@tauri-apps/api/core'
  import logo from '../assets/img/logo.svg'
  import Button from '../components/ui/Button.svelte'
  import Card from '../components/ui/Card.svelte'
  import Pill from '../components/ui/Pill.svelte'
  import Row from '../components/ui/Row.svelte'
  import ScreenScroll from '../components/ui/ScreenScroll.svelte'
  import Segmented from '../components/ui/Segmented.svelte'
  import Unsupported from '../components/ui/Unsupported.svelte'
  import { theme } from '../lib/theme.svelte'
  import { toast } from '../lib/toast.svelte'
  import { keyboardStore } from '../stores'

  function exportConfig() {
    const device = keyboardStore.device
    const config = keyboardStore.config
    if (!device || !config) return
    const payload = {
      device: { info: device.info, capabilities: device.capabilities, layout: device.layout },
      config,
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${device.info.product_name.trim() || 'keyboard'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.show(`Exported ${a.download}`)
  }
</script>

<ScreenScroll
  title='Settings'
  desc="App preferences. These don't change your keyboard."
>
  <Card class='mb-4' flush>
    <Row class='border-b border-border'>
      <div>
        <div class='text-[13.5px] font-semibold text-foreground'>Appearance</div>
        <div class='text-xs text-muted-foreground'>Light or dark interface.</div>
      </div>
      <div class='ml-auto'>
        <Segmented
          items={[
            { value: 'light', label: 'Light', icon: 'lucide:sun' },
            { value: 'dark', label: 'Dark', icon: 'lucide:moon' },
          ]}
          value={theme.value}
          height={32}
          onchange={v => theme.set(v)}
        />
      </div>
    </Row>

    <Row class='border-b border-border'>
      <div>
        <div class='text-[13.5px] font-semibold text-foreground'>Language</div>
        <div class='text-xs text-muted-foreground'>Interface language.</div>
      </div>
      <span class='ml-auto text-xs text-muted-foreground'>English (US)</span>
    </Row>

    <Row class='border-b border-border'>
      <div>
        <div class='text-[13.5px] font-semibold text-foreground'>
          Start on last device
        </div>
        <div class='text-xs text-muted-foreground'>
          Reconnect automatically on launch when exactly one keyboard is attached.
        </div>
      </div>
      <span class='ml-auto'>
        {#if isTauri()}
          <Pill tone='ok'>On</Pill>
        {:else}
          <Pill tone='muted'>Unavailable in the browser</Pill>
        {/if}
      </span>
    </Row>

    <Row>
      <div>
        <div class='text-[13.5px] font-semibold text-foreground'>Backup keymap</div>
        <div class='text-xs text-muted-foreground'>
          Export the keyboard's current configuration as a .json file.
        </div>
      </div>
      <Button
        class='ml-auto'
        disabled={!keyboardStore.config}
        onclick={exportConfig}
      >
        <Icon icon='lucide:save' width={15} height={15} />
        Export
      </Button>
    </Row>
  </Card>

  <Card class='mb-4'>
    <Unsupported>
      Export writes the protocol's own JSON, not a keyboard.toml — the firmware
      reports its live configuration, not the file it was built from.
    </Unsupported>
  </Card>

  <Card class='flex items-center gap-3.5'>
    <img class='h-7 w-auto shrink-0' src={logo} alt='RMK' />
    <div>
      <div class='text-[13.5px] font-semibold text-foreground'>
        Rynk — a friendlier RMK configurator
      </div>
      <div class='text-xs text-muted-foreground'>
        Built on RMK · Rust keyboard firmware · rmk.rs
      </div>
    </div>
  </Card>
</ScreenScroll>
