import type { DeviceCapabilities, RynkClient } from '../rynk/wasm/rynk_wasm.js'
import type { ConfigSlice, PathChange } from './keyboard'
import { setPath, setStore, shadow, store } from './keyboard'

// ── Re-apply / commit / rollback ─────────────────────────────────────────────

function groupBySlice(changes: PathChange[]): Map<ConfigSlice, PathChange[]> {
  const map = new Map<ConfigSlice, PathChange[]>()
  for (const c of changes) {
    if (!map.has(c.slice)) map.set(c.slice, [])
    map.get(c.slice)!.push(c)
  }
  return map
}

export function reapplyChanges(changes: PathChange[]) {
  for (const [slice, sliceChanges] of groupBySlice(changes)) {
    let clone: unknown = structuredClone(store.config[slice])
    for (const c of sliceChanges) {
      if (c.path.length === 0) {
        clone = structuredClone(c.newValue)
      } else {
        setPath(clone, c.path, structuredClone(c.newValue))
      }
    }
    setStore('config', slice as never, clone as never)
  }
}

export function commitShadow(changes: PathChange[]) {
  for (const c of changes) {
    if (c.path.length === 0) {
      const target = shadow.config as unknown as Record<string, unknown>
      target[c.slice] = structuredClone(c.newValue)
    } else {
      setPath(shadow.config[c.slice], c.path, structuredClone(c.newValue))
    }
  }
}

export function rollbackToShadow(changes: PathChange[]) {
  // NOTE: If sendChanges failed mid-way (partial sync), some paths may already
  // be committed on the keyboard with new values while shadow still holds old
  // values. This rollback reverts the store to shadow (old values), which is
  // correct for the UI but may leave the keyboard in a mixed state. Writes are
  // idempotent so the next successful sync will re-send everything, but shadow
  // accuracy for partially-succeeded paths is not guaranteed until then.
  for (const [slice] of groupBySlice(changes)) {
    setStore('config', slice as never, structuredClone(shadow.config[slice]) as never)
  }
}

// ── Send changes to keyboard ────────────────────────────────────────────────

export async function sendChanges(client: RynkClient, changes: PathChange[], caps: DeviceCapabilities) {
  for (const [slice, sliceChanges] of groupBySlice(changes)) {
    await sendSlice(client, slice, sliceChanges, caps)
  }
}

async function sendSlice(client: RynkClient, slice: ConfigSlice, changes: PathChange[], caps: DeviceCapabilities) {
  switch (slice) {
    case 'keymap':
      await sendKeymapChanges(client, changes, caps)
      break
    case 'encoders':
      for (const c of changes) {
        if (c.path.length >= 2 && c.newValue !== undefined)
          await client.set_encoder(c.path[0] as number, c.path[1] as number, c.newValue as never)
      }
      break
    case 'combos':
      await sendIndexedBulk(client, changes, caps, 'combo')
      break
    case 'macros':
      await sendMacroChanges(client, changes, caps)
      break
    case 'morse':
      await sendIndexedBulk(client, changes, caps, 'morse')
      break
    case 'forks':
      for (const c of changes) {
        if (c.path.length >= 1 && c.newValue !== undefined)
          await client.set_fork(c.path[0] as number, c.newValue as never)
      }
      break
    case 'behavior':
      await client.set_behavior(store.config.behavior as never)
      break
    case 'defaultLayer': {
      const dl = changes[0]
      if (dl) await client.set_default_layer(dl.newValue as number)
      break
    }
  }
}

// ── Per-slice senders ───────────────────────────────────────────────────────

async function sendKeymapChanges(client: RynkClient, changes: PathChange[], caps: DeviceCapabilities) {
  const sorted = changes
    .filter(c => c.path.length >= 3)
    .map(c => ({ layer: c.path[0] as number, row: c.path[1] as number, col: c.path[2] as number, action: c.newValue }))
    .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col)
  if (sorted.length === 0) return

  const maxBulk = caps.max_bulk_keys || 32
  const groups: typeof sorted[] = []
  let current: typeof sorted = []

  for (const k of sorted) {
    if (current.length > 0) {
      const prev = current[current.length - 1]
      if (prev.layer === k.layer && prev.row === k.row && k.col === prev.col + 1 && current.length < maxBulk) {
        current.push(k)
      } else {
        groups.push(current)
        current = [k]
      }
    } else {
      current = [k]
    }
  }
  if (current.length > 0) groups.push(current)

  for (const group of groups) {
    const { layer, row, col } = group[0]
    const actions = group.map(k => (k.action === undefined ? 'No' : k.action))
    await client.set_keymap_bulk({ layer, start_row: row, start_col: col, actions: actions as never[] })
  }
}

async function sendMacroChanges(client: RynkClient, changes: PathChange[], caps: DeviceCapabilities) {
  const changed = changes
    .filter(c => c.path.length >= 1 && c.newValue !== undefined)
    .map(c => ({ offset: c.path[0] as number, value: c.newValue as number }))
    .sort((a, b) => a.offset - b.offset)
  if (changed.length === 0) return

  const ranges: { start: number, data: number[] }[] = []
  let cur = { start: changed[0].offset, data: [changed[0].value] }
  for (let i = 1; i < changed.length; i++) {
    if (changed[i].offset === cur.start + cur.data.length) {
      cur.data.push(changed[i].value)
    } else {
      ranges.push(cur)
      cur = { start: changed[i].offset, data: [changed[i].value] }
    }
  }
  ranges.push(cur)

  const chunkSize = caps.macro_chunk_size || 64
  for (const range of ranges) {
    for (let off = 0; off < range.data.length; off += chunkSize) {
      const end = Math.min(off + chunkSize, range.data.length)
      await client.set_macro(range.start + off, { data: range.data.slice(off, end) })
    }
  }
}

async function sendIndexedBulk(
  client: RynkClient,
  changes: PathChange[],
  caps: DeviceCapabilities,
  kind: 'combo' | 'morse',
) {
  const sorted = changes
    .filter(c => c.path.length >= 1 && c.newValue !== undefined)
    .map(c => ({ index: c.path[0] as number, config: c.newValue }))
    .sort((a, b) => a.index - b.index)
  if (sorted.length === 0) return

  const maxBulk = caps.max_bulk_configs || 8
  const runs: typeof sorted[] = []
  let run: typeof sorted = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].index === sorted[i - 1].index + 1) {
      run.push(sorted[i])
    } else {
      runs.push(run)
      run = [sorted[i]]
    }
  }
  runs.push(run)

  for (const r of runs) {
    if (r.length > 1) {
      for (let i = 0; i < r.length; i += maxBulk) {
        const chunk = r.slice(i, i + maxBulk)
        const chunkConfigs = chunk.map(c => c.config) as never[]
        kind === 'combo'
          ? await client.set_combo_bulk({ start_index: chunk[0].index, configs: chunkConfigs })
          : await client.set_morse_bulk({ start_index: chunk[0].index, configs: chunkConfigs })
      }
    } else {
      kind === 'combo'
        ? await client.set_combo(r[0].index, r[0].config as never)
        : await client.set_morse(r[0].index, r[0].config as never)
    }
  }
}
