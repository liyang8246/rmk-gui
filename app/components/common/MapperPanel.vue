<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'setKey', key: Key, zone: 'outer' | 'inner'): void
}>()

const keyTabs = [
  { value: 'base', title: 'Base' },
  { vlaue: 'layer', title: 'Layer' },
]

function parseKleLayout(layout: KeymapItem[][]): Key[] {
  const kle = deserialize(layout)
  const pikeGeo = (k: InstanceType<typeof KleKey>) => pick(k, ['x', 'y', 'width', 'height', 'x2', 'y2', 'width2', 'height2', 'rotation_x', 'rotation_y', 'rotation_angle'])

  return kle.keys.map((k) => {
    const keycode = Number.parseInt(k.labels[0]!, 16)
    return {
      geometry: pikeGeo(k),
      position: { row: 0, col: 0 },
      info: {
        code: keycode,
        symbol: [...keyToLable(keycode)],
      },
    } as Key
  })
}

const baseKeys = parseKleLayout(layout68)
</script>

<template>
  <div class="rounded-prime-md w-full border bg-white px-3 py-2 shadow dark:bg-surface-900">
    <Tabs value="base">
      <TabList>
        <Tab v-for="tab in keyTabs" :key="tab.value" :value="tab.value!" class="py-3 text-sm">
          {{ tab.title }}
        </Tab>
      </TabList>
      <TabPanels class="flex justify-center">
        <TabPanel value="base">
          <Keyboard :keys="baseKeys" style="zoom: 0.75;" @click="(key, zone) => emit('setKey', key, zone)" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
