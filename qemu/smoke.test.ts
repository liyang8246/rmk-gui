import type { ChildProcess } from 'node:child_process'
import type { JsByteLink, RynkClient } from '../src/rynk/core'
import type { KeyAction, Morse } from '../src/rynk/wasm/rynk_wasm.js'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import process from 'node:process'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { connectClient } from '../src/rynk/core'

const WASM = readFileSync(new URL('../src/rynk/wasm/rynk_wasm_bg.wasm', import.meta.url))

// Mirrors qemu/src/main.rs.
const ROWS = 4
const COLS = 12
const LAYERS = 2
const ENCODERS = 2

/// A plain key as the wire spells it.
function KEY(code: string): KeyAction {
  return { Single: { Key: { Hid: code as never } } }
}

function socketLink(sock: net.Socket): JsByteLink {
  const chunks: Uint8Array[] = []
  let wake: (() => void) | null = null
  let closed = false
  const signal = () => {
    const w = wake
    wake = null
    w?.()
  }
  sock.on('data', (d: Buffer) => { chunks.push(new Uint8Array(d)); signal() })
  sock.on('close', () => { closed = true; signal() })
  sock.on('error', () => { closed = true; signal() })

  return {
    label: 'qemu',
    async send(frame) {
      await new Promise<void>((res, rej) => {
        sock.write(frame, e => (e ? rej(e) : res()))
      })
    },
    async recv() {
      while (!chunks.length && !closed) await new Promise<void>((res) => { wake = res })
      return chunks.shift() ?? new Uint8Array(0)
    },
    async close() { sock.destroy() },
  }
}

/// Let the OS pick the port, then hand it to qemu. A fixed one lets an
/// unrelated listener answer dial(), or makes the spawn fail outright.
async function freePort(): Promise<number> {
  const srv = net.createServer()
  await new Promise<void>((res, rej) => {
    srv.once('error', rej)
    srv.listen(0, '127.0.0.1', res)
  })
  const { port } = srv.address() as net.AddressInfo
  await new Promise<void>((res) => { srv.close(() => res()) })
  return port
}

/// Printed by qemu/src/main.rs once its UART is initialised. Until then the
/// fixture resets the 16550 FIFO, discarding anything the host already sent —
/// and qemu accepts the connection during machine init, well before that.
const UART_READY = '[RMK] uart ready'

async function waitForLine(log: string[], needle: string, child: ChildProcess, deadlineMs: number) {
  const start = Date.now()
  while (!log.join('').includes(needle)) {
    if (child.exitCode !== null) throw new Error(`qemu exited ${child.exitCode} before ${needle}`)
    if (Date.now() - start > deadlineMs) throw new Error(`timed out waiting for ${needle}`)
    await new Promise((r) => { setTimeout(r, 100) })
  }
}

async function dial(port: number, deadlineMs: number): Promise<net.Socket> {
  const start = Date.now()
  for (;;) {
    try {
      return await new Promise<net.Socket>((res, rej) => {
        const s = net.createConnection({ host: '127.0.0.1', port })
        s.once('connect', () => res(s))
        s.once('error', rej)
      })
    }
    catch (e) {
      if (Date.now() - start > deadlineMs) throw e
      await new Promise((r) => { setTimeout(r, 200) })
    }
  }
}

let qemu: ChildProcess
let sock: net.Socket
let client: RynkClient

beforeAll(async () => {
  const port = await freePort()
  qemu = spawn('node', ['run.mjs'], {
    cwd: new URL('.', import.meta.url).pathname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, RMK_QEMU_PORT: String(port) },
  })
  // Held rather than inherited: cargo's progress would drown the reporter, but
  // a failed handshake is undebuggable without the build and semihosting output.
  const log: string[] = []
  qemu.stdout?.on('data', (d: Buffer) => log.push(d.toString()))
  qemu.stderr?.on('data', (d: Buffer) => log.push(d.toString()))
  try {
    // Generous: this also covers a cold cargo build of the riscv firmware.
    await waitForLine(log, UART_READY, qemu, 600_000)
    sock = await dial(port, 30_000)
    client = (await connectClient(socketLink(sock), WASM)).client
  }
  catch (e) {
    console.error(`--- qemu on port ${port} ---\n${log.join('')}`)
    throw e
  }
})

afterAll(() => {
  client?.free()
  sock?.destroy()
  qemu?.kill('SIGTERM')
})

it('reports the fixture geometry', async () => {
  const caps = await client.get_capabilities()
  expect(caps.num_layers).toBe(LAYERS)
  expect(caps.num_rows).toBe(ROWS)
  expect(caps.num_cols).toBe(COLS)
  expect(caps.num_encoders).toBe(ENCODERS)
})

it('reads the whole keymap in one paged transfer', async () => {
  const flat = await client.read_all_keymap()
  expect(flat).toHaveLength(LAYERS * ROWS * COLS)
})

it('serves the fixture keymap values', async () => {
  // get_default_keymap() in qemu/src/main.rs.
  expect(await client.get_key(0, 0, 0)).toEqual(KEY('Q'))
  expect(await client.get_key(0, 2, 5)).toEqual(KEY('LCtrl'))
  expect(await client.get_key(0, 3, 8)).toEqual({ Single: { LayerOn: 1 } })
  expect(await client.get_key(1, 0, 0)).toBe('Transparent')
})

