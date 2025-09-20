<script lang="ts" setup>
const { keys, keySize = 64 } = defineProps<{
  keys: Key[]
  highlight?: StringSet<[[number, number], 'outer' | 'inner']>
  keySize?: number
}>()

const emit = defineEmits<{
  (e: 'click', key: Key, zone: 'outer' | 'inner'): void
}>()

const keyPadding = computed(() => keySize * 0.065) // Magic Keyboard`s margin ratio

function getKeyCorners(key: Key) {
  const { x, y, width, height, x2, y2, width2, height2, rotation_x, rotation_y, rotation_angle } = key.geometry
  const corners: [number, number][] = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
    [x + x2, y + y2],
    [x + x2 + width2, y + y2],
    [x + x2, y + y2 + height2],
    [x + x2 + width2, y + y2 + height2],
  ]

  const rotate = (x: number, y: number, cx: number, cy: number, angle: number): [number, number] => {
    const rad = -angle * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return [
      cos * (x - cx) + sin * (y - cy) + cx,
      cos * (y - cy) - sin * (x - cx) + cy,
    ]
  }

  return corners.map(([px, py]) => rotate(px, py, rotation_x, rotation_y, rotation_angle))
}

const kbdSize = computed(() => {
  const size = { width: 0, height: 0 }
  keys.forEach((key) => {
    const corners = getKeyCorners(key)
    size.width = Math.max(size.width, ...corners.map(c => c[0] * keySize))
    size.height = Math.max(size.height, ...corners.map(c => c[1] * keySize))
  })
  return { width: `${size.width}px`, height: `${size.height}px` }
})
</script>

<template>
  <div
    class="relative" :style="kbdSize"
  >
    <key
      v-for="key in keys" :key="`${key}`" :key-info="key" :size="keySize" :padding="keyPadding" :style="{
        position: 'absolute',
        top: `${key.geometry.y * keySize}px`,
        left: `${key.geometry.x * keySize}px`,
        transform: `rotate(${key.geometry.rotation_angle}deg)`,
        transformOrigin: `calc(${(key.geometry.rotation_x - key.geometry.x) * keySize}px)` + `calc(${(key.geometry.rotation_y - key.geometry.y) * keySize}px)`,
      }"
      @click="(e) => emit('click', key, e)"
    />
  </div>
</template>
