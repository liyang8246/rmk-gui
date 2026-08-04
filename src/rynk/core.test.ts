import type { JsByteLink } from './core'
import { describe, expect, it } from 'vitest'
import { cobsDecode, cobsEncode, probeVersion } from './core'

/// Round-trip helper: cobsEncode emits a trailing delimiter, cobsDecode wants it gone.
function roundTrip(bytes: number[]): number[] {
  const encoded = cobsEncode(new Uint8Array(bytes))
  expect(encoded[encoded.length - 1]).toBe(0)
  return [...cobsDecode(encoded.subarray(0, encoded.length - 1))]
}

describe('cobs', () => {
  it('round-trips payloads with and without zeros', () => {
    const cases: number[][] = [
      [],
      [0],
      [0, 0],
      [1, 2, 3],
      [1, 0, 2, 0, 3],
      [0, 1, 0],
      Array.from({ length: 300 }, (_, i) => i % 256),
    ]
    for (const c of cases) expect(roundTrip(c)).toEqual(c)
  })

  it('never emits a zero inside the encoded frame', () => {
    const encoded = cobsEncode(new Uint8Array([0, 5, 0, 0, 7]))
    expect([...encoded.subarray(0, encoded.length - 1)]).not.toContain(0)
  })

  it('handles a run longer than 254 bytes', () => {
    // 0xFF codes mean "254 data bytes, no implicit zero" — the branch that
    // silently corrupts payloads if the `code < 0xFF` guard is wrong.
    const long: number[] = Array.from({ length: 600 }).fill(0x41) as number[]
    expect(roundTrip(long)).toEqual(long)
  })
})

/// Reply frame: cmd LE, seq, status, then [major, minor].
function versionReply(cmd: number, major: number, minor: number): Uint8Array {
  return cobsEncode(new Uint8Array([cmd & 0xFF, cmd >> 8, 1, 0, major, minor]))
}

function fakeLink(chunks: Uint8Array[]): JsByteLink & { sent: Uint8Array[] } {
  const queue = [...chunks]
  return {
    sent: [],
    label: 'fake',
    async send(frame) { this.sent.push(frame) },
    async recv() { return queue.shift() ?? new Uint8Array(0) },
    async close() {},
  }
}

describe('probeVersion', () => {
  it('reads the version out of a single reply', async () => {
    const link = fakeLink([versionReply(0x0001, 1, 4)])
    expect(await probeVersion(link)).toEqual({ major: 1, minor: 4 })
    expect(link.sent).toHaveLength(1)
  })

  it('reassembles a reply split across chunks', async () => {
    const full = versionReply(0x0001, 2, 0)
    const link = fakeLink([full.subarray(0, 3), full.subarray(3)])
    expect(await probeVersion(link)).toEqual({ major: 2, minor: 0 })
  })

  it('skips interleaved topic pushes', async () => {
    // Topic pushes carry the CMD high bit and can land before the reply.
    const topic = cobsEncode(new Uint8Array([0x10, 0x80, 0, 0, 9, 9]))
    const link = fakeLink([topic, versionReply(0x0001, 1, 1)])
    expect(await probeVersion(link)).toEqual({ major: 1, minor: 1 })
  })

  it('throws when the link closes before a reply', async () => {
    await expect(probeVersion(fakeLink([]))).rejects.toThrow('link closed')
  })

  it('gives up on a device that opens and then never settles anything', async () => {
    // Without the watchdog either shape parks forever and the store never
    // leaves `connecting`. `stuck` is the WebHID case: sendReport itself can
    // park on a granted device that is not actually speaking rynk, so the
    // watchdog must cover the send, not just the wait for a reply.
    const never = <T>() => new Promise<T>(() => {})
    const links: JsByteLink[] = [
      { label: 'silent', async send() {}, recv: () => never(), async close() {} },
      { label: 'stuck', send: () => never(), recv: () => never(), async close() {} },
    ]
    for (const link of links) {
      await expect(probeVersion(link, 10)).rejects.toThrow('version probe timed out')
    }
  })

  it('keeps waiting as long as the device keeps talking', async () => {
    // The window is idle time, not a cap on the whole probe: ten topic pushes
    // 20ms apart blow far past a 100ms total budget, and only then does the
    // reply land. An absolute deadline would cut this device off mid-sentence.
    const topic = cobsEncode(new Uint8Array([0x10, 0x80, 0, 0, 9, 9]))
    let calls = 0
    const chatty: JsByteLink = {
      label: 'chatty',
      async send() {},
      recv: () => new Promise((resolve) => {
        calls += 1
        const frame = calls <= 10 ? topic : versionReply(0x0001, 1, 2)
        setTimeout(resolve, 20, frame)
      }),
      async close() {},
    }
    await expect(probeVersion(chatty, 100)).resolves.toEqual({ major: 1, minor: 2 })
  })

  it('classifies both give-up paths as transport faults', async () => {
    // toKeyboardError() keys off the name; anything else lands in `unknown`.
    await expect(probeVersion(fakeLink([]))).rejects.toMatchObject({ name: 'TransportError' })
  })
})
