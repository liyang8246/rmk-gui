import type { ChildProcess } from 'node:child_process'
import type net from 'node:net'
import type { KeyboardConfig } from '../src/stores'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { encodeMacros } from '../src/lib/macro-codec'
import { keycodeTables } from '../src/rynk/core'
import { keyboardStore } from '../src/stores'
import { dial, socketLink, spawnQemu } from './harness'

/// The full store pipeline — validation, serialization, the request chain,
/// optimistic state and the topic pump — against the real fixture firmware.
/// The raw protocol surface is smoke.test.ts's job; here every assertion goes
/// through keyboardStore, the way the UI does it.

const WASM = readFileSync(new URL('../src/rynk/wasm/rynk_wasm_bg.wasm', import.meta.url))

let qemu: ChildProcess
let sock: net.Socket

/// Deep copy that reads through the store's $state proxies.
function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

beforeAll(async () => {
  // The store loads the wasm with no explicit bytes, which Node's fetch cannot
  // serve from a file: URL — initialising the module here first makes the
  // store's own init a no-op reuse of the same instance.
  await keycodeTables(WASM)
  const fixture = await spawnQemu()
  qemu = fixture.qemu
  sock = await dial(fixture.port, 30_000)
  const result = await keyboardStore.initStore({ link: socketLink(sock), label: 'qemu' })
  expect(result.isOk()).toBe(true)
})

afterAll(async () => {
  await keyboardStore.resetStore()
  sock?.destroy()
  qemu?.kill('SIGTERM')
})

it('connects and lands the whole fixture config in the store', () => {
  expect(keyboardStore.connection?.phase).toBe('connected')

  const caps = keyboardStore.device!.capabilities
  expect(caps.num_rows).toBe(4)
  expect(caps.num_cols).toBe(12)
  expect(caps.num_layers).toBe(2)
  expect(caps.num_encoders).toBe(2)

  const config = keyboardStore.config!
  // Known fixture values from qemu/src/main.rs.
  expect(config.keymap[0]![0]![0]).toEqual({ Single: { Key: { Hid: 'Q' } } })
  expect(config.keymap[0]![3]![8]).toEqual({ Single: { LayerOn: 1 } })
  expect(config.keymap[1]![0]![0]).toBe('Transparent')
  expect(config.encoders[0]![0]).toEqual({
    clockwise: { Single: { Key: { Hid: 'AudioVolUp' } } },
    counter_clockwise: { Single: { Key: { Hid: 'AudioVolDown' } } },
  })
  expect(config.forks[0]!.trigger).toEqual({ Single: { Key: { Hid: 'A' } } })
  // Tables come padded to capacity on this firmware.
  expect(config.combos).toHaveLength(caps.max_combos)
  expect(config.morses).toHaveLength(caps.max_morse)
  expect(config.forks).toHaveLength(caps.max_forks)
  expect(config.macros).toHaveLength(caps.macro_space_size)
  expect(config.defaultLayer).toBe(0)

  const status = keyboardStore.status!
  expect(status.lockStatus.locked).toBe(false)
  expect(status.matrixState?.pressed_bitmap.every(b => b === 0)).toBe(true)
})

it('streams the fixture topics into the status', async () => {
  // test_topics publishes wpm/layer/led/sleep on a 200ms cadence.
  await vi.waitFor(() => expect(keyboardStore.status!.wpm).toBeGreaterThan(0), { timeout: 5_000 })
})

it('writes a key and restores it', async () => {
  expect((await keyboardStore.setKey(0, 0, 0, 'Transparent')).isOk()).toBe(true)
  expect(keyboardStore.config!.keymap[0]![0]![0]).toBe('Transparent')
  expect((await keyboardStore.setKey(0, 0, 0, { Single: { Key: { Hid: 'Q' } } })).isOk()).toBe(true)
})

it('rejects a key outside the matrix without touching the device', async () => {
  const result = await keyboardStore.setKey(0, 9, 0, 'Transparent')
  expect(result._unsafeUnwrapErr().type).toBe('invalid')
})

it('writes a combo and clears it', async () => {
  const combo = {
    actions: [
      { Single: { Key: { Hid: 'J' } } },
      { Single: { Key: { Hid: 'K' } } },
    ],
    output: { Single: { Key: { Hid: 'Escape' } } },
    layer: undefined,
  }
  expect((await keyboardStore.setCombo(0, combo)).isOk()).toBe(true)
  expect(keyboardStore.config!.combos[0]).toEqual(combo)
  expect((await keyboardStore.setCombo(0, { actions: [], output: 'No', layer: undefined })).isOk()).toBe(true)
})

it('writes a morse key and clears it', async () => {
  const original = snapshot(keyboardStore.config!.morses[0]!)
  const morse = {
    profile: { ...original.profile, hold_timeout_ms: 180 },
    actions: [[0b10, { Key: { Hid: 'A' } }]] as [number, { Key: { Hid: 'A' } }][],
  }
  expect((await keyboardStore.setMorse(0, morse)).isOk()).toBe(true)
  expect(keyboardStore.config!.morses[0]).toEqual(morse)
  expect((await keyboardStore.setMorse(0, original)).isOk()).toBe(true)
})

