import type { DeviceCapabilities } from '../rynk'
import { describe, expect, it } from 'vitest'
import { capLegend } from './legend'

const CAPS = { ble_enabled: true, num_ble_profiles: 3, is_split: false } as DeviceCapabilities

describe('capLegend', () => {
  it('names a User key from the device that gave it its meaning', () => {
    expect(capLegend({ Single: { User: 8 } }, CAPS)).toEqual({ main: 'Dongle', tint: 'wireless' })
    expect(capLegend({ Single: { User: 0 } }, CAPS)).toEqual({ main: 'BT 0', tint: 'wireless' })
  })

  it('keeps the bare id when the ladder cannot explain it', () => {
    // No caps to read, or an id past what this firmware does anything with —
    // either way the cap says what is stored rather than inventing a meaning.
    expect(capLegend({ Single: { User: 8 } }).main).toBe('User 8')
    expect(capLegend({ Single: { User: 42 } }, CAPS).main).toBe('User 42')
  })

  it('tints every User key as a transport key, named or not', () => {
    // They change how the board reaches a host, which is what the blue means.
    expect(capLegend({ Single: { User: 42 } }, CAPS).tint).toBe('wireless')
  })

  it('passes the device through a tap-hold to both halves', () => {
    const legend = capLegend({ TapHold: [{ Key: { Hid: 'A' } }, { User: 8 }, 200] }, CAPS)
    expect(legend).toEqual({ main: 'A', tag: 'Dongle', tint: 'wireless' })
  })
})
