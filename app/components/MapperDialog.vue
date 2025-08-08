<script lang="ts" setup>
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'clearCurrkey'): void
  (e: 'setKeycode', key: number): void
}>()

const { screenWidth } = useScreenWidth()

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit('clearCurrkey')
    emit('update:show', value)
  },
})
const pageMacrosStore = usePageMacrosStore()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Select Key"
    class="overflow-hidden h-[430px] p-3 !m-0"
    :style="{ width: screenWidth > 1225 ? '1000px' : screenWidth > 1050 ? '830px' : '730px' }"
    position="bottom"
    maximizable
    pt:header:class="!p-0 !pb-3"
    pt:content:class="!p-0"
    pt:title:class="!pl-3 !text-lg text-surface-800 dark:text-surface-200"
  >
    <MapperPanel :area="pageMacrosStore.currKey[3]" @set-keycode="emit('setKeycode', $event)" />
  </Dialog>
</template>
