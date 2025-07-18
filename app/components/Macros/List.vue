<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()
function delMacro(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.splice(index, 1)
}
</script>

<template>
  <template v-for="i, index in keyboardStore.keyMacros[pageMacrosStore.currMacro]" :key="index">
    <div class="flex h-12 w-full px-4 items-center justify-between rounded-prime-md bg-surface-300">
      <div class="flex items-center justify-start gap-2 w-full h-full">
        <span><i class="pi pi-caret-up w-4 h-4 text-2xl" /></span>
        <span><i class="pi pi-caret-down w-4 h-4 text-2xl" /></span>
        <MacrosSelect :index="index" />
        <div v-if="i.name === 'Text'" class=" w-full h-full flex items-center justify-start gap-2">
          {{ i }}{{ keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.text }}
          <input v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.text" class="w-full" type="text">
        </div>
        <div v-else-if="i.name === 'Delay'">
          {{ i }}三种情况(delay)
        </div>
        <div v-else>
          {{ i }}三种情况(up,down,tap)
        </div>
      </div>
      <span
        class="rounded-prime-md w-6 h-6 flex justify-center items-center cursor-pointer transition-colors duration-200 hover:text-surface-400"
        @click="delMacro(index)"
      ><i class="pi pi-times w-4 h-4 text-2xl" /></span>
    </div>
  </template>
</template>
