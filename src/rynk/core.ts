/// Byte link contract that wasm's WasmTransport calls into.
export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
}

/// Frame: cmd=0x0001 LE, seq=1, len=0, reply [0x00, major, minor].
async function probeVersion(link: JsByteLink) {
  await link.send(new Uint8Array([1, 0, 1, 0, 0]))
  const buf: number[] = []
  while (buf.length < 8) {
    const c = await link.recv()
    if (!c.length) throw new Error('link closed')
    buf.push(...c)
  }
  return { major: buf[6], minor: buf[7] }
}

async function loadCore(major: number) {
  switch (major) {
    case 0: case 1: return await import('./wasm/rynk_wasm.js')
    default: throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}

export async function connectClient(link: JsByteLink, label?: string) {
  const { major, minor } = await probeVersion(link)
  const core = await loadCore(major)
  await core.default()
  const client = await core.connect(link, label ?? null)
  return { client, major, minor }
}

export type * from './wasm/rynk_wasm.js'
