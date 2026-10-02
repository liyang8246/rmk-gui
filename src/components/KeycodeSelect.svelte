<script lang='ts'>
  import type { Snippet } from 'svelte'
  import type { CatalogEntry, CatalogGroup } from '../lib/keycatalog'
  import type { DeviceCapabilities, KeyAction } from '../rynk'
  import Icon from '@iconify/svelte'
  import { RadioGroup } from 'bits-ui'
  import { catalog } from '../lib/catalog.svelte'
  import { actionCatalog, asAction } from '../lib/keycatalog'
  import { capLegend } from '../lib/legend'
  import { BOARD_CODES } from '../lib/picker-layout'
  import { keyboardStore } from '../stores'
  import AdvancedBuilder from './AdvancedBuilder.svelte'
  import KeyboardBasic from './KeyboardBasic.svelte'
  import MiniKey from './MiniKey.svelte'
  import Segmented from './ui/Segmented.svelte'

  interface Props {
    caps: DeviceCapabilities | undefined
    onpick: (action: KeyAction) => void
    /// Restricts the picker to plain HID keys.
    hidOnly?: boolean
    macroOnly?: boolean
    /// Draws the picker as its own panel. The keymap editor needs it to lift
    /// the keys off the ruled canvas; inside a dialog it would just box a box.
    panel?: boolean
    /// Per-key controls the keymap editor hangs off the end of the header.
    rightSlot?: Snippet
  }

  const { caps, onpick, hidOnly = false, macroOnly = false, panel = false, rightSlot }: Props = $props()

  /// Tabs gather catalog groups into sections, so a tab can stay broad while
  /// search keeps reporting the finer group a hit came from.
  const TABS = [
    { name: 'Basic', icon: 'lucide:keyboard', sections: ['Basic', 'Other'] },
    { name: 'Media', icon: 'lucide:volume-2', sections: ['Media', 'Mouse', 'System'] },
    { name: 'Layer', icon: 'lucide:layers', sections: ['Layer'] },
    { name: 'Advanced', icon: 'lucide:sparkles', sections: ['Advanced'] },
    { name: 'Device', icon: 'lucide:cpu', sections: ['Control', 'Wireless', 'Light'] },
  ] as const

  /// Slightly wider than a board key, because these legends are words rather
  /// than single glyphs — but one width for all of them.
  const CHIP_UNITS = 1.25

  let group = $state('Basic')
  let query = $state('')
  /// Advanced lists the ready-made keys, or builds one around a plain key.
  let mode = $state<'keys' | 'MK' | 'LT' | 'MT'>('keys')

  /// The live table length, not `caps.max_morse`: that is only capacity, and
  /// the firmware rejects a `Morse n` past the actual table.
  const morseSlots = $derived(keyboardStore.config?.morses.length ?? 0)

  const groups = $derived.by(() => {
    const all = actionCatalog(caps, catalog.hid, morseSlots)
    if (macroOnly) {
      return all
        .map(g => ({ ...g, entries: g.entries.filter((e) => {
          const action = asAction(e.action)
          return action !== null && !(typeof action === 'object' && 'TriggerMacro' in action)
        }) }))
        .filter(g => g.entries.length > 0)
    }
    if (!hidOnly) return all
    return all
      .map(g => ({ ...g, entries: g.entries.filter(e => e.hid !== undefined) }))
      .filter(g => g.entries.length > 0)
  })
  const tabs = $derived(TABS.filter(t => t.sections.some(name => groups.some(g => g.name === name))))
  /// The macro picker records plain keys, so it gets no builders.
  const builders = $derived(!hidOnly && !macroOnly)
  const sections = $derived(
    (TABS.find(t => t.name === group)?.sections ?? [])
      .flatMap(name => groups.filter(g => g.name === name)),
  )
  const basic = $derived(groups.find(g => g.name === 'Basic')?.entries ?? [])

  const needle = $derived(query.trim().toLowerCase())
  /// A builder has no list to search: the box filters its keys instead, so
  /// typing must not unpin the tab.
  const building = $derived(group === 'Advanced' && builders && mode !== 'keys')
  const searching = $derived(needle !== '' && !building)

  /// Basic's chip grid stands down while the board is drawn, but the entries the
  /// board has no place for still need somewhere to live.
  const offBoard = $derived(basic.filter(e => !e.hid || !BOARD_CODES.has(e.hid)))

  /// A search spans every group, so its hits stay grouped: a flat wall of chips
  /// says nothing about whether a hit is a plain key, a layer op or a macro.
  const shown = $derived.by<CatalogGroup[]>(() => {
    if (!searching) return sections
    return groups
      .map(g => ({ name: g.name, entries: g.entries.filter(e => matches(e, needle)) }))
      .filter(g => g.entries.length > 0)
  })
  const found = $derived(shown.reduce((n, g) => n + g.entries.length, 0))

  function matches(entry: CatalogEntry, text: string): boolean {
    return entry.label.toLowerCase().includes(text)
      || (entry.title ?? '').toLowerCase().includes(text)
  }

  function selectGroup(name: string) {
    group = name
    query = ''
  }

  function pickHid(code: string) {
    onpick({ Single: { Key: { Hid: code as never } } })
  }
