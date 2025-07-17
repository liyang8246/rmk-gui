<script lang="ts" setup>
const { index } = defineProps<{
  index: number
}>()
const pageMacrosStore = usePageMacrosStore()
</script>

<template>
  <Select
    v-model="pageMacrosStore.operation[index]"
    placeholder="select"
    :options="pageMacrosStore.operationData"
    option-label="name"
    class="w-32"
    :index="index"
  />
</template>

<style scoped>

</style>
