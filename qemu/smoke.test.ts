import type { ChildProcess } from 'node:child_process'
import type { JsByteLink, RynkClient } from '../src/rynk/core'
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
    stdio: 'ignore',
    env: { ...process.env, RMK_QEMU_PORT: String(port) },
  })
  sock = await dial(port, 120_000)
  client = (await connectClient(socketLink(sock), WASM)).client
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
