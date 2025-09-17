<script lang="ts" setup>
const { index } = defineProps<{
  index: number
}>()
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

const originalObject = ref<MacroAction>()
</script>

<template>
  <Select
    v-model="originalObject"
    :placeholder="keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.name"
    :options="pageMacrosStore.operationData"
    option-label="name"
    class="h-9 w-24"
    pt:label:class="text-sm leading-9 !p-0 !pl-3"
    :index="index"
    @update:model-value="(newValue:MacroAction) => (keyboardStore.keyMacros![pageMacrosStore.currMacro]![index] = JSON.parse(JSON.stringify(newValue)))"
  />
</template>
