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

  return (
    <div
      class="relative"
      style={{ width: '100%', height: '100%' }}
      onPointerDown={() => setSelected(null)}
    >
      <For each={variant()?.keys ?? []}>
        {(key) => {
          const r = key.rect
          const left = (r.x - r.w / 2) * KEY_UNIT
          const top = (r.y - r.h / 2) * KEY_UNIT
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
