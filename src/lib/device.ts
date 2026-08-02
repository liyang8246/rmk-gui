import type { BatteryStatus, ConnectionType } from '../rynk'
import type { KeyboardDevice, KeyboardStatus } from '../stores/keyboard/types'
import { match, P } from 'ts-pattern'
import { renderVariants } from './layout'

export interface BatteryCell {
  /// `L`/`R` on a split, empty on a single board — the design's compact label.
  label: string
  /// null when the device reports no level, which is not the same as 0%.
  level: number | null
  charging: boolean
}

function cell(label: string, battery: BatteryStatus): BatteryCell {
  return match(battery)
    .with('Unavailable', () => ({ label, level: null, charging: false }))
    .with({ Available: P.select() }, b => ({
      label,
      level: b.level ?? null,
      charging: b.charge_state === 'Charging',
    }))
    .exhaustive()
}

/// One reading per physical half. A split's peripherals report separately, so
/// the central becomes `L` and the peripherals follow it.
export function batteryCells(status: KeyboardStatus | null): BatteryCell[] {
  if (!status) return []
  const peripherals = status.peripheralStatus
  if (peripherals.length === 0) {
    const only = cell('', status.batteryStatus)
    return only.level === null ? [] : [only]
  }
  return [
    cell('L', status.batteryStatus),
    ...peripherals.map((p, i) => cell(peripherals.length > 1 ? `P${i}` : 'R', p.battery)),
  ].filter(c => c.level !== null)
}

/// Which transport the keyboard is actually typing over, or null when neither
/// is up. Mirrors the firmware's own `ConnectionStatus::decide_active`: readiness
/// decides, and `preferred` only breaks a tie. `GetConnectionType` answers with
/// `preferred` alone, so reading it reports USB on a BLE-only link.
export function activeOutput(status: KeyboardStatus | null): ConnectionType | null {
  const connection = status?.connectionStatus
  if (!connection) return null
  // Suspended USB stays routable for remote wakeup, so it counts as ready.
  const usb = connection.usb === 'Configured' || connection.usb === 'Suspended'
  const ble = connection.ble.state === 'Connected'
  if (usb && ble) return connection.preferred
  if (usb) return 'Usb'
  if (ble) return 'Ble'
  return null
}

export function outputLabel(type: ConnectionType | null): 'USB' | 'BLE' | '—' {
  if (type === null) return '—'
  return type === 'Ble' ? 'BLE' : 'USB'
}

/// Stands in for the design's "60% ANSI" line: the firmware names its render
/// variant, and a board that ships none falls back to its matrix size.
export function formFactor(device: KeyboardDevice | null): string {
  if (!device) return ''
  const variants = renderVariants(device.layout, device.capabilities)
  const name = variants[device.layout.default_variant]?.name ?? variants[0]?.name
  if (name && name !== 'Matrix') return name
  return `${device.capabilities.num_rows}×${device.capabilities.num_cols} matrix`
}

export function firmwareVersion(device: KeyboardDevice | null): string {
  const v = device?.info.rmk_version
  return v ? `v${v.major}.${v.minor}.${v.patch}` : '—'
}