it('rewrites the fixture fork and restores it', async () => {
  const original = snapshot(keyboardStore.config!.forks[0]!)
  const swapped = {
    ...original,
    negative_output: original.positive_output,
    positive_output: original.negative_output,
  }
  expect((await keyboardStore.setFork(0, swapped)).isOk()).toBe(true)
  expect(keyboardStore.config!.forks[0]).toEqual(swapped)
  expect((await keyboardStore.setFork(0, original)).isOk()).toBe(true)
})

it('writes an encoder direction and restores it', async () => {
  const original = snapshot(keyboardStore.config!.encoders[0]![0]!)
  const swapped = { clockwise: original.counter_clockwise, counter_clockwise: original.clockwise }
  expect((await keyboardStore.setEncoder(0, 0, swapped)).isOk()).toBe(true)
  expect(keyboardStore.config!.encoders[0]![0]).toEqual(swapped)
  expect((await keyboardStore.setEncoder(0, 0, original)).isOk()).toBe(true)
})

it('moves the default layer and back', async () => {
  expect((await keyboardStore.setDefaultLayer(1)).isOk()).toBe(true)
  expect(keyboardStore.config!.defaultLayer).toBe(1)
  expect((await keyboardStore.setDefaultLayer(0)).isOk()).toBe(true)
})

it('writes the behavior timing and restores it', async () => {
  const original = snapshot(keyboardStore.config!.behavior)
  const next = { ...original, combo_timeout_ms: 66 }
  expect((await keyboardStore.setBehavior(next)).isOk()).toBe(true)
  expect(keyboardStore.config!.behavior.combo_timeout_ms).toBe(66)
  expect((await keyboardStore.setBehavior(original)).isOk()).toBe(true)
})

it('writes the macro region through the app codec', async () => {
  const caps = keyboardStore.device!.capabilities
  // The fixture ships macro storage; a build without it would zero this and
  // the macros screen would not exist to write anything.
  expect(caps.macro_space_size).toBeGreaterThan(0)
  const original = snapshot(keyboardStore.config!.macros)
  const slots = Array.from({ length: 8 }, () => [] as never[])
  const bytes = encodeMacros([[{ kind: 'text', value: 'hi' }], ...slots.slice(1)], caps.macro_space_size)!
  expect(bytes).not.toBeNull()
  expect((await keyboardStore.setMacroRegion(bytes)).isOk()).toBe(true)
  expect(keyboardStore.config!.macros).toEqual(bytes)
  expect((await keyboardStore.setMacroRegion(original)).isOk()).toBe(true)
})

it('polls the matrix state on demand', async () => {
  const result = await keyboardStore.refreshMatrixState()
  expect(result._unsafeUnwrap()?.pressed_bitmap.every(b => b === 0)).toBe(true)
})

it('keeps the lock gate open on the insecure fixture', async () => {
  // lock() is a no-op on a firmware built without unlock keys; the store
  // re-reads the status rather than assuming the command latched.
  expect((await keyboardStore.lock()).isOk()).toBe(true)
  expect(keyboardStore.status!.lockStatus.locked).toBe(false)
  const poll = await keyboardStore.unlockPoll()
  expect(poll._unsafeUnwrap().locked).toBe(false)
})

it('imports a modified backup and lands the device view', async () => {
  const original = snapshot(keyboardStore.config!)
  const edited = snapshot(original)
  edited.keymap[0]![0]![1] = { Single: { Key: { Hid: 'X' } } }
  edited.defaultLayer = 1

  expect((await keyboardStore.importConfig(edited)).isOk()).toBe(true)
  // importConfig re-reads the device after writing, so this is the firmware's
  // own view of what landed — not the draft we handed in.
  expect(keyboardStore.config!.keymap[0]![0]![1]).toEqual({ Single: { Key: { Hid: 'X' } } })
  expect(keyboardStore.config!.defaultLayer).toBe(1)

  expect((await keyboardStore.importConfig(original)).isOk()).toBe(true)
  expect(keyboardStore.config!.keymap[0]![0]![1]).toEqual({ Single: { Key: { Hid: 'W' } } })
  expect(keyboardStore.config!.defaultLayer).toBe(0)
})

it('refuses a backup with foreign geometry before writing', async () => {
  const alien = snapshot(keyboardStore.config!)
  alien.keymap = [[['No']]]
  const result = await keyboardStore.importConfig(alien)
  expect(result._unsafeUnwrapErr().type).toBe('invalid')
})

it('disconnects cleanly', async () => {
  await keyboardStore.disconnect()
  expect(keyboardStore.connection?.phase).toBe('disconnected')
  expect(keyboardStore.config).toBeNull()
  expect(keyboardStore.status).toBeNull()
})
