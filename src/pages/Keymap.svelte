<script lang='ts'>
  import type { KeyAction, Variant } from '../rynk'
  import Board from '../components/Board.svelte'
  import KeycodeSelect from '../components/KeycodeSelect.svelte'
  import LayerTabs from '../components/LayerTabs.svelte'
  import IconBtn from '../components/ui/IconBtn.svelte'
  import { drag } from '../lib/drag.svelte'
  import { History } from '../lib/history.svelte'
  import { renderVariants } from '../lib/layout'
  import { toast } from '../lib/toast.svelte'
  import { describeKeyboardError, keyboardStore } from '../stores'

  interface Props {
    layer: number
    onlayer: (layer: number) => void
  }

  const { layer, onlayer }: Props = $props()

  let selected = $state<{ row: number, col: number } | null>(null)
  let autoAdvance = $state(false)

  const history = new History()

  const caps = $derived(keyboardStore.device?.capabilities)
  const variants = $derived(renderVariants(keyboardStore.device?.layout, caps))
  const variant = $derived<Variant | undefined>(
    variants[keyboardStore.device?.layout.default_variant ?? 0] ?? variants[0],
  )
  const actions = $derived(keyboardStore.config?.keymap[layer] ?? [])

  function switchLayer(next: number) {
    onlayer(next)
    selected = null
  }

  function write(row: number, col: number, action: KeyAction) {
    const before = actions[row]?.[col]
    if (before === undefined) return
    void keyboardStore.setKey(layer, row, col, action).match(
      () => history.record({ layer, row, col, before, after: action }),
      e => toast.error(describeKeyboardError(e)),
    )
  }

  /// Walks the variant's own key order, so auto-advance follows the board's
  /// reading order rather than the raw matrix.
  function advance() {
    if (!variant || !selected) return
    const keys = variant.keys
    const at = keys.findIndex(k => k.row === selected!.row && k.col === selected!.col)
    const next = keys[(at + 1) % keys.length]
    if (next) selected = { row: next.row, col: next.col }
  }

  function assign(action: KeyAction) {
    if (!selected) return
    write(selected.row, selected.col, action)
    if (autoAdvance) advance()
  }

  function dropOn(row: number, col: number) {
    if (!drag.action) return
    write(row, col, drag.action)
    selected = { row, col }
    drag.end()
  }

  function onkeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
    e.preventDefault()
    const edit = e.shiftKey ? history.redo() : history.undo()
    if (!edit) return
    // Undo is another write, not a rollback: the keyboard already has the edit.
    void keyboardStore
      .setKey(edit.layer, edit.row, edit.col, e.shiftKey ? edit.after : edit.before)
      .mapErr(err => toast.error(describeKeyboardError(err)))
  }

  function step(direction: 'undo' | 'redo') {
    const edit = direction === 'undo' ? history.undo() : history.redo()
    if (!edit) return
    void keyboardStore
      .setKey(edit.layer, edit.row, edit.col, direction === 'undo' ? edit.before : edit.after)
      .mapErr(err => toast.error(describeKeyboardError(err)))
  }
</script>

<svelte:window {onkeydown} />

<div class='flex min-h-0 min-w-0 flex-1 flex-col gap-[14px] p-[14px] pb-4'>
  <div class='flex flex-none items-center'>
    <div class='flex-1'></div>
    <LayerTabs
      count={caps?.num_layers ?? 1}
      {layer}
      onselect={switchLayer}
    />
    <div class='flex flex-1 justify-end gap-0.5'>
      <IconBtn
        icon='lucide:undo-2'
        title='Undo (⌘Z)'
        size={32}
        disabled={!history.canUndo}
        onclick={() => step('undo')}
      />
      <IconBtn
        icon='lucide:redo-2'
        title='Redo (⌘⇧Z)'
        size={32}
        disabled={!history.canRedo}
        onclick={() => step('redo')}
      />
    </div>
  </div>

  {#if variant}
    <Board
      {variant}
      layer={actions}
      layerIndex={layer}
      {selected}
      onselect={(row, col) => { selected = { row, col } }}
      onassign={dropOn}
    />
  {/if}

  <!-- Wider than the design's 1000px: the firmware's catalog has eight groups
       where the mock had five, and the rail would clip its last tab. The height
       is fixed so switching tabs never reflows the board above it — measured
       against Basic, the tallest tab, so it is snug rather than arbitrary.
       Shorter tabs leave slack; taller content scrolls. -->
  <div class='flex h-[380px] min-h-0 justify-center'>
    <div class='flex min-h-0 w-full max-w-[1200px]'>
      <KeycodeSelect {caps} panel onpick={assign}>
        {#snippet rightSlot()}
          <IconBtn
            icon='lucide:eraser'
            title='Clear (transparent)'
            size={32}
            disabled={!selected}
            onclick={() => assign('Transparent')}
          />
          <IconBtn
            icon='lucide:target'
            title='Auto-advance to the next key after assigning'
            size={32}
            active={autoAdvance}
            onclick={() => (autoAdvance = !autoAdvance)}
          />
        {/snippet}
      </KeycodeSelect>
    </div>
  </div>
</div>
