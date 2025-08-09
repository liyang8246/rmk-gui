<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const keyBoardKeySize = ref(42)

const currLayer = ref(0)
const currKey = ref<[number, number, number, 'outer' | 'inner' | null]>([0, 0, 0, null])

function clearSelectedProps() {
  currKey.value = [0, 0, 0, null]
}
function selectKeycode(key: InstanceType<typeof KleKey>) {
  const [row, col] = key.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
  return currKey.value[1] === row && currKey.value[2] === col ? currKey.value[3] : null
}
function setKeyBoardKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  currKey.value = [currLayer.value, ...key.labels[0]?.split(',').map(n => Number.parseInt(n, 10)) as [number, number], zone]
}

function getNextKeyValue(): [number, number, number] {
  if (!keyboardStore.kleDefinition?.keys) {
    throw new Error('kle Definition not available')
  }
  if (!keyboardStore.keymap) {
    throw new Error('keymap not available')
  }

  const currentKey = currKey.value.slice(0, 3).toString()

  const entries = Array.from(keyboardStore.keymap.entries()).filter(key => Number(key[0].split(',')[0]) === currLayer.value && keyboardStore.kleDefinition?.keys.findIndex(keys => [currLayer.value, keys.labels[0]].join(',') === key[0]) !== -1)
  const currentIndex = entries.findIndex(key => key[0] === currentKey)

  let nextIndex = currentIndex + 1
  if (currentIndex !== -1 && currentIndex < entries.length - 1) {
    nextIndex = currentIndex + 1
  }
  else {
    nextIndex = 0
  }
  return entries[nextIndex]![0].split(',').map(n => Number.parseInt(n, 10)) as [number, number, number]
}

async function setMapperKeycode(key: number) {
  if (!keyboardStore.keymap) {
    throw new Error('keymap not available')
  }
  if (currKey.value[3] === null) {
    return
  }

  let finalKeycode = key
  if (currKey.value[3] === 'outer') {
    await keyboardStore.setKeycode(currKey.value.slice(0, 3) as [number, number, number], finalKeycode)
  }
  else if (currKey.value[3] === 'inner') {
    const outer = keyboardStore.keymap!.get(currKey.value.slice(0, 3).toString())! & 0xFF00
    finalKeycode = outer + key
    await keyboardStore.setKeycode(currKey.value.slice(0, 3) as [number, number, number], finalKeycode)
  }

  // 页面优化操作
  keyboardStore.keymap.set(currKey.value.slice(0, 3).toString(), finalKeycode)
  currKey.value = [...getNextKeyValue(), 'outer']
}
</script>

<template>
  <div class="flex flex-col justify-start items-center w-full h-full p-3">
    <div class="flex flex-col items-center justify-start w-full h-full" @click="clearSelectedProps()">
      <div class="flex w-full items-center justify-start gap-3">
        <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="currLayer" @change="currLayer = $event" />
        <div class="rounded-prime-xl card flex items-center justify-center h-5 bg-surface-200 dark:bg-surface-700 shadow-sm shadow-surface-400 dark:shadow-surface-950 px-[10px]">
          <Slider v-model="keyBoardKeySize" class="w-40 !h-2" :min="30" :max="78" :step="1" />
        </div>
      </div>
      <div class="h-full w-full flex justify-center items-start">
        <KeyMapKeyboardCanvas
          :key-board-key-size="keyBoardKeySize"
          :key-board-keys="keyboardStore.kleDefinition?.keys!"
          :layer="currLayer"
          :key-board-keys-map="keyboardStore.keymap"
          :select-keycode-handler="selectKeycode"
          @set-keycode="setKeyBoardKeycode"
        />
      </div>
    </div>
    <div class="rounded-prime-md p-3 bg-surface-0 dark:bg-surface-900 overflow-hidden w-full h-full border border-surface-300 dark:border-surface-600">
      <div class="rounded-prime-md overflow-hidden w-full h-full">
        <MapperPanel :area="currKey[3]" @set-keycode="setMapperKeycode" />
      </div>
    </div>
  </div>
</template>
