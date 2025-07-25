<script lang="ts" setup>
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'clearCurrkey'): void
}>()

const visible = computed({
  get: () => props.show,
  set: (value) => {
    emit('clearCurrkey')
    emit('update:show', value)
  },
})
</script>

<template>
  <Dialog v-model:visible="visible" header="Select Key" class="overflow-hidden w-2/3 h-2/3">
    <MapperPanel />
  </Dialog>
</template>
