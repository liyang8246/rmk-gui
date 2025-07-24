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

  <Dialog v-model:visible="pageMacrosStore.showMapperPanel" header="Edit Profile" :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">Username</label>
      <InputText id="username" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex items-center gap-4 mb-8">
      <label for="email" class="font-semibold w-24">Email</label>
      <InputText id="email" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="pageMacrosStore.clearSelectedProps()" />
      <Button type="button" label="Save" @click="pageMacrosStore.clearSelectedProps()" />
    </div>
  </Dialog>
</template>
