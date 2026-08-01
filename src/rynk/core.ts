export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
  readonly label: string
}

const GET_VERSION = 0x0001

/// Each zero-free run is prefixed by its length + 1; 0x00 delimits frames.
function cobsEncode(data: Uint8Array): Uint8Array {
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
    }
  }
  out[codeIdx] = code
  out.push(0)
  return new Uint8Array(out)
}

/// `frame` must exclude the trailing delimiter, else a spurious zero is appended.
function cobsDecode(frame: Uint8Array): Uint8Array {
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

/// Frame: cmd=0x0001 LE, seq=1, empty payload; reply payload is [status, major, minor].
async function probeVersion(link: JsByteLink) {
  await link.send(cobsEncode(new Uint8Array([GET_VERSION & 0xFF, GET_VERSION >> 8, 1])))
  let rx: Uint8Array = new Uint8Array(0)
  for (;;) {
    const delim = rx.indexOf(0)
    if (delim === -1) {
      const chunk = await link.recv()
      if (!chunk.length) throw new Error('link closed')
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

async function loadCore(major: number) {
  switch (major) {
    case 0: case 1: return await import('./wasm/rynk_wasm.js')
    default: throw new Error(`no rynk-core wasm for protocol major ${major}`)
  }
}

export async function connectClient(link: JsByteLink) {
  const { major, minor } = await probeVersion(link)
  const core = await loadCore(major)
  await core.default()
  const client = await core.connect(link)
  return { client, major, minor }
}

export type * from './wasm/rynk_wasm.js'
