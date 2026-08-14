import type { ChildProcess } from 'node:child_process'
import type { JsByteLink } from '../src/rynk/core'
import { spawn } from 'node:child_process'
import net from 'node:net'
import process from 'node:process'

export function socketLink(sock: net.Socket): JsByteLink {
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
export async function freePort(): Promise<number> {
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

export async function dial(port: number, deadlineMs: number): Promise<net.Socket> {
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

export interface QemuFixture {
  qemu: ChildProcess
  port: number
  /// Everything the build and the guest printed, for post-mortems.
  log: string[]
}

/// Builds (when stale) and boots the fixture firmware, resolving once its
/// serial port is safe to talk to.
export async function spawnQemu(): Promise<QemuFixture> {
  const port = await freePort()
  const qemu = spawn('node', ['run.mjs'], {
    cwd: new URL('.', import.meta.url).pathname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, RMK_QEMU_PORT: String(port) },
  })
  // Held rather than inherited: cargo's progress would drown the reporter, but
  // a failed handshake is undebuggable without the build and semihosting output.
  const log: string[] = []
  qemu.stdout?.on('data', (d: Buffer) => log.push(d.toString()))
  qemu.stderr?.on('data', (d: Buffer) => log.push(d.toString()))
  process.on('exit', () => qemu.kill('SIGKILL'))
  try {
    // Generous: this also covers a cold cargo build of the riscv firmware.
    await waitForLine(log, UART_READY, qemu, 600_000)
  }
  catch (e) {
    console.error(`--- qemu on port ${port} ---\n${log.join('')}`)
    qemu.kill('SIGTERM')
    throw e
  }
  return { qemu, port, log }
}
