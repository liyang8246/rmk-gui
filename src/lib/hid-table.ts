import type { HidKeyCode } from '../rynk'

/// Names and wire bytes, resolvable both ways. Macros address a key by its
/// byte; everything else in the app addresses it by name.
export interface HidTable {
  byValue: (value: number) => HidKeyCode | undefined
  byCode: (code: HidKeyCode) => number | undefined
}

export const EMPTY_HID_TABLE: HidTable = { byValue: () => undefined, byCode: () => undefined }

/// `names` and `values` come out of the wasm core index-for-index.
export function hidTable(names: readonly HidKeyCode[], values: Uint8Array): HidTable {
  const byValue = new Map<number, HidKeyCode>()
  const byCode = new Map<HidKeyCode, number>()
  names.forEach((code, i) => {
    const value = values[i]
    if (value === undefined) return
    byValue.set(value, code)
    byCode.set(code, value)
  })
  return { byValue: v => byValue.get(v), byCode: c => byCode.get(c) }
}
