<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const keyBoardKeySize = ref(56)

const currLayer = ref(0)
const currKey = ref<[number, number, number, 'outer' | 'inner' | null]>([0, 0, 0, null])

const pageKeymapContainerRef = ref(null)
const keyBoardMaxSize = computed(() => {
  const pagekeymapSize = useElementSize(pageKeymapContainerRef)

  const keyBoardMaxWidth = Math.round(pagekeymapSize.width.value)
  const keyBoardMaxHeight = Math.round(pagekeymapSize.height.value * 0.7 - 56)

  return {
    width: keyBoardMaxWidth,
    height: keyBoardMaxHeight,
  }
})

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
  <div ref="pageKeymapContainerRef" class="flex size-full flex-col items-center justify-between gap-3 p-3">
    <div class="flex size-full max-h-[70%] flex-col items-center justify-start gap-3" @click="clearSelectedProps()">
      <div class="flex h-8 w-full items-center justify-start gap-3">
        <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="currLayer" @change="currLayer = $event" />
        <div class="rounded-prime-xl flex h-5 items-center justify-center bg-surface-200 px-[10px] shadow-sm shadow-surface-400 dark:bg-surface-700 dark:shadow-surface-950">
          <Slider v-model="keyBoardKeySize" class="!h-2 w-40" :min="30" :max="78" :step="1" />
        </div>
      </div>
      <div class="flex size-full items-center justify-center overflow-hidden">
        <Keyboard
          :container-max-size="keyBoardMaxSize"
          :key-board-key-size="keyBoardKeySize"
          :key-board-keys="keyboardStore.kleDefinition?.keys!"
          :layer="currLayer"
          :key-board-keys-map="keyboardStore.keymap"
          :select-keycode-handler="selectKeycode"
          @set-keycode="setKeyBoardKeycode"
        />
      </div>
    </div>
    <div class="rounded-prime-md size-full min-h-[30%] overflow-hidden border border-surface-300 bg-surface-0 p-3 dark:border-surface-600 dark:bg-surface-900">
      <div class="rounded-prime-md size-full overflow-hidden">
        <MapperPanel :area="currKey[3]" @set-keycode="setMapperKeycode" />
      </div>
    </div>
  </div>
</template>
