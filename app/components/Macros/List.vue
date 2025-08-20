<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

function delMacro(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]!.splice(index, 1)
}
function addKeyCode(index: number) {
  keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.keyCodes!.push(keyCodeMap[1]!.symbol)
}
function setKeycode(zone: 'outer' | 'inner', row: number, col: number) {
  pageMacrosStore.currKey = [pageMacrosStore.currMacro, row, col, zone]
  pageMacrosStore.showMapperPanel = true
}
function selectKeycode(row: number, col: number) {
  return pageMacrosStore.currKey[1] === row && pageMacrosStore.currKey[2] === col ? pageMacrosStore.currKey[3] : null
}
</script>

<template>
  <VueDraggable
    v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]!"
    :animation="150"
    group="people"
    handle=".handle"
    class="rounded-prime-md flex min-h-full w-full flex-col gap-2 p-1"
  >
    <div
      v-for="i, index in keyboardStore.keyMacros[pageMacrosStore.currMacro]!"
      :key="i.type"
      class="  rounded-prime-md flex min-h-14 w-full items-center justify-between gap-3 bg-surface-200 px-2 dark:bg-surface-900"
    >
      <div class="w-42 flex h-full items-center justify-start gap-2">
        <span class=" handle size-8 cursor-move"><i class="pi pi-sort-alt size-4 p-2 text-2xl" /></span>
        <MacrosSelect :index="index" />
      </div>
      <div class=" size-full overflow-hidden">
        <div v-if="(i as { text: string | null }).text !== undefined" class=" flex size-full items-center justify-start gap-2">
          <InputText
            v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.text"
            variant="filled"
            class="h-8 w-full"
            type="text"
          />
        </div>
        <div v-else-if="(i as { delay: number | null }).delay !== undefined" class=" flex size-full items-center justify-start gap-2">
          <InputNumber
            v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.delay"
            suffix=" ms"
            variant="filled"
            type="number"
          />
        </div>
        <div v-else class=" relative m-1 flex size-full items-center justify-start gap-2">
          <template v-for="(keyCode, keyCodes_index) in keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.keyCodes" :key="keyCodes_index">
            <KeyMapKey
              :keys="keyCode"
              :select="selectKeycode(index, keyCodes_index)"
              :default-key-size="42"
              @click="setKeycode($event, index, keyCodes_index)"
            />
          </template>
          <div
            class="rounded-prime-md flex size-8 items-center justify-center bg-surface-300 shadow-sm transition-all duration-200 hover:text-surface-700 hover:shadow-surface-400 dark:bg-surface-600 dark:hover:text-surface-300 dark:hover:shadow-surface-900"
            @click="addKeyCode(index)"
          >
            <i class="pi pi-plus size-4 text-2xl" />
          </div>
        </div>
      </div>
      <span
        class="rounded-prime-md flex size-6 cursor-pointer items-center justify-center p-4 transition-colors duration-200 hover:text-surface-400"
        @click="delMacro(index)"
      >
        <i class="pi pi-times size-4 text-2xl" />
      </span>
    </div>
  </VueDraggable>
</template>
