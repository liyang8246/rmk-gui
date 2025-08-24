<script lang="ts" setup>
const { keyBoardKeySize = 42, keyBoardKeys, layer = 0, keyBoardKeysMap, keyBoardMaxSize, selectKeycodeHandler } = defineProps<{
  keyBoardKeySize?: number
  keyBoardKeys: InstanceType<typeof KleKey>[]
  keyBoardKeysMap: Map<string, number> | null
  keyBoardMaxSize?: ReturnType<typeof useElementSize>
  layer?: number
  selectKeycodeHandler?: (key: InstanceType<typeof KleKey>) => 'outer' | 'inner' | null
}>()
const emit = defineEmits<{
  (e: 'setKeycode', zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>): void
}>()

function indexToDisplay(index: [number, number, number]): [string | null, string | null] {
  if (!keyBoardKeysMap) {
    throw new Error('Layout keymap not available')
  }
  const keyValue = keyBoardKeysMap.get(index.toString())
  if (keyValue === undefined) {
    throw new Error(`Keymap value for index ${index.toString()} not found`)
  }
  return keyToLable(keyValue)
}

function labelToDisplay(
  key: InstanceType<typeof KleKey>,
  layer: number,
): [string | null, string | null] {
  const [row, col] = key.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  return indexToDisplay([layer, row!, col!])
}

const position = computed(() => {
  if (!keyBoardKeys) {
    throw new Error('No KLE definition')
  }
  const keys = keyBoardKeys
  let maxX = 0
  let maxY = 0
  let minX = Infinity
  let minY = Infinity
  for (let i = 0; i < keys.length; i++) {
    maxX = Math.max(keys[i]!.x, maxX)
    maxY = Math.max(keys[i]!.y, maxY)
    minX = Math.min(keys[i]!.x, minX)
    minY = Math.min(keys[i]!.y, minY)
  }
  const lastWidth = keys[keys.findIndex(key => key.x === maxX)]!.width
  const lastHeight = keys[keys.findIndex(key => key.y === maxY)]!.height
  return {
    maxX,
    maxY,
    minX,
    minY,
    lastWidth,
    lastHeight,
  }
})

const computedSizes = computed(() => {
  const hasMaxSize = !!keyBoardMaxSize
  const totalWidth = position.value.maxX + position.value.minX + position.value.lastWidth
  const totalHeight = position.value.maxY + position.value.minY + position.value.lastHeight

  let maxSize = keyBoardKeySize
  let calculatedSize = keyBoardKeySize

  if (hasMaxSize) {
    const maxHeight = Math.round(keyBoardMaxSize!.height.value * 0.7 - 56)
    maxSize = Math.min(
      Math.round(keyBoardMaxSize!.width.value / totalWidth),
      Math.round(maxHeight / totalHeight),
    )
    calculatedSize = (totalWidth * keyBoardKeySize + 2) > keyBoardMaxSize!.width.value
      || (totalHeight * keyBoardKeySize + 2) > maxHeight
      ? maxSize
      : keyBoardKeySize
  }

  return {
    maxSize,
    calculatedSize,
    width: `${totalWidth * calculatedSize + 2}px`,
    height: `${totalHeight * calculatedSize + 2}px`,
  }
})

const computedKeySize = computed(() => computedSizes.value.calculatedSize)
const width = computed(() => computedSizes.value.width)
const height = computed(() => computedSizes.value.height)

function getSelectValue(key: InstanceType<typeof KleKey>): 'outer' | 'inner' | null {
  if (selectKeycodeHandler) {
    return selectKeycodeHandler(key)
  }
  return null
}
</script>

<template>
  <div class="rounded-prime-md relative overflow-hidden" :style="{ width, height }">
    <template
      v-for="keys in keyBoardKeys"
      :key="keys"
    >
      <div
        class="rounded-prime-md absolute z-10 "
        :style="{
          top: `${keys.y * computedKeySize + 2}px`,
          left: `${keys.x * computedKeySize + 2}px`,
          transform: `rotate(${keys.rotation_angle}deg)`,
          transformOrigin: `calc(${(-keys.x + keys.rotation_x) * computedKeySize}px)` + `calc(${(-keys.y + keys.rotation_y) * computedKeySize}px)`,
        }"
      >
        <KeyMapKey
          :keys="labelToDisplay(keys, layer)"
          :kle-props="keys"
          :select="getSelectValue(keys)"
          :default-key-size="computedKeySize"
          :key-margin="computedKeySize / 8"
          @click="emit('setKeycode', $event, keys)"
        />
      </div>
    </template>
  </div>
</template>
