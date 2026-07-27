import type { Component } from 'solid-js'
import type { Variant } from '~/rynk'
import { createMemo, createSignal, For } from 'solid-js'
import { kbdStore } from '~/store'
import Keycap from './Keycap'

const KEY_UNIT = 64

const Keyboard: Component = () => {
  const [selected, setSelected] = createSignal<string | null>(null)

  const variant = createMemo<Variant | null>(() => {
    const layout = kbdStore.device?.layout
    if (!layout || layout.variants.length === 0) return null
    const idx = Math.min(layout.default_variant, layout.variants.length - 1)
    return layout.variants[idx]
  })

  const keyId = (row: number, col: number) => `${row},${col}`

  // AABB of the whole layout in key-units, including rect2 + rotation.
  // Rotation pivots at the key's own center (matches CSS transform-origin: center),
  // rect2 swings with the whole key rather than its own center.
  const bounds = createMemo(() => {
    const keys = variant()?.keys ?? []
    if (keys.length === 0) return { minX: 0, minY: 0, w: 0, h: 0 }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const k of keys) {
      const r = k.rect
      const cx = r.x
      const cy = r.y
      const pts = [
        [r.x - r.w / 2, r.y - r.h / 2],
        [r.x + r.w / 2, r.y - r.h / 2],
        [r.x - r.w / 2, r.y + r.h / 2],
        [r.x + r.w / 2, r.y + r.h / 2],
      ]
      if (k.rect2) {
        const r2 = k.rect2
        pts.push(
          [r2.x - r2.w / 2, r2.y - r2.h / 2],
          [r2.x + r2.w / 2, r2.y - r2.h / 2],
          [r2.x - r2.w / 2, r2.y + r2.h / 2],
          [r2.x + r2.w / 2, r2.y + r2.h / 2],
        )
      }
      const rad = (k.r * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      for (const [px, py] of pts) {
        const dx = px - cx
        const dy = py - cy
        const rx = cx + dx * cos - dy * sin
        const ry = cy + dx * sin + dy * cos
        if (rx < minX) minX = rx
        if (ry < minY) minY = ry
        if (rx > maxX) maxX = rx
        if (ry > maxY) maxY = ry
      }
    }
    return { minX, minY, w: (maxX - minX) * KEY_UNIT, h: (maxY - minY) * KEY_UNIT }
  })

  return (
    <div
      class="relative mx-auto my-0"
      style={{ width: `${bounds().w}px`, height: `${bounds().h}px` }}
      onPointerDown={() => setSelected(null)}
    >
      <For each={variant()?.keys ?? []}>
        {(key) => {
          const r = key.rect
          const b = bounds()
          const left = (r.x - r.w / 2 - b.minX) * KEY_UNIT
          const top = (r.y - r.h / 2 - b.minY) * KEY_UNIT
          const id = keyId(key.row, key.col)
          return (
            <Keycap
              key={key}
              selected={selected() === id}
              onSelect={(row, col) => setSelected(keyId(row, col))}
              style={{
                'position': 'absolute',
                'left': `${left}px`,
                'top': `${top}px`,
                'transform': `rotate(${key.r}deg)`,
                'transform-origin': 'center',
              }}
            />
          )
        }}
      </For>
    </div>
  )
}

export default Keyboard
