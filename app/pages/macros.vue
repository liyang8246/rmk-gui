<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()
const replaceMacroKey = ref<number | null>(null)
function setMapperKeycode(key: number) {
  replaceMacroKey.value = key

  // 替换键后清空操作
  pageMacrosStore.clearSelectedProps()
  replaceMacroKey.value = null
}

const addList = ref<MacroAction[]>([
  {
    type: 0,
    name: 'Tap',
    keyCodes: [],
  },
  {
    type: 2,
    name: 'Down',
    keyCodes: [],
  },
  {
    type: 3,
    name: 'Up',
    keyCodes: [],
  },
  {
    type: 4,
    name: 'Delay',
    keyCodes: [],
  },
  {
    type: 9,
    name: 'Text',
    text: null,
  },
])
</script>

<template>
  <div
    class="flex flex-col justify-around items-center flex-auto gap-3 w-full h-full text-surface-500 dark:text-surface-400 overflow-hidden"
    @click="pageMacrosStore.clearSelectedProps()"
  >
    <div class="flex justify-start items-start w-full p-3 pb-0">
      <Switcher text="Marco" :count="keyboardStore.macroCount!" :layer="pageMacrosStore.currMacro" @change="pageMacrosStore.currMacro = $event" />
    </div>
    <div class="rounded-prime-md h-full w-full p-3 flex justify-start items-start gap-6 overflow-hidden transition-all duration-200">
      <VueDraggable
        v-model="addList"
        :animation="150"
        :group="{ name: 'people', pull: 'clone', put: false }"
        :sort="false"
        class="flex flex-col gap-2 rounded-prime-md"
      >
        <div
          v-for="item in addList"
          :key="item.type"
          class="cursor-move h-50px w-68px p-3 text-md text-surface-500 dark:text-surface-400 bg-surface-0 dark:bg-surface-600 rounded-prime-md shadow-sm shadow-surface-300 dark:shadow-surface-950"
        >
          {{ item.name }}
        </div>
      </VueDraggable>
      <div class="rounded-prime-md w-full h-full relative bg-surface-0 dark:bg-surface-600 overflow-hidden shadow-sm shadow-surface-300 dark:shadow-surface-950">
        <div class="h-3 bg-surface-0 dark:bg-surface-600 absolute top-0 right-0 w-3 z-50" />
        <div class="h-3 bg-surface-0 dark:bg-surface-600 absolute bottom-0 right-0 w-3 z-50" />
        <div class="rounded-prime-md p-3 pr-0 w-full h-full overflow-y-scroll scrollbar scrollbar-track-surface-0 scrollbar-thumb-surface-300 dark:scrollbar-track-surface-600 dark:scrollbar-thumb-surface-800">
          <MacrosList />
        </div>
      </div>
    </div>
  </div>
  <MapperDialog :show="pageMacrosStore.showMapperPanel" @clear-currkey="pageMacrosStore.clearSelectedProps()" @set-keycode="setMapperKeycode" />
</template>
