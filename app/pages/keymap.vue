<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const currLayer = ref(0)
const currLayerStr = computed({
  get: () => currLayer.value.toString(),
  set: (value) => {
    currLayer.value = Number.parseInt(value)
  },
})
const currKey = ref<[[number, number], 'outer' | 'inner'] | null>(null)
const keys = computed(() => keyboardStore.fetchKeyList(currLayer.value))
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

function selectNext() {
  for (let col = currKey.value![0][1] + 1; col < keyboardStore.vialJson!.matrix.cols!; col++) {
    if (keyboardStore.layoutKeymap!.has([currLayer.value, currKey.value![0][0], col])) {
      currKey.value = [[currKey.value![0][0], col], 'outer']
      return
    }
  }
  for (let r = currKey.value![0][0] + 1; r < keyboardStore.vialJson!.matrix.rows! + currKey.value![0][0]; r++) {
    const row = r % keyboardStore.vialJson!.matrix.rows!
    for (let col = 0; col < keyboardStore.vialJson!.matrix.cols!; col++) {
      if (keyboardStore.layoutKeymap!.has([currLayer.value, row, col])) {
        currKey.value = [[row, col], 'outer']
        return
      }
    }
  }
}

function handleSetKey(key: Key) {
  if (!currKey.value) {
    return
  }
  const currKeyPos: [number, number, number] = [currLayer.value, ...currKey.value![0]]
  let code = key.info.code

  if (currKey.value[1] === 'inner') {
    const currKeyCode = keyboardStore.layoutKeymap!.get(currKeyPos)!
    code = (currKeyCode & 0xFF00) + key.info.code
  }
  keyboardStore.setKeycode(currKeyPos, code)
  keyboardStore.layoutKeymap!.set(currKeyPos, code)
  selectNext()
}
</script>

<template>
  <div class="size-full p-3">
    <div class="flex h-full flex-col items-center justify-between">
      <div class="flex w-full justify-start">
        <SelectButton v-model="currLayerStr" :allow-empty="false" :options="layerOption" size="small" />
      </div>
      <div class="overflow-hidden">
        <Keyboard :keys="keys" :highlight="highlight" @click="handleSelected" />
      </div>
      <MapperPanel @set-key="handleSetKey" />
    </div>
  </div>
</template>
