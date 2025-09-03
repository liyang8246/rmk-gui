<script lang="ts" setup>
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

function delMacro(index: number) {
  keyboardStore.keyMacros![pageMacrosStore.currMacro]!.splice(index, 1)
}
function addKeyCode(index: number) {
  const keyCode = structuredClone(keyCodeMap[1]!.symbol)
  keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.keyCodes!.push(keyCode)
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
    v-model="keyboardStore.keyMacros![pageMacrosStore.currMacro]!"
    :animation="150"
    group="people"
    handle=".cursor-move"
    class="rounded-prime-md flex min-h-full w-full flex-col gap-2 p-1"
  >
    <div
      v-for="i, index in keyboardStore.keyMacros![pageMacrosStore.currMacro]!"
      :key="i.type"
      class="rounded-prime-md flex min-h-14 w-full items-center justify-between gap-3 bg-surface-200 px-2 dark:bg-surface-900"
    >
      <div class="flex h-full w-40 items-center justify-start gap-2">
        <span class="flex size-8 cursor-move items-center justify-center transition-all duration-200 hover:text-surface-700 dark:hover:text-surface-300">
          <Icon name="tabler:arrows-down-up" />
        </span>
        <MacrosSelect :index="index" />
      </div>
      <div class="size-full overflow-hidden">
        <div v-if="(i as { text: string | null }).text !== undefined" class="flex size-full items-center justify-start gap-2">
          <InputText
            v-model="keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.text"
            variant="filled"
            placeholder="Hello World!"
            class="h-8 w-full"
            type="text"
          />
        </div>
        <div v-else-if="(i as { delay: number | null }).delay !== undefined" class=" flex size-full items-center justify-start gap-2">
          <InputNumber
            v-model="keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.delay"
            suffix="ms"
            placeholder="100ms"
            variant="filled"
            class="h-8"
            type="number"
          />
        </div>
        <div v-else class="relative m-1 flex size-full items-center justify-start gap-2">
          <template v-for="(keyCode, keyCodes_index) in keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.keyCodes" :key="keyCodes_index">
            <Key
              :keys="keyCode"
              :select="selectKeycode(index, keyCodes_index)"
              :default-key-size="42"
              @click="setKeycode($event, index, keyCodes_index)"
            />
          </template>
          <div
            class="rounded-prime-md flex size-8 items-center justify-center transition-all duration-200 hover:text-surface-700 dark:hover:text-surface-300"
            @click="addKeyCode(index)"
          >
            <Icon name="tabler:plus" size="1.2rem" />
          </div>
        </div>
      </div>
      <div
        class="rounded-prime-md flex h-8 min-w-8 cursor-pointer items-center justify-center transition-colors duration-200 hover:text-surface-400 dark:hover:text-surface-300"
        @click="delMacro(index)"
      >
        <Icon name="tabler:trash-x-filled" />
      </div>
    </div>
  </VueDraggable>
</template>
