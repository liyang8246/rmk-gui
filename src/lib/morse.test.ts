import { describe, expect, it } from 'vitest'
import { decodePattern, DOUBLE_TAP, encodePattern, HOLD, HOLD_AFTER_TAP, patternName, TAP } from './morse'

describe('morse pattern codec', () => {
  // The wire constants are the protocol's own encodings (rmk-types morse.rs).
  it('decodes the named wire encodings', () => {
    expect(decodePattern(TAP)).toEqual(['tap'])
    expect(decodePattern(HOLD)).toEqual(['hold'])
    expect(decodePattern(DOUBLE_TAP)).toEqual(['tap', 'tap'])
    expect(decodePattern(HOLD_AFTER_TAP)).toEqual(['tap', 'hold'])
  })

  it('decodes empty', () => {
    expect(decodePattern(0b1)).toEqual([])
  })

  it('encodes back to the same wire value', () => {
    for (const pattern of [0b1, TAP, HOLD, DOUBLE_TAP, HOLD_AFTER_TAP, 0b110101, 0b1111111111111111]) {
      expect(encodePattern(decodePattern(pattern))).toBe(pattern)
    }
  })

  it('keeps step order: first step is emitted first', () => {
    // tap-then-hold is 0b101: marker, then 0 (tap), then 1 (hold).
    expect(encodePattern(['tap', 'hold'])).toBe(0b101)
    expect(encodePattern(['hold', 'tap'])).toBe(0b110)
  })

  it('names the common patterns, spells out the rest', () => {
    expect(patternName(TAP)).toBe('Tap')
    expect(patternName(HOLD_AFTER_TAP)).toBe('Tap, hold')
    expect(patternName(0b110)).toBe('hold, tap')
  })
})
