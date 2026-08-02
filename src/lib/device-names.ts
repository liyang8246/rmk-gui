const STORAGE_KEY = 'rmk-device-names'

type Names = Record<string, string>

function key(vendorId: number, productId: number): string {
  return `${vendorId}:${productId}`
}

function read(): Names {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Names
  }
  catch {
    return {}
  }
}

/// Web Serial reports a port's USB ids and nothing else — no product string, no
/// serial number. The keyboard does report its name over the protocol, and its
/// `vendor_id`/`product_id` are the descriptor's own, so a name learned on one
/// connection labels the same port on the next.
export function rememberDeviceName(vendorId: number, productId: number, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  const names = read()
  if (names[key(vendorId, productId)] === trimmed) return
  names[key(vendorId, productId)] = trimmed
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
}

export function rememberedDeviceName(vendorId: number, productId: number): string | undefined {
  return read()[key(vendorId, productId)]
}
