import type { DeviceCapabilities } from '../rynk'

/// One `Action::User(id)` the firmware gives a wireless meaning.
export interface WirelessKey {
  id: number
  label: string
  /// Second, smaller line on a cap and in the picker.
  sub?: string
  title: string
}

/// The firmware's `process_user` ladder: ids `0..profiles` switch to that BLE
/// profile, and these fixed actions stack on top at the offsets it checks. The
/// whole ladder shifts with `num_ble_profiles`, so no id here may be a constant.
const FIXED = [
  { label: 'BT Next', title: 'Next BLE profile' },
  { label: 'BT Prev', title: 'Previous BLE profile' },
  { label: 'BT Clr', title: 'Clear the bond on the current BLE profile' },
  { label: 'Out Tgl', title: 'Toggle the preferred output between USB and BLE' },
  { label: 'Peer Clr', sub: 'hold 5s', splitOnly: true, title: 'Hold 5s to clear the split peer bond' },
  {
    label: 'Dongle',
    sub: 'hold 5s',
    title: 'Switch to the dongle bond slot; hold 5s to clear it and pair with another dongle',
  },
] as const satisfies readonly { label: string, sub?: string, splitOnly?: true, title: string }[]

/// The wireless keys this device can be given, in ladder order. Empty without
/// BLE: every one of them is behind the firmware's `_ble` feature.
export function wirelessKeys(caps: DeviceCapabilities | undefined): WirelessKey[] {
  if (!caps?.ble_enabled) return []
  const profiles = caps.num_ble_profiles
  return [
    ...Array.from({ length: profiles }, (_, slot) => ({
      id: slot,
      label: `BT ${slot}`,
      title: `Switch to BLE profile ${slot}`,
    })),
    ...FIXED.flatMap((f, at) =>
      'splitOnly' in f && !caps.is_split
        ? []
        : [{ id: profiles + at, label: f.label, sub: 'sub' in f ? f.sub : undefined, title: f.title }],
    ),
  ]
}

/// What `User(id)` means on this device, or null when the ladder does not reach
/// it — a keymap can hold a `User` id the firmware ignores.
export function wirelessKey(id: number, caps: DeviceCapabilities | undefined): WirelessKey | null {
  return wirelessKeys(caps).find(k => k.id === id) ?? null
}

/// The bond slot the firmware reserves for a dongle, or null on a build with no
/// BLE. `BleStatus.profile` reports it while the keyboard is relaying through a
/// dongle, and it is the one slot `SwitchBleProfile`/`ClearBleProfile` refuse —
/// the firmware bounds those on `num_ble_profiles`.
export function dongleSlot(caps: DeviceCapabilities | undefined): number | null {
  return caps?.ble_enabled ? caps.num_ble_profiles : null
}
