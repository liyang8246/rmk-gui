<script lang="ts" setup>
import { VueDraggable } from 'vue-draggable-plus'

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
    <div class="flex justify-start items-start w-full">
      <Switcher text="Marco" :count="keyboardStore.macroCount!" :layer="pageMacrosStore.currMacro" @change="pageMacrosStore.currMacro = $event" />
    </div>
    <div class="rounded-prime-md pt-3 h-full w-full flex justify-start items-start gap-6 overflow-hidden transition-all duration-200">
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
          class="cursor-move h-50px w-68px p-3 text-md text-surface-500 dark:text-surface-400  bg-surface-0 dark:bg-surface-600 rounded-prime-md "
        >
          {{ item.name }}
        </div>
      </VueDraggable>
      <div class="rounded-prime-md w-full h-full p-3 bg-surface-0 dark:bg-surface-600">
        <ScrollPanel class="w-full h-full overflow-hidden">
          <MacrosList />
        </ScrollPanel>
      </div>
    </div>
  </div>
  <MapperDialog :show="pageMacrosStore.showMapperPanel" @clear-currkey="pageMacrosStore.clearSelectedProps()" @set-keycode="setMapperKeycode" />
</template>
