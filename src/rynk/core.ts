// rynk-wasm bootstrap: version probe, multi-major wasm loading, and connect.

const RYNK_HEADER = 5 // cmd:u16 LE, seq:u8, len:u16 LE
const RYNK_TOPIC_BIT = 0x8000 // CMD high bit: server→host topic push
const CMD_GET_VERSION = 0x0001

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

function frame(cmd: number, seq: number, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(RYNK_HEADER + body.length)
  out[0] = cmd & 0xFF
  out[1] = (cmd >> 8) & 0xFF
  out[2] = seq
  out[3] = body.length & 0xFF
  out[4] = (body.length >> 8) & 0xFF
  out.set(body, RYNK_HEADER)
  return out
}

/// JS byte link contract that wasm's `WasmTransport` calls into.
/// Both `TauriByteLink` and `WebByteLink` satisfy this structurally.
export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
}

/// Probes the device protocol version, returning `{ major, minor }` and any
/// leftover bytes buffered during the probe (to feed into the wasm link).
async function probeVersion(link: JsByteLink) {
  await link.send(frame(CMD_GET_VERSION, 1, new Uint8Array(0)))

  // Read frames until we get the GetVersion reply (skip topic pushes).
  let buf: Uint8Array = new Uint8Array(0)
  let cmd = 0
  let payload = new Uint8Array(0)
  for (;;) {
    while (buf.length < RYNK_HEADER) {
      const chunk = await link.recv()
      if (chunk.length === 0) throw new Error('link closed during version probe')
      buf = concat(buf, chunk)
    }
    const len = buf[3] | (buf[4] << 8)
    while (buf.length < RYNK_HEADER + len) {
      const chunk = await link.recv()
      if (chunk.length === 0) throw new Error('link closed during version probe')
      buf = concat(buf, chunk)
    }
    cmd = buf[0] | (buf[1] << 8)
    payload = buf.slice(RYNK_HEADER, RYNK_HEADER + len)
    buf = buf.slice(RYNK_HEADER + len)
    if (!(cmd & RYNK_TOPIC_BIT)) break
  }

  if (payload.length < 3 || payload[0] !== 0x00)
    throw new Error('bad version reply')

  return {
    major: payload[1],
    minor: payload[2],
    leftover: buf,
  }
}

/// Wraps a link + pre-buffered bytes so wasm's `connect()` sees a clean stream:
/// leftover bytes from the probe are returned first, then the real link takes over.
function makeLink(link: JsByteLink, leftover: Uint8Array): JsByteLink {
  if (leftover.length === 0) return link
  let drained = false
  return {
    async send(data) { await link.send(data) },
    async recv() {
      if (!drained) { drained = true; return leftover }
      return link.recv()
    },
    async close() { await link.close() },
  }
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
/// Leftover bytes buffered during the probe are fed into wasm's link so no data is lost.
export async function connectClient(link: JsByteLink, label?: string) {
  const { major, minor, leftover } = await probeVersion(link)
  const core = await loadCore(major)
  await core.default()
  const client = await core.connect(makeLink(link, leftover), label ?? null)
  return { client, major, minor }
}

/// Re-export all wasm types for end-to-end type safety.
export type * from './wasm/rynk_wasm.js'
