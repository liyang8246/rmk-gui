import type { DeviceCapabilities } from '../rynk'
import { describe, expect, it } from 'vitest'
import { dongleSlot, wirelessKey, wirelessKeys } from './wireless-keys'

/// The firmware's own default is 3 profiles; the ladder must not depend on it,
/// so every test that cares states the count it is asserting against.
function caps(over: Partial<DeviceCapabilities> = {}): DeviceCapabilities {
  return { ble_enabled: true, num_ble_profiles: 3, is_split: false, ...over } as DeviceCapabilities
}

describe('wirelessKeys', () => {
  it('lays the ladder out the way `process_user` reads it', () => {
    // Default nRF build: `User8` is the dongle key, which is what the firmware's
    // own nrf_dongle example binds on its central.
    expect(wirelessKeys(caps()).map(k => [k.id, k.label])).toEqual([
      [0, 'BT 0'],
      [1, 'BT 1'],
      [2, 'BT 2'],
      [3, 'BT Next'],
      [4, 'BT Prev'],
      [5, 'BT Clr'],
      [6, 'Out Tgl'],
      [8, 'Dongle'],
    ])
  })

  it('shifts every fixed action with the profile count', () => {
    // The firmware compares against `NUM_BLE_PROFILE`, so a board configured
    // for one profile puts the dongle key on `User6`, not `User8`.
    expect(wirelessKey(6, caps({ num_ble_profiles: 1 }))?.label).toBe('Dongle')
    expect(wirelessKey(8, caps({ num_ble_profiles: 1 }))).toBeNull()
  })

  it('offers the peer-clear key only to a split', () => {
    expect(wirelessKeys(caps()).map(k => k.id)).not.toContain(7)
    expect(wirelessKey(7, caps({ is_split: true }))?.label).toBe('Peer Clr')
  })

  it('offers nothing on a build without BLE', () => {
    // The whole ladder sits behind the firmware's `_ble` feature.
    expect(wirelessKeys(caps({ ble_enabled: false }))).toEqual([])
    expect(wirelessKeys(undefined)).toEqual([])
  })

  it('marks the two keys that need a 5s hold', () => {
    const held = wirelessKeys(caps({ is_split: true })).filter(k => k.sub === 'hold 5s')
    expect(held.map(k => k.label)).toEqual(['Peer Clr', 'Dongle'])
  })
})

describe('dongleSlot', () => {
  it('sits directly above the host profiles', () => {
    // `BOND_SLOTS = NUM_BLE_PROFILE + 1` on a dongle build, and the extra slot
    // is the last one — which is also the index `BleStatus.profile` reports.
    expect(dongleSlot(caps())).toBe(3)
    expect(dongleSlot(caps({ num_ble_profiles: 5 }))).toBe(5)
  })

  it('does not exist without BLE', () => {
    expect(dongleSlot(caps({ ble_enabled: false }))).toBeNull()
    expect(dongleSlot(undefined)).toBeNull()
  })
})