it('serves the fixture encoder map', async () => {
  // DEFAULT_ENCODER_MAP in qemu/src/main.rs.
  expect(await client.get_encoder(0, 0)).toEqual({
    clockwise: KEY('AudioVolUp'),
    counter_clockwise: KEY('AudioVolDown'),
  })
  expect(await client.get_encoder(1, 1)).toEqual({
    clockwise: KEY('Home'),
    counter_clockwise: KEY('End'),
  })
})

it('round-trips a key write', async () => {
  const original = await client.get_key(0, 0, 0)
  expect(original).not.toBe('Transparent')
  try {
    await client.set_key(0, 0, 0, 'Transparent')
    expect(await client.get_key(0, 0, 0)).toBe('Transparent')
  }
  finally {
    await client.set_key(0, 0, 0, original)
  }
  expect(await client.get_key(0, 0, 0)).toEqual(original)
})

it('round-trips an encoder write', async () => {
  const original = await client.get_encoder(0, 0)
  const swapped = { clockwise: original.counter_clockwise, counter_clockwise: original.clockwise }
  try {
    await client.set_encoder(0, 0, swapped)
    expect(await client.get_encoder(0, 0)).toEqual(swapped)
  }
  finally {
    await client.set_encoder(0, 0, original)
  }
})

it('serves every table filled to its capacity, ending with Invalid', async () => {
  // initialize_keymap pads combos, forks and morses to their build-time
  // capacity, so the caps maxima double as the live table lengths. The pad
  // slots read back empty, and the first index past the table is Invalid —
  // which is how a host must find the end on a firmware that doesn't pad.
  const caps = await client.get_capabilities()
  const combos = await client.read_all_combos()
  expect(combos).toHaveLength(caps.max_combos)
  expect(combos.every(c => c.actions.length === 0)).toBe(true)
  expect(await client.read_all_morses()).toHaveLength(caps.max_morse)
  expect((await client.get_fork(caps.max_forks - 1)).trigger).toBe('No')
  await expect(client.get_fork(caps.max_forks)).rejects.toThrow('device rejected Invalid')
})

it('serves the fixture fork', async () => {
  const fork = await client.get_fork(0)
  expect(fork.trigger).toEqual(KEY('A'))
  expect(fork.negative_output).toEqual(KEY('B'))
  expect(fork.positive_output).toEqual(KEY('C'))
  expect(fork.bindable).toBe(true)
})

it('round-trips a fork write', async () => {
  const original = await client.get_fork(0)
  const swapped = {
    ...original,
    negative_output: original.positive_output,
    positive_output: original.negative_output,
  }
  try {
    await client.set_fork(0, swapped)
    expect(await client.get_fork(0)).toEqual(swapped)
  }
  finally {
    await client.set_fork(0, original)
  }
})

it('round-trips a morse write', async () => {
  const original = await client.get_morse(0)
  expect(original.actions).toEqual([])
  const morse: Morse = {
    profile: { ...original.profile, hold_timeout_ms: 240 },
    // 0b10 = tap, 0b101 = tap-then-hold.
    actions: [[0b10, { Key: { Hid: 'A' as never } }], [0b101, { Key: { Hid: 'B' as never } }]],
  }
  try {
    await client.set_morse(0, morse)
    expect(await client.get_morse(0)).toEqual(morse)
  }
  finally {
    await client.set_morse(0, original)
  }
})

it('round-trips the default layer', async () => {
  expect(await client.get_default_layer()).toBe(0)
  try {
    await client.set_default_layer(1)
    expect(await client.get_default_layer()).toBe(1)
  }
  finally {
    await client.set_default_layer(0)
  }
})

it('round-trips the behavior config', async () => {
  const original = await client.get_behavior()
  const next = {
    combo_timeout_ms: 77,
    oneshot_timeout_ms: 850,
    tap_interval_ms: 25,
    tap_capslock_interval_ms: 350,
  }
  try {
    await client.set_behavior(next)
    expect(await client.get_behavior()).toEqual(next)
  }
  finally {
    await client.set_behavior(original)
  }
})

it('reads an idle matrix as all zeros', async () => {
  // The firmware serves its full MATRIX_BITMAP_SIZE buffer; the host slices
  // by geometry. Nothing presses keys under qemu, so every byte is clear.
  const state = await client.get_matrix_state()
  expect(state.pressed_bitmap).toHaveLength(32)
  expect(state.pressed_bitmap.every(b => b === 0)).toBe(true)
})

it('pushes topic events', async () => {
  // The fixture's test_topics task publishes layer changes every 200ms.
  const event = await client.next_topic()
  expect(Object.keys(event)).toHaveLength(1)
})

it('exposes the lock gate as unlocked', async () => {
  // The default fixture build is `insecure`; --features locked flips this.
  expect((await client.get_lock_status()).locked).toBe(false)
})

process.on('exit', () => qemu?.kill('SIGKILL'))
