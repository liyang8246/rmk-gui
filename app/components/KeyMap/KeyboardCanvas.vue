<script lang="ts" setup>
const { keyBoardKeySize = 42, keyBoardKeys, layer = 0, keyBoardKeysMap } = defineProps<{
  keyBoardKeySize?: number
  keyBoardKeys: InstanceType<typeof KleKey>[]
  keyBoardKeysMap: Map<string, number> | null
  layer?: number
}>()
const emit = defineEmits<{
  (e: 'selectKeycode', key: InstanceType<typeof KleKey>): 'outer' | 'inner' | null
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
  return {
    max_x: keys[keys!.length - 1]!.x!,
    max_y: keys[keys!.length - 1]!.y!,
    min_x: keys[0]!.x!,
    min_y: keys[0]!.y!,
    last_width: keys[keys!.length - 1]!.width!,
    last_height: keys[keys!.length - 1]!.height!,
  }
})
const width = computed(() => {
  return `${(position.value.max_x + position.value.min_x + position.value.last_width) * keyBoardKeySize}px`
})
const height = computed(() => {
  return `${(position.value.max_y + position.value.min_y + position.value.last_height) * keyBoardKeySize}px`
})
</script>

<template>
  <div class="rounded-prime-md relative h-full w-full overflow-hidden" :style="{ width, height }">
    <template
      v-for="keys in keyBoardKeys"
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
          :keys="labelToDisplay(keys, layer)"
          :kle-props="keys"
          :select="emit('selectKeycode', keys)"
          :default-key-size="keyBoardKeySize"
          :key-margin="keyBoardKeySize / 8"
          @click="emit('setKeycode', $event, keys)"
        />
      </div>
    </template>
  </div>
</template>
