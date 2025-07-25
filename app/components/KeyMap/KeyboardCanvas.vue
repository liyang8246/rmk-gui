<script lang="ts" setup>
const { keyBoardKeySize = 42 } = defineProps<{
  keyBoardKeySize?: number
}>()
const keyboardStore = useKeyboardStore()
const pageKeymapStore = usePageKeymapStore()

function labelToDisplay(
  key: InstanceType<typeof KleKey>,
  layer: number,
): [string | null, string | null] {
  const [row, col] = key.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  pageKeymapStore.getPosition(key)
  return keyboardStore.indexToDisplay([layer, row!, col!])
}

function selectKeycode(key: InstanceType<typeof KleKey>) {
  const [row, col] = key.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  return pageKeymapStore.currKey[1] === row && pageKeymapStore.currKey[2] === col ? pageKeymapStore.currKey[3] : null
}
function setKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  pageKeymapStore.currKey = [pageKeymapStore.currLayer, ...key.labels[0]?.split(',').map(n => Number.parseInt(n, 10)) as [number, number], zone]
  pageKeymapStore.showMapperPanel = true
}

const maxWidth = computed(() => {
  return `${(pageKeymapStore.position.max_x + pageKeymapStore.position.min_x + pageKeymapStore.position.last_width) * keyBoardKeySize}px`
})
const maxHeight = computed(() => {
  return `${(pageKeymapStore.position.max_y + pageKeymapStore.position.min_y + pageKeymapStore.position.last_height) * keyBoardKeySize}px`
})
</script>

<template>
  <div class="rounded-prime-md relative h-full w-full overflow-hidden" :style="{ maxWidth, maxHeight }">
    <template
      v-for="keys in keyboardStore.kleDefinition?.keys"
      :key="keys"
    >
      <div
        class="rounded-prime-md absolute z-10 "
        :style="{
          top: `${keys.y * keyBoardKeySize}px`,
          left: `${keys.x * keyBoardKeySize}px`,
          transform: `rotate(${keys.rotation_angle}deg)`,
          transformOrigin: `calc(${(-keys.x + keys.rotation_x) * keyBoardKeySize}px)` + `calc(${(-keys.y + keys.rotation_y) * keyBoardKeySize}px)`,
        }"
      >
        <KeyMapKey
          :keys="labelToDisplay(keys, pageKeymapStore.currLayer)"
          :kle-props="keys"
          :select="selectKeycode(keys)"
          :default-key-size="keyBoardKeySize"
          :key-margin="keyBoardKeySize / 8"
          @click="setKeycode($event, keys)"
        />
      </div>
    </template>
  </div>
</template>
