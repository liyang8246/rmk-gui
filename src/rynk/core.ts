// rynk-wasm bootstrap: version probe, multi-major wasm loading, and connect.

/// JS byte link contract that wasm's `WasmTransport` calls into.
/// Both `TauriByteLink` and `WebByteLink` satisfy this structurally.
export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
}

/// Read the device's protocol version before loading wasm.
/// Frame: cmd=0x0001 LE, seq=1, len=0 → reply payload [0x00, major, minor].
async function probeVersion(link: JsByteLink) {
  await link.send(new Uint8Array([1, 0, 1, 0, 0]))
  let buf: number[] = []
  while (buf.length < 8) {
    const c = await link.recv()
    if (!c.length) throw new Error('link closed')
    buf.push(...c)
  }
  return { major: buf[6], minor: buf[7] }
}

/// Load the wasm module matching the device's protocol major.
/// Today only major 0/1, both served by the same build; future majors get their own case.
async function loadCore(major: number) {
  switch (major) {
    case 0: case 1: return await import('./wasm/rynk_wasm.js')
    default: throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}

/// Full connect flow: probe version → load wasm → init → connect.
export async function connectClient(link: JsByteLink, label?: string) {
  const { major, minor } = await probeVersion(link)
  const core = await loadCore(major)
  await core.default()
  const client = await core.connect(link, label ?? null)
  return { client, major, minor }
}

/// Re-export all wasm types for end-to-end type safety.
export type * from './wasm/rynk_wasm.js'
