<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

function addMacro() {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.push(fromMacroCode(MacroCode.Text))
}
function saveMacro() {
}

const replaceMacroKey = ref<[string | null, string | null]>([null, null])
function setKeycode(key: [string | null, string | null]) {
  replaceMacroKey.value = key

  // 替换键后清空操作
  pageMacrosStore.clearSelectedProps()
  replaceMacroKey.value = [null, null]
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
    <div class="flex justify-start items-start h-10 w-full gap-3 select-none">
      <MacrosButton label="add" @click="addMacro()" />
      <MacrosButton label="save" @click="saveMacro()" />
    </div>
  </div>

  <MapperDialog :show="pageMacrosStore.showMapperPanel" @clear-currkey="pageMacrosStore.clearSelectedProps()" @set-keycode="setKeycode" />
</template>
