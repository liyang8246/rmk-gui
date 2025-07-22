<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageKeymapStore = usePageKeymapStore()

const keyBoardKeySize = 30
function labelToDisplay(
  keys: InstanceType<typeof KleKey>,
  layer: number,
): [string | null, string | null] {
  const [row, col] = keys.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  pageKeymapStore.getMaxSize(keys.x!, keys.y!, keys.rotation_x!, keys.rotation_y!)
  return keyboardStore.indexToDisplay([layer, row!, col!])
}

function setKeycode(zone: 'outer' | 'inner', key: [number, number, number, string | null, string | null]) {
  pageKeymapStore.currKey = [...key, zone]
}
</script>

<template>
  <div
    class="rounded-prime-md relative h-96 w-full overflow-hidden bg-black"
    :style="{
      maxWidth: `${(pageKeymapStore.maxx + 2) * keyBoardKeySize}px`,
      maxHeight: `${(pageKeymapStore.maxy + 2) * keyBoardKeySize}px`,
    }"
  >
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
          :select="pageKeymapStore.currKey"
          :default-key-size="keyBoardKeySize"
          @click="setKeycode"
        />
      </div>
    </template>
  </div>
</template>
