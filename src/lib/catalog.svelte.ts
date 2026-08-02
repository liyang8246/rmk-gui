import type { HidKeyCode } from '../rynk'
import type { HidTable } from './hid-table'
import { keycodeTables } from '../rynk'
import { EMPTY_HID_TABLE, hidTable } from './hid-table'

/// The firmware's own keycode table, fetched once from the wasm core. The
/// picker stays empty until it lands rather than offering a guessed list.
class CatalogState {
  hid = $state.raw<readonly HidKeyCode[]>([])
  table = $state.raw<HidTable>(EMPTY_HID_TABLE)

  async load() {
    if (this.hid.length) return
    const { hid, hidValues } = await keycodeTables()
    this.hid = hid
    this.table = hidTable(hid, hidValues)
  }
}

export const catalog = new CatalogState()
