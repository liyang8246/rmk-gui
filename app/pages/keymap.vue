<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const currLayer = ref('0')
const currKey = ref<[[number, number], 'outer' | 'inner'] | null>(null)
const keys = computed(() => keyboardStore.fetchKeyList(Number.parseInt(currLayer.value)))
const layerOption = Array.from({ length: keyboardStore.layerCount! }, (_, i) => i.toString())

const highlight = computed(() => {
  const map = new StringMap<[number, number], 'outer' | 'inner'>()
  currKey.value && map.set(currKey.value[0], currKey.value[1])
  return map
})

function handleSelected(key: Key, zone: 'outer' | 'inner') {
  const [row, col] = [key.position.row, key.position.col]
  const isCurr = currKey.value?.[0][0] === row && currKey.value?.[0][1] === col
  currKey.value = isCurr ? null : [[row, col], zone]
}

function handleSetKey(key: Key) {
  if (!currKey.value) {
    return
  }
  const currKeyPos: [number, number, number] = [Number.parseInt(currLayer.value), ...currKey.value![0]]
  if (currKey.value[1] === 'outer') {
    keyboardStore.setKeycode(currKeyPos, key.info.code)
  }
  else {
    const currKeyCode = keyboardStore.layoutKeymap!.get(currKeyPos)!
    keyboardStore.setKeycode(currKeyPos, (currKeyCode & 0xFF00) + key.info.code)
  }
}
</script>

<template>
  <div class="p-3">
    <SelectButton v-model="currLayer" :allow-empty="false" :options="layerOption" size="small" />
    <div class="flex h-full flex-col items-center justify-around">
      <Keyboard :keys="keys" :highlight="highlight" @click="handleSelected" />
      <MapperPanel @set-key="handleSetKey" />
    </div>
  </div>
</template>
