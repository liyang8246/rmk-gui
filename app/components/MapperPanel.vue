<script lang="ts" setup>
const { area } = defineProps<{
  area?: 'inner' | 'outer' | null
}>()

const emit = defineEmits<{
  (e: 'setKeycode', key: number): void
}>()

const activeTab = ref('0')

watch(() => area, () => {
  activeTab.value = '0'
})

const BaseCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x0000 && value.code <= 0x0067)
    || (value.code >= 0x00E0 && value.code <= 0x00E7),
  )
})
const ISOCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x0000 && value.code <= 0x0067)
    || (value.code >= 0x0085 && value.code <= 0x0098)
    || (value.code >= 0x00E0 && value.code <= 0x00E7))
})
const LayersCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) => value.code >= 0x4000 && value.code <= 0x52FF)
})
const QuantumCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) => value.code >= 0 && value.code <= 0)
})
const BacklightCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) => value.code >= 0 && value.code <= 0)
})
const ToolsCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x0068 && value.code <= 0x0084)
    || (value.code >= 0x0099 && value.code <= 0x00DF),
  )
})
const UserCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) => value.code >= 0x0840 && value.code <= 0x085F)
})
const MacroCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x7700 && value.code <= 0x771F)
    || (value.code >= 0x0753 && value.code <= 0x0757))
})

const tabs = computed(() => [
  { area: 'any', title: 'base', content: BaseCodeMap.value, value: '0' },
  { area: 'any', title: 'ISO/JIS', content: ISOCodeMap.value, value: '1' },
  { area: 'outer', title: 'Layers', content: LayersCodeMap.value, value: '2' },
  { area: 'outer', title: 'Quantum', content: QuantumCodeMap.value, value: '3' },
  { area: 'outer', title: 'Backlight', content: BacklightCodeMap.value, value: '4' },
  { area: 'any', title: 'App,Media and Mouse', content: ToolsCodeMap.value, value: '5' },
  { area: 'outer', title: 'User', content: UserCodeMap.value, value: '6' },
  { area: 'outer', title: 'Macro', content: MacroCodeMap.value, value: '7' },
].filter(tab => tab.area === 'any' || tab.area === area || area === null))
</script>

<template>
  <Tabs v-model:value="activeTab" class=" flex flex-col items-center justify-start h-full w-full" scrollable>
    <TabList class=" flex justify-start items-start h-10 w-full">
      <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value" class="h-10 !p-3 !pt-2 text-sm !bg-suface-0 dark:!bg-surface-900">
        {{ tab.title }}
      </Tab>
    </TabList>
    <TabPanels class="!p-3 h-[calc(100%-40px)] w-full">
      <TabPanel v-for="tab in tabs" :key="tab.value" :value="tab.value" class="h-full w-full ">
        <ScrollPanel class="w-full h-full overflow-hidden">
          <div class="m-1 flex flex-wrap items-start justify-start gap-2 w-[calc(100%-8px)]">
            <template v-for="[, value] in tab.content" :key="value">
              <div class="cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300">
                <KeyMapKey :keys="value.symbol" @click="emit('setKeycode', value.code)" />
              </div>
            </template>
          </div>
        </ScrollPanel>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
