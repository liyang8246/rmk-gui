<script lang="ts" setup>
const { index } = defineProps<{
  index: number
}>()
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()
</script>

<template>
  <Select
    v-model="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]"
    :placeholder="keyboardStore.keyMacros[pageMacrosStore.currMacro]![index]!.name"
    :options="pageMacrosStore.operationData"
    option-label="name"
    class="w-32"
    :index="index"
  />
</template>
