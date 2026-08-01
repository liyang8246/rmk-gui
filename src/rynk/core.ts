export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
  readonly label: string
}

const GET_VERSION = 0x0001

/// A device can open the port and then never answer. Without a deadline the
/// probe parks forever and leaves the store stuck in `connecting`.
const PROBE_TIMEOUT_MS = 10_000

/// Each zero-free run is prefixed by its length + 1; 0x00 delimits frames.
export function cobsEncode(data: Uint8Array): Uint8Array {
  const out = [0]
  let codeIdx = 0
  let code = 1
  for (const b of data) {
    if (b === 0) {
      out[codeIdx] = code
      codeIdx = out.push(0) - 1
      code = 1
    }
    else {
      out.push(b)
      code++
      // A full 0xFF block closes with no implicit zero; decode mirrors this.
      if (code === 0xFF) {
        out[codeIdx] = code
        codeIdx = out.push(0) - 1
        code = 1
      }
    }
  }
  out[codeIdx] = code
  out.push(0)
  return new Uint8Array(out)
}

/// `frame` must exclude the trailing delimiter, else a spurious zero is appended.
export function cobsDecode(frame: Uint8Array): Uint8Array {
  const out: number[] = []
  let i = 0
  while (i < frame.length) {
    const code = frame[i++]!
    if (code === 0) break
    for (let j = 1; j < code && i < frame.length; j++) out.push(frame[i++]!)
    if (code < 0xFF && i < frame.length) out.push(0)
  }
  return new Uint8Array(out)
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

/// `toKeyboardError` keys off the name, so a silent device reads as a dead link
/// rather than an unknown fault.
function transportError(message: string): Error {
  const e = new Error(message)
  e.name = 'TransportError'
  return e
}

/// Frame: cmd=0x0001 LE, seq=1, empty payload; reply payload is [status, major, minor].
export async function probeVersion(link: JsByteLink, timeoutMs = PROBE_TIMEOUT_MS) {
  await link.send(cobsEncode(new Uint8Array([GET_VERSION & 0xFF, GET_VERSION >> 8, 1])))
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_res, rej) => {
    timer = setTimeout(() => rej(transportError('version probe timed out')), timeoutMs)
  })
  // The race usually resolves first; keep the loser from surfacing as an
  // unhandled rejection.
  deadline.catch(() => {})
  try {
    let rx: Uint8Array = new Uint8Array(0)
    for (;;) {
      const delim = rx.indexOf(0)
      if (delim === -1) {
        const chunk = await Promise.race([link.recv(), deadline])
        if (!chunk.length) throw transportError('link closed')
        rx = concat(rx, chunk)
        continue
      }
      const frame = cobsDecode(rx.subarray(0, delim))
      rx = rx.subarray(delim + 1)
      // Topic pushes can interleave; keep reading until the GetVersion reply lands.
      if (frame.length >= 6 && frame[0] === (GET_VERSION & 0xFF) && frame[1] === GET_VERSION >> 8)
        return { major: frame[4]!, minor: frame[5]! }
    }
  }
  finally {
    clearTimeout(timer)
  }
}

async function loadCore(major: number) {
  switch (major) {
    case 0: case 1: return await import('./wasm/rynk_wasm.js')
    default: throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}

/// `wasm` overrides where the module is fetched from. The browser default
/// resolves it next to the JS glue, which Node's fetch cannot do (file: URL).
export async function connectClient(link: JsByteLink, wasm?: BufferSource, timeoutMs?: number) {
  const { major, minor } = await probeVersion(link, timeoutMs)
  const core = await loadCore(major)
  await core.default(wasm ? { module_or_path: wasm } : undefined)
  const client = await core.connect(link)
  return { client, major, minor }
}

export type * from './wasm/rynk_wasm.js'
