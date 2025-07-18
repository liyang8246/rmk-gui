<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()
function delMacro(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.splice(index, 1)
}
</script>

<template>
  <template v-for="i, index in keyboardStore.keyMacros[pageMacrosStore.currMacro]" :key="index">
    <div class="flex h-16 w-full px-4 items-center justify-between rounded-prime-md bg-surface-400">
      <div class="flex items-center justify-start gap-2 w-full h-full">
        <span><i class="pi pi-caret-up w-4 h-4 text-2xl" /></span>
        <span><i class="pi pi-caret-down w-4 h-4 text-2xl" /></span>
        <MacrosSelect :index="index" />
        <div v-if="i.name === 'Text'" class=" w-full h-full flex items-center justify-start gap-2">
          <input v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.text" class="w-full" type="text">
        </div>
        <div v-else-if="i.name === 'Delay'" class=" w-full h-full flex items-center justify-start gap-2">
          <input v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.delay" class="w-20" type="number">
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
        class="rounded-prime-md pl-4 w-6 h-6 flex justify-center items-center cursor-pointer transition-colors duration-200 hover:text-surface-400"
        @click="delMacro(index)"
      ><i class="pi pi-times w-4 h-4 text-2xl" /></span>
    </div>
  </template>
</template>
