<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

const addList: MacroAction[] = [
  { type: 0, name: 'Tap', keyCodes: [] },
  { type: 2, name: 'Down', keyCodes: [] },
  { type: 3, name: 'Up', keyCodes: [] },
  { type: 4, name: 'Delay', delay: null },
  { type: 9, name: 'Text', text: null },
]

function setMapperKeycode(key: number) {
  if (!keyCodeMap[key]) {
    throw new Error('Keycode not found')
  }
  if (!keyboardStore.keyMacros) {
    throw new Error('keyMacros not found')
  }

  const [layer, col, row, zone] = pageMacrosStore.currKey

  if (zone === 'outer') {
    keyboardStore.keyMacros[layer]![col]!.keyCodes![row]! = structuredClone(keyCodeMap[key].symbol)
  }
  else if (zone === 'inner') {
    keyboardStore.keyMacros[layer]![col]!.keyCodes![row]![1]! = structuredClone(keyCodeMap[key].symbol[1]!)
  }

  pageMacrosStore.clearSelectedProps()
}
</script>

<template>
  <div
    class="flex size-full flex-auto flex-col items-center justify-around gap-3 overflow-hidden text-surface-500 dark:text-surface-400"
    @click="pageMacrosStore.clearSelectedProps()"
  >
    <div class="flex w-full items-start justify-start p-3 pb-0">
      <Switcher text="Marco" :count="keyboardStore.macroCount!" :layer="pageMacrosStore.currMacro" @change="pageMacrosStore.currMacro = $event" />
    </div>
    <div class="rounded-prime-md flex size-full items-start justify-start gap-6 overflow-hidden p-3 transition-all duration-200">
      <VueDraggable
        v-model="addList"
        :animation="150"
        :group="{ name: 'people', pull: 'clone', put: false }"
        :sort="false"
        class="rounded-prime-md flex flex-col gap-2"
      >
        <div
          v-for="item in addList"
          :key="item.type"
          class="rounded-prime-md cursor-move bg-surface-0 p-3 text-surface-500 shadow-sm  dark:bg-surface-600 dark:text-surface-300"
        >
          {{ item.name }}
        </div>
      </VueDraggable>
      <div class="rounded-prime-md relative flex size-full flex-col gap-3 overflow-hidden p-2">
        <div class="rounded-prime-md relative h-[calc(100%-60px)] w-full bg-surface-0 p-2 shadow-sm dark:bg-surface-600">
          <ScrollPanel class="size-full" pt:content:class="!p-0 !w-full !h-full">
            <MacrosList />
          </ScrollPanel>
        </div>

        <div class="flex h-12 w-full items-center justify-start gap-3">
          <button v-ripple class="rounded-prime-md h-10 w-24 border-0 bg-surface-0 px-3 py-2 text-surface-700 hover:text-surface-500 dark:bg-surface-600 dark:text-surface-300" @click="keyboardStore.keyMacros![pageMacrosStore.currMacro]?.push({ type: 9, name: 'Text', text: null })">
            add text
          </button>
          <button v-ripple class="rounded-prime-md h-10 w-24 border-0 bg-surface-0 px-3 py-2 text-surface-700 hover:text-surface-500 dark:bg-surface-600 dark:text-surface-300" @click="keyboardStore.keyMacros![pageMacrosStore.currMacro] = []">
            clean all
          </button>
        </div>
      </div>
    </div>
  </div>
  <MapperDialog :show="pageMacrosStore.showMapperPanel" @clear-currkey="pageMacrosStore.clearSelectedProps()" @set-keycode="setMapperKeycode" />
</template>
