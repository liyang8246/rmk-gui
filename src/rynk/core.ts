// rynk-wasm bootstrap: version probe, multi-major wasm loading, and connect.

const RYNK_HEADER = 5            // cmd:u16 LE, seq:u8, len:u16 LE
const RYNK_TOPIC_BIT = 0x8000   // CMD high bit: server→host topic push
const CMD_GET_VERSION = 0x0001

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

function frame(cmd: number, seq: number, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(RYNK_HEADER + body.length)
  out[0] = cmd & 0xff
  out[1] = (cmd >> 8) & 0xff
  out[2] = seq
  out[3] = body.length & 0xff
  out[4] = (body.length >> 8) & 0xff
  out.set(body, RYNK_HEADER)
  return out
}

/// JS byte link contract that wasm's `WasmTransport` calls into.
/// Both `TauriByteLink` and `WebByteLink` satisfy this structurally.
export interface JsByteLink {
  send(frame: Uint8Array): Promise<void>
  recv(): Promise<Uint8Array>
  close(): Promise<void>
}

/// Wraps a `JsByteLink` to probe the device's protocol version before the
/// version-matched wasm is loaded, then passes through as the `JsByteLink`
/// for wasm's `connect()`. Leftover buffered bytes from probing are returned
/// first on `recv()` so no data is lost.
class ProbeLink implements JsByteLink {
  private link: JsByteLink
  private buf: Uint8Array = new Uint8Array(0)

  constructor(link: JsByteLink) {
    this.link = link
  }

  private async fill(n: number): Promise<void> {
    while (this.buf.length < n) {
      const chunk = await this.link.recv()
      if (chunk.length === 0) throw new Error('link closed during version probe')
      this.buf = concat(this.buf, chunk)
    }
  }

  private async readFrame(): Promise<{ cmd: number, payload: Uint8Array }> {
    await this.fill(RYNK_HEADER)
    const len = this.buf[3] | (this.buf[4] << 8)
    await this.fill(RYNK_HEADER + len)
    const cmd = this.buf[0] | (this.buf[1] << 8)
    const payload = this.buf.slice(RYNK_HEADER, RYNK_HEADER + len)
    this.buf = this.buf.slice(RYNK_HEADER + len)
    return { cmd, payload }
  }

  async probeVersion(): Promise<{ major: number, minor: number }> {
    await this.link.send(frame(CMD_GET_VERSION, 1, new Uint8Array(0)))
    let f: { cmd: number, payload: Uint8Array }
    do { f = await this.readFrame() } while (f.cmd & RYNK_TOPIC_BIT)
    if (f.payload.length < 3 || f.payload[0] !== 0x00)
      throw new Error('bad version reply')
    return { major: f.payload[1], minor: f.payload[2] }
  }

  async send(data: Uint8Array): Promise<void> { await this.link.send(data) }
  async recv(): Promise<Uint8Array> {
    if (this.buf.length > 0) {
      const c = this.buf
      this.buf = new Uint8Array(0)
      return c
    }
    return this.link.recv()
  }
  async close(): Promise<void> { await this.link.close() }
}

/// Load the wasm module matching the device's protocol major.
/// The Rynk frame envelope and `GetVersion` are stable across all majors,
/// so the probe can run before any wasm is loaded. Today only major 0/1,
/// both served by the same build; future majors get their own `case`.
async function loadCore(major: number) {
  switch (major) {
    case 0:
    case 1:
      return await import('./wasm/rynk_wasm.js')
    default:
      throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}

/// Full connect flow: probe version → load version-matched wasm → init → connect.
/// The `link` is wrapped in a `ProbeLink` that buffers framing for the probe,
/// then delegates to the underlying link for wasm's `connect()`.
export async function connectClient(link: JsByteLink, label?: string) {
  const probe = new ProbeLink(link)
  const { major, minor } = await probe.probeVersion()
  const core = await loadCore(major)
  await core.default()
  const client = await core.connect(probe, label ?? null)
  return { client, major, minor }
}

/// Re-export all wasm types for end-to-end type safety.
export type * from './wasm/rynk_wasm.js'
