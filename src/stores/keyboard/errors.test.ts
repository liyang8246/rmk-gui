import { describe, expect, it } from 'vitest'
import { describeKeyboardError, RYNK_ERROR_CODES, toKeyboardError } from './errors'

function named(name: string, message: string): Error {
  const e = new Error(message)
  e.name = name
  return e
}

describe('toKeyboardError', () => {
  it('maps every rynk rejection code, including Busy', () => {
    // Read off the source of truth: a new upstream variant lands here, not in a
    // literal that silently goes stale.
    const codes = Object.keys(RYNK_ERROR_CODES)
    expect(codes).toContain('Busy')
    for (const code of codes) {
      expect(toKeyboardError(named('Rejected', `device rejected ${code}`)))
        .toEqual({ type: 'rynk', code })
    }
  })

  it('maps a bare code in the message', () => {
    expect(toKeyboardError(new Error('Locked'))).toEqual({ type: 'rynk', code: 'Locked' })
  })

  it('maps link death to transport', () => {
    expect(toKeyboardError(new Error('link closed')).type).toBe('transport')
    expect(toKeyboardError(named('Disconnected', 'gone')).type).toBe('transport')
    expect(toKeyboardError(named('TransportError', 'io')).type).toBe('transport')
  })

  it('falls back to unknown', () => {
    expect(toKeyboardError(named('Rejected', 'device rejected Nonsense')).type).toBe('unknown')
    expect(toKeyboardError('a string').type).toBe('unknown')
    expect(toKeyboardError(new Error('something else')).type).toBe('unknown')
  })
})

describe('describeKeyboardError', () => {
  it('names the rejection code', () => {
    expect(describeKeyboardError({ type: 'rynk', code: 'Locked' })).toBe('device rejected Locked')
  })

  it('describes the non-rynk variants', () => {
    expect(describeKeyboardError({ type: 'transport', cause: new Error('x') })).toBe('link lost')
    expect(describeKeyboardError({ type: 'invalid', cause: 'not connected' })).toBe('not connected')
    expect(describeKeyboardError({ type: 'unknown', cause: new Error('boom') })).toBe('boom')
    expect(describeKeyboardError({ type: 'unknown', cause: 42 })).toBe('unknown error')
  })
})
