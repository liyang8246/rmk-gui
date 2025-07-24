<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()
function delMacro(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.splice(index, 1)
}
function swapUpMacro(index: number) {
  if (index === 0)
    return
  const macros = keyboardStore.keyMacros[pageMacrosStore.currMacro]!
  const temp = { ...macros[index] } as MacroAction
  macros[index] = { ...macros[index - 1] } as MacroAction
  macros[index - 1] = temp
}
function swapDownMacro(index: number) {
  if (index === keyboardStore.keyMacros[pageMacrosStore.currMacro]!.length - 1)
    return
  const macros = keyboardStore.keyMacros[pageMacrosStore.currMacro]!
  const temp = { ...macros[index] } as MacroAction
  macros[index] = { ...macros[index + 1] } as MacroAction
  macros[index + 1] = temp
}
function addKeyCode(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.keyCodes!.push(keyCodeMap[1]!)
}
function setKeycode(zone: 'outer' | 'inner', key: [number, number, number]) {
  pageMacrosStore.currKey = [...key, zone]
  pageMacrosStore.showMapperPanel = true
}
</script>

<template>
  <template v-for="i, index in keyboardStore.keyMacros[pageMacrosStore.currMacro]" :key="index">
    <div class="rounded-prime-md flex h-14 w-full px-4 items-center justify-between gap-3 bg-surface-200 dark:bg-surface-900 ">
      <div class="flex items-center justify-start gap-3 w-48 h-full">
        <span class=" w-8 h-8" @click="swapUpMacro(index)"><i class="pi pi-angle-double-up w-4 h-4 p-2 text-2xl" /></span>
        <span class=" w-8 h-8" @click="swapDownMacro(index)"><i class="pi pi-angle-double-down w-4 h-4 p-2 text-2xl" /></span>
        <MacrosSelect :index="index" />
      </div>
      <div class=" w-full h-full overflow-hidden">
        <div v-if="(i as { text: string | null }).text !== undefined" class=" w-full h-full flex items-center justify-start gap-2">
          <InputText
            v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.text"
            variant="filled"
            class="w-full h-8"
            type="text"
          />
        </div>
        <div v-else-if="(i as { delay: number | null }).delay !== undefined" class=" w-full h-full flex items-center justify-start gap-2">
          <InputNumber
            v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.delay"
            suffix=" ms"
            variant="filled"
            type="number"
          />
        </div>
        <div v-else class=" w-full h-full flex items-center justify-start gap-2">
          <template v-for="(keyCode, keyCodes_index) in keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.keyCodes" :key="keyCodes_index">
            <KeyMapKey
              :keys="keyCode.symbol"
              :kle-props="{
                width: 0.8,
                height: 0.8,
                width2: 0.8,
                height2: 0.8,
                labels: [`${index},${keyCodes_index}`] }"
              :select="pageMacrosStore.currKey"
              :layer="pageMacrosStore.currMacro"
              @click="setKeycode"
            />
          </template>
          <div
            class="rounded-prime-md h-8 w-8 bg-surface-300 dark:bg-surface-600 shadow-sm hover:shadow-surface-400 dark:hover:shadow-surface-900 hover:text-surface-700 dark:hover:text-surface-300 transition-all duration-200 flex justify-center items-center"
            @click="addKeyCode(index)"
          >
            <i class="pi pi-plus w-4 h-4 text-2xl" />
          </div>
        </div>
      </div>
      <span
        class="rounded-prime-md p-4 w-6 h-6 flex justify-center items-center cursor-pointer transition-colors duration-200 hover:text-surface-400"
        @click="delMacro(index)"
      ><i class="pi pi-times w-4 h-4 text-2xl" /></span>
    </div>
  </template>
</template>
