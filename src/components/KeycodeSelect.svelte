<script lang='ts'>
  import type { Snippet } from 'svelte'
  import type { CatalogEntry } from '../lib/keycatalog'
  import type { DeviceCapabilities, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import { RadioGroup } from 'bits-ui'
  import { catalog } from '../lib/catalog.svelte'
  import { actionCatalog } from '../lib/keycatalog'
  import { capLegend } from '../lib/legend'
  import { BOARD_CODES } from '../lib/picker-layout'
  import HoldTapBuilder from './HoldTapBuilder.svelte'
  import KeyboardBasic from './KeyboardBasic.svelte'
  import MiniKey from './MiniKey.svelte'

  interface Props {
    caps: DeviceCapabilities | undefined
    onpick: (action: KeyAction) => void
    /// Restricts the picker to plain HID keys, for callers like the macro
    /// editor whose wire format cannot hold anything richer.
    hidOnly?: boolean
    /// Draws the key area on its own panel. The keymap editor needs it to lift
    /// the keys off the ruled canvas; inside a dialog it would just box a box.
    panel?: boolean
    /// Per-key controls the keymap editor hangs off the end of the rail.
    rightSlot?: Snippet
  }

  const { caps, onpick, hidOnly = false, panel = false, rightSlot }: Props = $props()

  const HOLD_TAP = 'Hold-Tap'

  const GROUP_ICONS: Record<string, string> = {
    Basic: 'lucide:keyboard',
    Media: 'lucide:volume-2',
    Layer: 'lucide:layers',
    Control: 'lucide:cpu',
    Mouse: 'lucide:mouse',
    Advanced: 'lucide:sparkles',
    Light: 'lucide:lightbulb',
    Other: 'lucide:layout-grid',
    [HOLD_TAP]: 'lucide:command',
  }

  /// Slightly wider than a board key, because these legends are words rather
  /// than single glyphs — but one width for all of them.
  const CHIP_UNITS = 1.25

  let group = $state('Basic')
  let query = $state('')

  const groups = $derived.by(() => {
    const all = actionCatalog(caps, catalog.hid)
    if (!hidOnly) return all
    return all
      .map(g => ({ ...g, entries: g.entries.filter(e => e.hid !== undefined) }))
      .filter(g => g.entries.length > 0)
  })
  const tabs = $derived(hidOnly ? groups.map(g => g.name) : [...groups.map(g => g.name), HOLD_TAP])
  const basic = $derived(groups.find(g => g.name === 'Basic')?.entries ?? [])
  const holdTap = $derived(group === HOLD_TAP && !query)

  /// Basic's chip grid stands down while the board is drawn, but the entries the
  /// board has no place for still need somewhere to live.
  const offBoard = $derived(basic.filter(e => !e.hid || !BOARD_CODES.has(e.hid)))

  const results = $derived.by<CatalogEntry[]>(() => {
    const q = query.trim().toLowerCase()
    if (q) {
      return groups
        .flatMap(g => g.entries)
        .filter(e => e.label.toLowerCase().includes(q) || (e.title ?? '').toLowerCase().includes(q))
    }
    return groups.find(g => g.name === group)?.entries ?? []
  })

  function selectGroup(name: string) {
    group = name
    query = ''
  }

  function pickHid(code: string) {
    onpick({ Single: { Key: { Hid: code as never } } })
  }
</script>

<div class='flex min-h-0 w-full flex-col overflow-hidden'>
  <div
    class={`
      relative z-10 flex flex-none items-center gap-1.5 rounded-[14px] border
      border-base-300 bg-base-100 px-1.5 py-[5px] shadow-bar
    `}
  >
    <!-- While a search runs no group is current, so the bound value walks off
         every radio rather than pinning the rail to a stale tab. -->
    <RadioGroup.Root
      class='noscroll flex min-w-0 flex-1 gap-0.5 overflow-x-auto'
      orientation='horizontal'
      bind:value={() => (query ? '' : group), selectGroup}
    >
      {#each tabs as name (name)}
        {@const on = name === group && !query}
        <RadioGroup.Item
          class={[
            `
              inline-flex h-[34px] flex-none cursor-pointer items-center gap-1.5
              rounded-[10px] px-[13px] text-[13px] whitespace-nowrap
              transition-colors
            `,
            on
              ? 'bg-brand-tint-strong font-bold text-brand-darker'
              : `
                font-semibold text-muted-foreground
                hover:bg-base-200 hover:text-foreground
              `,
          ]}
          value={name}
        >
          <Icon icon={GROUP_ICONS[name] ?? 'lucide:layout-grid'} width={15} height={15} />
          {name}
        </RadioGroup.Item>
      {/each}
    </RadioGroup.Root>

    {#if !holdTap}
      <div class='relative flex-none basis-44'>
        <Icon
          class='absolute top-[9px] left-2.5 text-muted-foreground'
          icon='lucide:search'
          width={14}
          height={14}
        />
        <input
          class={`
            h-8 w-full rounded-md border border-input bg-background pr-2.5 pl-8
            text-[13px] text-foreground outline-none
          `}
          placeholder='Search…'
          aria-label='Search keycodes'
          bind:value={query}
        />
      </div>
    {/if}

    {#if rightSlot}
      <span class='h-[22px] w-px bg-border'></span>
      {@render rightSlot()}
    {/if}
  </div>

  <!-- Hangs off the rail like an open menu: pulled up by the rail's corner
       radius so its square top disappears behind it, leaving one surface. The
       negative margin swallows 14px of the top padding, so `pt-8` leaves the
       keys the same clearance under the rail that `pb-4` leaves below them. -->
  <div
    class={[
      'flex min-h-0 flex-1 flex-col',
      panel
        ? `
          mx-6 -mt-3.5 rounded-b-[14px] border border-t-0 border-base-300
          bg-base-100 px-3 pt-7 pb-3 shadow-bar
        `
        : 'mt-2.5 px-2 pt-0.5 pb-1',
    ]}
  >
    <div class='noscroll min-h-0 flex-1 overflow-y-auto'>
      {#if catalog.hid.length === 0}
        <p class='p-2 text-[13px] text-muted-foreground'>Loading keycodes…</p>
      {:else if holdTap}
        <HoldTapBuilder taps={basic} layerCount={caps?.num_layers ?? 1} {onpick} />
      {:else if group === 'Basic' && !query}
        <KeyboardBasic
          extras={offBoard}
          onpick={pickHid}
          onpickentry={entry => onpick(entry.action)}
        />
      {:else}
        <div class='flex flex-wrap content-start gap-1'>
          {#each results as entry (entry.id)}
            <MiniKey
              label={entry.label}
              sub={entry.sub}
              w={CHIP_UNITS}
              tint={capLegend(entry.action).tint}
              title={entry.title ?? entry.label}
              action={entry.action}
              onpick={() => onpick(entry.action)}
            />
          {/each}
          {#if results.length === 0}
            <span class='p-2 text-[13px] text-muted-foreground'>
              No keycodes match “{query}”.
            </span>
          {/if}
        </div>
      {/if}
    </div>

  </div>
</div>
