<script lang="ts" setup>
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'clearCurrkey'): void
  (e: 'setKeycode', value: [string | null, string | null]): void
}>()

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit('clearCurrkey')
    emit('update:show', value)
  },
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Select Key"
    class="overflow-hidden w-2/3 h-2/3 p-3"
    position="bottom"
    maximizable
    pt:header:class="!p-0 !pb-3"
    pt:content:class="!p-0"
    pt:title:class="!pl-3 !text-lg text-surface-800 dark:text-surface-200"
  >
    <MapperPanel @set-keycode="emit('setKeycode', $event)" />
  </Dialog>
</template>
