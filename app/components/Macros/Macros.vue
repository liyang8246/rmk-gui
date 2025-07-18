<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

function addMacro() {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.push(fromMacroCode(MacroCode.Text))
}
function saveMacro() {
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1 w-full">
    <MacrosList />
    <div class="flex justify-start items-start h-12 w-full  gap-1">
      <span class="rounded-prime-md bg-surface-300 py-1 px-2 cursor-pointer" @click="addMacro()">add</span>
      <span class="rounded-prime-md bg-surface-300 py-1 px-2 cursor-pointer" @click="saveMacro()">save</span>
    </div>
    <div>{{ keyboardStore.keyMacros[pageMacrosStore.currMacro] }}</div>
  </div>
</template>
