import { describe, expect, it } from 'vitest'
import { decodeMacros, encodedSize, encodeMacros, macroBytesUsed, printableAscii } from './macro-codec'

/// Byte vectors lifted from rmk's own `keyboard_macros.rs` tests, so these
/// assert against the firmware's wire format rather than against ourselves.
/// `0xE1` is LShift, `0x13` P, `0x04` A, `0x17` T, `0x0B` H, `0x08` E, `0x0F` L,
/// `0x12` O; `0x48 0x69` is the ASCII text "Hi".
const SHIFT_PAT = [
  0x01,
  0x02,
  0xE1,
  0x01,
  0x01,
  0x13,
  0x01,
  0x03,
  0xE1,
  0x01,
  0x01,
  0x04,
  0x01,
  0x01,
  0x17,
  0x00,
]

function pad(bytes: number[], size: number): number[] {
  return [...bytes, ...Array.from<number>({ length: size - bytes.length }).fill(0)]
}

describe('decodeMacros', () => {
  it('reads the firmware\'s press/tap/release encoding', () => {
    const [first] = decodeMacros(pad(SHIFT_PAT, 64), 1)
    expect(first).toEqual([
      { kind: 'press', code: 0xE1 },
      { kind: 'tap', code: 0x13 },
      { kind: 'release', code: 0xE1 },
      { kind: 'tap', code: 0x04 },
      { kind: 'tap', code: 0x17 },
    ])
  })

  it('coalesces a run of ASCII into one text step', () => {
    const [first, second] = decodeMacros(pad([0x48, 0x69, 0x00, ...SHIFT_PAT], 64), 2)
    expect(first).toEqual([{ kind: 'text', value: 'Hi' }])
    expect(second).toHaveLength(5)
  })

  it('unpacks the 1-based delay pair', () => {
    // 0x01 0x04 0x65 0x01 is rmk's own vector for a 100ms delay.
    const [first] = decodeMacros(pad([0x01, 0x04, 0x65, 0x01, 0x00], 16), 1)
    expect(first).toEqual([{ kind: 'delay', ms: 100 }])
  })

  it('pads out to the slot count and keeps empty slots empty', () => {
    const macros = decodeMacros(pad([0x48, 0x00], 32), 4)
    expect(macros).toHaveLength(4)
    expect(macros.slice(1)).toEqual([[], [], []])
  })

  it('refuses a sequence it cannot represent instead of half-reading it', () => {
    // 0x01 0x05 is the extended 16-bit keycode form, which has no editable shape.
    const [first, second] = decodeMacros(pad([0x01, 0x05, 0x7E, 0xFF, 0x00, 0x48, 0x00], 32), 2)
    expect(first).toBeNull()
    expect(second).toEqual([{ kind: 'text', value: 'H' }])
  })
})

describe('macroBytesUsed', () => {
  it('counts through the final terminator, not the padding', () => {
    expect(macroBytesUsed(pad([0x48, 0x69, 0x00], 64))).toBe(3)
    expect(macroBytesUsed(Array.from<number>({ length: 64 }).fill(0))).toBe(0)
  })
})

describe('encodeMacros', () => {
  it('reproduces the firmware\'s bytes for the same steps', () => {
    const region = encodeMacros([[
      { kind: 'press', code: 0xE1 },
      { kind: 'tap', code: 0x13 },
      { kind: 'release', code: 0xE1 },
      { kind: 'tap', code: 0x04 },
      { kind: 'tap', code: 0x17 },
    ]], 64)
    expect(region).toEqual(pad(SHIFT_PAT, 64))
  })

  it('packs a delay the way the firmware unpacks it', () => {
    expect(encodeMacros([[{ kind: 'delay', ms: 100 }]], 16))
      .toEqual(pad([0x01, 0x04, 0x65, 0x01, 0x00], 16))
  })

  it('round-trips delays across the packed range', () => {
    for (const ms of [0, 1, 50, 254, 255, 1000, 65024]) {
      const region = encodeMacros([[{ kind: 'delay', ms }]], 32)!
      expect(decodeMacros(region, 1)[0], `${ms}ms`).toEqual([{ kind: 'delay', ms }])
    }
  })

  it('refuses to truncate when the slots do not fit', () => {
    expect(encodeMacros([[{ kind: 'text', value: 'far too long' }]], 8)).toBeNull()
  })

  it('sizes a region by its steps plus one terminator each', () => {
    expect(encodedSize([[{ kind: 'text', value: 'Hi' }], []])).toBe(4)
  })
})

describe('printableAscii', () => {
  it('drops the terminator and the operation prefix, which the wire reserves', () => {
    expect(printableAscii('a\u0000b\u0001c')).toBe('abc')
  })

  it('drops control characters and anything past ASCII', () => {
    expect(printableAscii('a\nb\te\u00E9\u{1F600}')).toBe('abe')
  })

  it('keeps every printable character, space included', () => {
    expect(printableAscii('Best, regards!')).toBe('Best, regards!')
  })
})
