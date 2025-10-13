<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'setKey', key: Key): void
}>()

const keyboardStore = useKeyboardStore()

const keyTabs = [
  { value: 'base', title: 'Base' },
  { value: 'layer', title: 'Layer' },
]

const layerPrefix = {
  LT: 0x4000,
  MO: 0x5220,
  DF: 0x5240,
  TG: 0x5260,
  TT: 0x52C0,
  TO: 0x5200,
  OSL: 0x5280,
  PDF: 0x52E0,
}

const layerKeyCode = [
  {
    title: 'LT',
    value: Array.from({ length: keyboardStore.layerCount! }, (_, i) => layerPrefix.LT + (i << 8)),
  },
  ...(['MO', 'DF', 'TG', 'TT', 'TO', 'OSL', 'PDF'] as const).map(type => ({
    title: type,
    value: Array.from({ length: keyboardStore.layerCount! }, (_, i) => layerPrefix[type] + i),
  })),
]
function codeToKey(keycode: number): Key {
  return {
    geometry: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      x2: 0,
      y2: 0,
      width2: 1,
      height2: 1,
      rotation_x: 0,
      rotation_y: 0,
      rotation_angle: 0,
    },
    position: {
      row: 0,
      col: 0,
    },
    info: {
      code: keycode,
      symbol: [...keyToLable(keycode)],
    },
  }
}

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
          <Keyboard :keys="baseKeys" style="zoom: 0.75;" @click="(key, _zone) => emit('setKey', key)" />
        </TabPanel>
        <TabPanel value="layer">
          <div v-for="(key, index) in layerKeyCode" :key="index" class="mb-2 flex gap-2">
            <Key v-for="code in key.value" :key="code" :key-info="codeToKey(code)" @click="(_zone) => emit('setKey', codeToKey(code))" />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
