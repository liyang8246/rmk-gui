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
</script>

<template>
  <template v-for="i, index in keyboardStore.keyMacros[pageMacrosStore.currMacro]" :key="index">
    <div class="flex h-16 w-full px-4 items-center justify-between gap-3 rounded-prime-md bg-surface-200 dark:bg-surface-900 ">
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
            class="w-full innerText"
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
            <KeyMapMappingKey :key-value="keyToConfig(Number(keyCode))" />
          </template>
          <div class="">
            添加按钮
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
