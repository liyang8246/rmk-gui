import type { DeviceCapabilities, Key, LayoutInfo, Rect, Variant } from '../rynk'

/// `Key.r` turns the whole key about `rect`'s centre — `rect2` rides along — and
/// `pivot` is authoring metadata that carries no geometry. Corners come out in
/// the layout's own frame.
function corners(key: Key): [number, number][] {
  const rad = (key.r * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const { x: cx, y: cy } = key.rect

  return [key.rect, key.rect2].filter(rect => rect !== undefined).flatMap(rect => [
    [rect.x - rect.w / 2, rect.y - rect.h / 2],
    [rect.x + rect.w / 2, rect.y - rect.h / 2],
    [rect.x - rect.w / 2, rect.y + rect.h / 2],
    [rect.x + rect.w / 2, rect.y + rect.h / 2],
  ].map(([px, py]): [number, number] => {
    const dx = px! - cx
    const dy = py! - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  }))
}

/// The extent every key and knob fits inside, centre + size in key units. A
/// rotated key counts by its turned outline, so a 1u key at 45° is √2 wide —
/// sizing a board from `rect.w` alone would clip it.
export function variantBounds(variant: Variant): Rect {
  const points = [
    ...variant.keys.flatMap(corners),
    // A knob is a fixed 1u circle about its centre; it carries no angle.
    ...variant.encoders.flatMap(({ x, y }): [number, number][] => [
      [x - 0.5, y - 0.5],
      [x + 0.5, y + 0.5],
    ]),
  ]
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 }

  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY }
}

/// A firmware built without `[layout].map` answers `GetLayout` with no variants.
/// The matrix is still addressable, so fall back to its bare geometry — as a
/// real `Variant`, so nothing downstream has to know which one it got.
function matrixVariant(caps: DeviceCapabilities): Variant {
  const keys: Key[] = []
  for (let row = 0; row < caps.num_rows; row++) {
    for (let col = 0; col < caps.num_cols; col++) {
      keys.push({
        row,
        col,
        rect: { x: col + 0.5, y: row + 0.5, w: 1, h: 1 },
        r: 0,
        rect2: undefined,
        pivot: undefined,
      })
    }
  }
  return {
    name: 'Matrix',
    keys,
    encoders: Array.from({ length: caps.num_encoders }, (_, id) => ({
      id,
      x: id + 0.5,
      y: caps.num_rows + 0.5,
      pivot: undefined,
    })),
  }
}

/// What to draw: the firmware's variants, or the bare matrix when it shipped
/// none. Callers that need to say so can check `layout.variants` themselves.
export function renderVariants(
  layout: LayoutInfo | undefined,
  caps: DeviceCapabilities | undefined,
): Variant[] {
  if (!caps) return []
  return layout && layout.variants.length > 0 ? layout.variants : [matrixVariant(caps)]
}
