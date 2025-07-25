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
  <div
    class="flex flex-col justify-around items-center flex-auto gap-3 w-full h-full text-surface-500 dark:text-surface-400 overflow-hidden"
    @click="pageMacrosStore.clearSelectedProps()"
  >
    <div class="flex justify-start items-start w-full">
      <Switcher text="Marco" :count="keyboardStore.macroCount!" :layer="pageMacrosStore.currMacro" @change="pageMacrosStore.currMacro = $event" />
    </div>
    <div class="rounded-prime-md p-3 h-full w-full overflow-hidden bg-surface-0 dark:bg-surface-950 transition-all duration-200">
      <ScrollPanel class="w-full h-full overflow-hidden">
        <Macros />
      </ScrollPanel>
    </div>
    <div class="flex justify-start items-start h-10 w-full gap-3  select-none">
      <span class="rounded-prime-md py-1 px-2 cursor-pointer bg-surface-300 dark:bg-surface-950" @click="addMacro()">add</span>
      <span class="rounded-prime-md py-1 px-2 cursor-pointer bg-surface-300 dark:bg-surface-950" @click="saveMacro()">save</span>
    </div>
  </div>

  <MapperDialog :show="pageMacrosStore.showMapperPanel" @clear-currkey="pageMacrosStore.clearSelectedProps()" />
</template>
