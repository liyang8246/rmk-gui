<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
const keyboardStore = useKeyboardStore()

const keyBoardKeySize = ref(42)

const replaceKey = ref<[string | null, string | null]>([null, null])
function setKeycode(key: [string | null, string | null]) {
  replaceKey.value = key

  // 替换后清空操作
  replaceKey.value = [null, null]
}
</script>

<template>
  <div class="flex flex-col justify-start items-center w-full h-full">
    <div class="flex flex-col items-center justify-start w-full h-full" @click="pageKeymapStore.clearSelectedProps()">
      <div class="flex w-full items-center justify-start gap-3 pb-3">
        <Switcher text="Layer" :count="keyboardStore.layerCount!" :layer="pageKeymapStore.currLayer" @change="pageKeymapStore.currLayer = $event" />
        <div class="rounded-prime-xl card flex items-center justify-center h-5 bg-surface-200 dark:bg-surface-700 shadow-sm shadow-surface-400 dark:shadow-surface-950 px-[10px]">
          <Slider v-model="keyBoardKeySize" class="w-40 !h-2" :min="30" :max="78" :step="1" />
        </div>
      </div>
      <div class="h-full w-full flex justify-center items-start">
        <KeyMapKeyboardCanvas :key-board-key-size="keyBoardKeySize" />
      </div>
    </div>
    <div class="rounded-prime-md p-3 bg-surface-0 dark:bg-surface-950 overflow-hidden w-full h-full">
      <div class="rounded-prime-md overflow-hidden w-full h-full">
        <MapperPanel @set-keycode="setKeycode" />
      </div>
    </div>
  </div>
</template>
