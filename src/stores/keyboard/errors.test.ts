import { describe, expect, it } from 'vitest'
import { describeKeyboardError, explainKeyboardError, RYNK_ERROR_CODES, toKeyboardError } from './errors'

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

describe('explainKeyboardError', () => {
  it('reads a probe timeout as a keyboard that never answered', () => {
    // Both deadlines say 'timed out': the version probe and the open guard.
    for (const message of ['version probe timed out', 'connect timed out']) {
      const help = explainKeyboardError(toKeyboardError(named('TransportError', message)))
      expect(help.title).toBe('The keyboard didn’t respond')
      expect(help.hint).toContain('RMK firmware')
    }
  })

  it('reads a mid-session death as a lost connection', () => {
    const help = explainKeyboardError({ type: 'transport', cause: new Error('link closed') })
    expect(help.title).toBe('Connection lost')
  })

  it('reads the open failures every stack reports as a busy device', () => {
    // Web Serial and WebHID fail an occupied open with a DOMException name;
    // the native serial and BLE stacks say busy/denied in prose.
    const causes = [
      named('NetworkError', 'Failed to open serial port.'),
      named('InvalidStateError', 'The port is already open.'),
      named('NotAllowedError', 'Failed to open the device.'),
      new Error('Resource busy'),
      new Error('Access denied'),
    ]
    for (const cause of causes) {
      const help = explainKeyboardError(toKeyboardError(cause))
      expect(help.title).toBe('Couldn’t open the device')
      expect(help.hint).toContain('Another app')
    }
  })

  it('falls back to the raw message as the hint', () => {
    const help = explainKeyboardError({ type: 'unknown', cause: new Error('boom') })
    expect(help).toEqual({ title: 'Connection failed', hint: 'boom' })
    expect(explainKeyboardError({ type: 'unknown', cause: 42 })).toEqual({ title: 'Connection failed' })
  })

  it('names the rejection code in the hint', () => {
    const help = explainKeyboardError({ type: 'rynk', code: 'Locked' })
    expect(help.hint).toContain('Locked')
  })
})
