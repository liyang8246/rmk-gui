import { describe, expect, it } from 'vitest'
import { toKeyboardError } from './errors'

function named(name: string, message: string): Error {
  const e = new Error(message)
  e.name = name
  return e
}

describe('toKeyboardError', () => {
  it('maps every rynk rejection code, including Busy', () => {
    const codes = [
      'Busy',
      'Internal',
      'Invalid',
      'Locked',
      'Malformed',
      'NotReady',
      'StorageFault',
      'Unimplemented',
      'UnknownCmd',
    ]
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
