<script lang="ts" setup>
const { index } = defineProps<{
  index: number
}>()
const keyboardStore = useKeyboardStore()
const pageMacrosStore = usePageMacrosStore()

const originalObject = ref<MacroAction>()
watch(originalObject, (newValue) => {
  if (newValue && keyboardStore.keyMacros) {
    keyboardStore.keyMacros[pageMacrosStore.currMacro]![index] = JSON.parse(JSON.stringify(newValue))
  }
})
</script>

<template>
  <Select
    v-model="originalObject"
    :placeholder="keyboardStore.keyMacros![pageMacrosStore.currMacro]![index]!.name"
    :options="pageMacrosStore.operationData"
    option-label="name"
    class="w-32"
    :index="index"
  />
</template>
