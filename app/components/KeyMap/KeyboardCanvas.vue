<script lang="ts" setup>
const { keyBoardKeySize = 42, keyBoardKeys, layer = 0, keyBoardKeysMap, selectKeycodeHandler } = defineProps<{
  keyBoardKeySize?: number
  keyBoardKeys: InstanceType<typeof KleKey>[]
  keyBoardKeysMap: Map<string, number> | null
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
  let max_x = 0
  let max_y = 0
  let min_x = Infinity
  let min_y = Infinity
  for (let i = 0; i < keys.length; i++) {
    max_x = Math.max(keys[i]!.x, max_x)
    max_y = Math.max(keys[i]!.y, max_y)
    min_x = Math.min(keys[i]!.x, min_x)
    min_y = Math.min(keys[i]!.y, min_y)
  }
  const last_width = keys[keys.findIndex(key => key.x === max_x)]!.width
  const last_height = keys[keys.findIndex(key => key.y === max_y)]!.height
  return {
    max_x,
    max_y,
    min_x,
    min_y,
    last_width,
    last_height,
  }
})
const width = computed(() => {
  return `${(position.value.max_x + position.value.min_x + position.value.last_width) * keyBoardKeySize + 2}px`
})
const height = computed(() => {
  return `${(position.value.max_y + position.value.min_y + position.value.last_height) * keyBoardKeySize + 2}px`
})

function getSelectValue(key: InstanceType<typeof KleKey>): 'outer' | 'inner' | null {
  if (selectKeycodeHandler) {
    return selectKeycodeHandler(key)
  }
  return null
}
</script>

<template>
  <div class="rounded-prime-md relative size-full overflow-hidden" :style="{ width, height }">
    <template
      v-for="keys in keyBoardKeys"
      :key="keys"
    >
      <div
        class="rounded-prime-md absolute z-10 "
        :style="{
          top: `${keys.y * keyBoardKeySize + 2}px`,
          left: `${keys.x * keyBoardKeySize + 2}px`,
          transform: `rotate(${keys.rotation_angle}deg)`,
          transformOrigin: `calc(${(-keys.x + keys.rotation_x) * keyBoardKeySize}px)` + `calc(${(-keys.y + keys.rotation_y) * keyBoardKeySize}px)`,
        }"
      >
        <KeyMapKey
          :keys="labelToDisplay(keys, layer)"
          :kle-props="keys"
          :select="getSelectValue(keys)"
          :default-key-size="keyBoardKeySize"
          :key-margin="keyBoardKeySize / 8"
          @click="emit('setKeycode', $event, keys)"
        />
      </div>
    </template>
  </div>
</template>