</script>

{#snippet chips(list: CatalogGroup[], headed: boolean)}
  <div class='flex flex-col gap-3.5'>
    {#each list as section (section.name)}
      <div class='flex flex-col gap-1.5'>
        {#if headed}
          <div class='flex items-center gap-1.5 text-muted-foreground'>
            <span class='text-[10px] font-bold tracking-[0.06em] uppercase'>
              {section.name}
            </span>
            <span class='text-[10px] font-semibold opacity-70'>
              {section.entries.length}
            </span>
            <span class='h-px flex-1 bg-border'></span>
          </div>
        {/if}
        <div class='flex flex-wrap content-start gap-1'>
          {#each section.entries as entry (entry.id)}
            <MiniKey
              label={entry.label}
              sub={entry.sub}
              w={CHIP_UNITS}
              tint={capLegend(entry.action).tint}
              title={entry.title ?? entry.label}
              action={entry.action}
              highlight={searching ? needle : undefined}
              onpick={() => onpick(entry.action)}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/snippet}

<div
  class={[
    'flex min-h-0 w-full flex-col overflow-hidden',
    panel && `rounded-[14px] border border-base-300 bg-base-100 shadow-bar`,
  ]}
>
  <div
    class={[
      'flex flex-none items-center gap-2 border-b border-border',
      panel ? 'px-3 py-2' : 'pb-2.5',
    ]}
  >
    <!-- While a catalog search runs no group is current, so the bound value
         walks off every radio rather than pinning a stale tab. -->
    <RadioGroup.Root
      class='noscroll flex min-w-0 flex-1 gap-0.5 overflow-x-auto'
      orientation='horizontal'
      bind:value={() => (searching ? '' : group), selectGroup}
    >
      {#each tabs as { name, icon } (name)}
        {@const on = name === group && !searching}
        <RadioGroup.Item
          class={[
            `
              inline-flex h-8 flex-none cursor-pointer items-center gap-1.5
              rounded-lg px-2.5 text-[12.5px] whitespace-nowrap
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
          <Icon {icon} width={15} height={15} />
          {name}
        </RadioGroup.Item>
      {/each}
    </RadioGroup.Root>

    <div class='relative flex-none basis-48'>
      <Icon
        class='absolute top-[9px] left-2.5 text-muted-foreground'
        icon='lucide:search'
        width={14}
        height={14}
      />
      <input
        class={`
          h-8 w-full rounded-lg border border-input bg-background pr-7 pl-8
          text-[12.5px] text-foreground transition-colors outline-none
          focus:border-brand
        `}
        placeholder={building ? 'Find key…' : 'Search keycodes…'}
        aria-label={building ? 'Search keys' : 'Search keycodes'}
        bind:value={query}
      />
      {#if needle}
        <button
          class={`
            absolute top-1.5 right-1.5 inline-flex size-5 cursor-pointer
            items-center justify-center rounded-md text-muted-foreground
            transition-colors
            hover:bg-base-200 hover:text-foreground
          `}
          type='button'
          aria-label='Clear search'
          title='Clear search'
          onclick={() => (query = '')}
        >
          <Icon icon='lucide:x' width={12} height={12} />
        </button>
      {/if}
    </div>

    {#if rightSlot}
      <span class='h-[22px] w-px bg-border'></span>
      {@render rightSlot()}
    {/if}
  </div>

  <div
    class={[
      'noscroll min-h-0 flex-1 overflow-y-auto',
      panel ? 'px-3 pt-2.5 pb-3' : 'pt-2.5',
    ]}
  >
    {#if catalog.hid.length === 0}
      <p class='p-2 text-[13px] text-muted-foreground'>Loading keycodes…</p>
    {:else if group === 'Advanced' && builders && !searching}
      <div class='flex h-full flex-col gap-2.5'>
        <div class='flex flex-none'>
          <Segmented
            items={[
              { value: 'keys', label: 'Keys' },
              { value: 'MK', label: 'Mod+Key' },
              { value: 'LT', label: 'Layer-Tap' },
              { value: 'MT', label: 'Mod-Tap' },
            ]}
            value={mode}
            height={28}
            onchange={v => (mode = v)}
          />
        </div>
        {#if mode === 'keys'}
          {@render chips(shown, shown.length > 1)}
        {:else}
          <div class='min-h-0 flex-1'>
            <AdvancedBuilder
              kind={mode}
              keys={basic}
              layerCount={caps?.num_layers ?? 1}
              morseCount={morseSlots}
              query={needle}
              {onpick}
            />
          </div>
        {/if}
      </div>
    {:else if group === 'Basic' && !searching}
      <KeyboardBasic
        extras={offBoard}
        onpick={pickHid}
        onpickentry={entry => onpick(entry.action)}
      />
      {#if shown.length > 1}
        <div class='mt-3.5'>
          {@render chips(shown.slice(1), true)}
        </div>
      {/if}
    {:else if found === 0}
      <p class='p-2 text-[13px] text-muted-foreground'>
        {searching ? `No keycodes match “${query.trim()}”.` : 'This group is empty.'}
      </p>
    {:else}
      {@render chips(shown, searching || shown.length > 1)}
    {/if}
  </div>
</div>
