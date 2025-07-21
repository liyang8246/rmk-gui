<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageKeymapStore = usePageKeymapStore()

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
  <template
    v-for="keys in keyboardStore.kleDefinition?.keys"
    :key="keys"
  >
    <div
      class="rounded-prime-md absolute z-10 cursor-pointer select-none text-center text-xs font-bold"
      :style="{
        top: `${keys.y * 56}px`,
        left: `${keys.x * 56}px`,
        transform: `rotate(${keys.rotation_angle}deg)`,
        transformOrigin: `calc((-${keys.x} + ${keys.rotation_x}) * 56px)` + `calc((-${keys.y} + ${keys.rotation_y}) * 56px)`,
      }"
    >
      <KeyMapKey
        :keys="labelToDisplay(keys, pageKeymapStore.currLayer)"
        :kle-props="keys"
        :select="pageKeymapStore.currKey"
        @click="setKeycode"
      />
    </div>
  </template>
</template>
