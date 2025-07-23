<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()

const tabs = ref([
  { title: 'base', content: 'Tab 1 Content', value: '0' },
  { title: 'ISO/JIS', content: 'Tab 2 Content', value: '1' },
  { title: 'Layers', content: 'Tab 3 Content', value: '2' },
  { title: 'Quantum', content: 'Tab 3 Content', value: '3' },
  { title: 'Backlight', content: 'Tab 3 Content', value: '4' },
  { title: 'App,Media and Mouse', content: 'Tab 3 Content', value: '5' },
  { title: 'User', content: 'Tab 3 Content', value: '6' },
  { title: 'Macro', content: 'Tab 3 Content', value: '7' },
])
function setKeycode(zone: 'outer' | 'inner', key: [number, number, number, string | null, string | null]) {
  pageKeymapStore.replaceKey = [...key, 'outer']
}
</script>

<template>
  <div class="rounded-prime-md p-3 flex justify-center items-center bg-surface-0 dark:bg-surface-950 overflow-hidden w-full h-full">
    <Tabs class=" flex flex-col items-center justify-start h-full w-full" value="0" scrollable>
      <TabList class=" flex justify-start items-start h-10 w-full">
        <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value" class="h-10 !p-3 !pt-2 text-sm ">
          {{ tab.title }}
        </Tab>
      </TabList>
      <TabPanels class="!p-3 h-[calc(100%-40px)] ">
        <TabPanel v-for="tab in tabs" :key="tab.content" :value="tab.value" class="h-full w-full ">
          <ScrollPanel class="w-full h-full overflow-hidden ">
            <div class="m-1 flex flex-wrap items-start justify-start gap-2 w-[calc(100%-8px)]">
              <template v-for="i, index in keyCodeMap" :key="index">
                <div class="cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300">
                  <KeyMapKey v-if="index < 20" :keys="i.symbol" :select="pageKeymapStore.replaceKey" @click="setKeycode" />
                </div>
              </template>
            </div>
          </scrollpanel>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
