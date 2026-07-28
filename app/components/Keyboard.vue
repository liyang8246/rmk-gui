<script setup lang="ts">
import type { Variant } from '~/rynk'
import { computed, ref } from 'vue'
import { useKeyboardStore } from '~/stores'

const KEY_UNIT = 64

const kbdStore = useKeyboardStore()
const selected = ref<string | null>(null)

const variant = computed<Variant | null>(() => {
  const layout = kbdStore.device?.layout
  if (!layout || layout.variants.length === 0)
    return null
  const idx = Math.min(layout.default_variant, layout.variants.length - 1)
  return layout.variants[idx]!
})

function keyId(row: number, col: number): string {
  return `${row},${col}`
}

// AABB of the whole layout in key-units, including rect2 + rotation.
// Rotation pivots at the key's own center (matches CSS transform-origin: center),
// rect2 swings with the whole key rather than its own center.
const bounds = computed(() => {
  const keys = variant.value?.keys ?? []
  if (keys.length === 0)
    return { minX: 0, minY: 0, w: 0, h: 0 }
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  const pts: [number, number][] = []
  const addRect = (rc: { x: number, y: number, w: number, h: number }) => {
    pts.push(
      [rc.x - rc.w / 2, rc.y - rc.h / 2],
      [rc.x + rc.w / 2, rc.y - rc.h / 2],
      [rc.x - rc.w / 2, rc.y + rc.h / 2],
      [rc.x + rc.w / 2, rc.y + rc.h / 2],
    )
  }
  for (const k of keys) {
    const r = k.rect
    const cx = r.x
    const cy = r.y
    pts.length = 0
    addRect(r)
    if (k.rect2)
      addRect(k.rect2)
    const rad = (k.r * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    for (const [px, py] of pts) {
      const dx = px - cx
      const dy = py - cy
      const rx = cx + dx * cos - dy * sin
      const ry = cy + dx * sin + dy * cos
      if (rx < minX)
        minX = rx
      if (ry < minY)
        minY = ry
      if (rx > maxX)
        maxX = rx
      if (ry > maxY)
        maxY = ry
    }
  }
  return { minX, minY, w: (maxX - minX) * KEY_UNIT, h: (maxY - minY) * KEY_UNIT }
})

function keyStyle(key: Variant['keys'][number]): Record<string, string> {
  const r = key.rect
  const b = bounds.value
  const left = (r.x - r.w / 2 - b.minX) * KEY_UNIT
  const top = (r.y - r.h / 2 - b.minY) * KEY_UNIT
  return {
    'width': `${r.w * KEY_UNIT}px`,
    'height': `${r.h * KEY_UNIT}px`,
    'left': `${left}px`,
    'top': `${top}px`,
    'transform': `rotate(${key.r}deg)`,
    'transform-origin': 'center',
  }
}
</script>

<template>
  <div
    class="relative mx-auto my-0"
    :style="{ width: `${bounds.w}px`, height: `${bounds.h}px` }"
    @pointerdown="selected = null"
  >
    <div
      v-for="key in variant?.keys ?? []"
      :key="`${key.row},${key.col}`"
      class="absolute cursor-pointer rounded-lg"
      :class="selected === keyId(key.row, key.col) ? 'bg-primary' : `
        bg-base-300
      `"
      :style="keyStyle(key)"
      @pointerdown.stop="selected = keyId(key.row, key.col)"
    />
  </div>
</template>
