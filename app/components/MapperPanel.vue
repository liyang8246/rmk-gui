<script lang="ts" setup>
import { keyCodeMap } from '~/types/keycode'

const { area } = defineProps<{
  area?: 'inner' | 'outer' | null
}>()

const emit = defineEmits<{
  (e: 'setKeycode', key: number): void
}>()

const { width: screenWidth } = useWindowSize()
const activeTab = ref('0')

const baseDataBase = [
  ['Escape', { x: 1 }, 'F1', 'F2', 'F3', 'F4', { x: 0.5 }, 'F5', 'F6', 'F7', 'F8', { x: 0.5 }, 'F9', 'F10', 'F11', 'F12'],
  [{ y: 0.25 }, 'Grave', 'Kc1', 'Kc2', 'Kc3', 'Kc4', 'Kc5', 'Kc6', 'Kc7', 'Kc8', 'Kc9', 'Kc0', 'Minus', 'Equal', { w: 2 }, 'Backspace'],
  [{ w: 1.5 }, 'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'LeftBracket', 'RightBracket', { w: 1.5 }, 'Backslash'],
  [{ w: 1.75 }, 'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', { w: 2.25 }, 'Enter'],
  [{ w: 2.25 }, 'LShift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Dot', 'Slash', { w: 2.75 }, 'RShift'],
  [{ w: 1.25 }, 'LCtrl', { w: 1.25 }, 'LGui', { w: 1.25 }, 'LAlt', { w: 6.25 }, 'Space', { w: 1.25 }, 'RAlt', { w: 1.25 }, 'RGui', { w: 1.25 }, 'Application', { w: 1.25 }, 'RCtrl'],
]
const ISODataBase = [
  ['Escape', { x: 1 }, 'F1', 'F2', 'F3', 'F4', { x: 0.5 }, 'F5', 'F6', 'F7', 'F8', { x: 0.5 }, 'F9', 'F10', 'F11', 'F12'],
  [{ y: 0.25 }, 'Grave', 'Kc1', 'Kc2', 'Kc3', 'Kc4', 'Kc5', 'Kc6', 'Kc7', 'Kc8', 'Kc9', 'Kc0', 'Minus', 'Equal', 'International3', 'Backspace'],
  [{ w: 1.5 }, 'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'LeftBracket', 'RightBracket', { x: 0.25, w: 1.25, h: 2, w2: 1.5, h2: 1, x2: -0.25 }, 'Enter'],
  [{ w: 1.75 }, 'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', 'Backslash'],
  [{ w: 1.25 }, 'LShift', 'Backslash', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Dot', 'Slash', { w: 2.75 }, 'RShift'],
  [{ w: 1.25 }, 'LCtrl', { w: 1.25 }, 'LGui', { w: 1.25 }, 'LAlt', { w: 1.25 }, 'International5', { w: 2.5 }, 'Space', { w: 1.25 }, 'International4', { w: 1.25 }, 'International2', { w: 1.25 }, 'RAlt', { w: 1.25 }, 'RGui', { w: 1.25 }, 'Application', { w: 1.25 }, 'RCtrl'],
]
const extraKeys = {
  1050: {
    base: [[], [], [], [], [], []] as (string | Record<string, any>)[][],
    iso: [[], [], [], [], [], []] as (string | Record<string, any>)[][],
  },
  1225: {
    base: [
      [{ x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
      [{ x: 0.25 }, 'Insert', 'Home', 'PageUp'],
      [{ x: 0.25 }, 'Delete', 'End', 'PageDown'],
      [],
      [{ x: 1.25 }, 'Up'],
      [{ x: 0.25 }, 'Left', 'Down', 'Right'],
    ] as (string | Record<string, any>)[][],
    iso: [
      [{ x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
      [{ x: 0.25 }, 'Insert', 'Home', 'PageUp'],
      [{ x: 0.25 }, 'Delete', 'End', 'PageDown'],
      [],
      [{ x: 1.25 }, 'Up'],
      [{ x: 0.25 }, 'Left', 'Down', 'Right'],
    ] as (string | Record<string, any>)[][],
  },
  all: {
    base: [
      [{ x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
      [{ x: 0.25 }, 'Insert', 'Home', 'PageUp', { x: 0.25 }, 'NumLock', 'KpSlash', 'KpAsterisk', 'KpMinus'],
      [{ x: 0.25 }, 'Delete', 'End', 'PageDown', { x: 0.25 }, 'Kp7', 'Kp8', 'Kp9', 'KpPlus'],
      [{ x: 3.5 }, 'Kp4', 'Kp5', 'Kp6', 'KpComma'],
      [{ x: 1.25 }, 'Up', { x: 1.25 }, 'Kp1', 'Kp2', 'Kp3', 'KpEqual'],
      [{ x: 0.25 }, 'Left', 'Down', 'Right', { x: 0.25, w: 2 }, 'Kp0', 'KpDot', 'KpEnter'],
    ] as (string | Record<string, any>)[][],
    iso: [
      [{ x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
      [{ x: 0.25 }, 'Insert', 'Home', 'PageUp', { x: 0.25 }, 'NumLock', 'KpSlash', 'KpAsterisk', 'KpMinus'],
      [{ x: 0.25 }, 'Delete', 'End', 'PageDown', { x: 0.25 }, 'Kp7', 'Kp8', 'Kp9', 'KpPlus'],
      [{ x: 4.75 }, 'Kp4', 'Kp5', 'Kp6', 'KpComma'],
      [{ x: 1.25 }, 'Up', { x: 1.25 }, 'Kp1', 'Kp2', 'Kp3', 'KpEqual'],
      [{ x: 0.25 }, 'Left', 'Down', 'Right', { x: 0.25, w: 2 }, 'Kp0', 'KpDot', 'KpEnter'],
    ] as (string | Record<string, any>)[][],
  },
}

const getBaseData = computed(() => {
  const extra: (string | Record<string, any>)[][] = screenWidth.value >= 1225 ? extraKeys.all.base : screenWidth.value >= 1050 ? extraKeys[1225].base : extraKeys[1050].base
  return baseDataBase.map((row, index) => [...row, ...(extra[index] ?? [])])
})

const getISOData = computed(() => {
  const extra: (string | Record<string, any>)[][] = screenWidth.value >= 1225 ? extraKeys.all.iso : screenWidth.value >= 1050 ? extraKeys[1225].iso : extraKeys[1050].iso
  return ISODataBase.map((row, index) => [...row, ...(extra[index] ?? [])])
})

function generateKeyboard(data: (string | Record<string, any>)[][]) {
  const result: InstanceType<typeof KleKey>[] = []
  let currentX = 0
  let currentY = 0
  let currentX2 = 0
  let currentY2 = 0
  let w = 1
  let h = 1
  let w2 = 1
  let h2 = 1

  for (let i = 0; i < data.length; i++) {
    currentX = 0
    let jIndex = 0
    for (let j = 0; j < data[i]!.length; j++) {
      const item = data[i]![j]
      if (typeof item === 'string') {
        result.push({
          color: '#cccccc',
          labels: [`${i},${jIndex}`],
          textColor: [],
          textSize: [],
          default: {
            textColor: '#000000',
            textSize: 3,
          },
          x: currentX,
          y: currentY,
          width: w,
          height: h,
          x2: currentX2,
          y2: currentY2,
          width2: w2,
          height2: h2,
          rotation_x: 0,
          rotation_y: 0,
          rotation_angle: 0,
          decal: false,
          ghost: false,
          stepped: false,
          nub: false,
          profile: '',
          sm: '',
          sb: '',
          st: '',
          f2: undefined,
          align: undefined,
        })
        currentX += w
        jIndex += 1
        w = 1
        h = 1
        w2 = 1
        h2 = 1
        currentX2 = 0
        currentY2 = 0
      }
      else if (typeof item === 'object' && item !== null) {
        'x' in item && (currentX += item.x ?? 0)
        'y' in item && (currentY += item.y ?? 0)
        'w' in item && (w = item.w ?? 1)
        'h' in item && (h = item.h ?? 1)
        'x2' in item && (currentX2 = item.x2 ?? 0)
        'y2' in item && (currentY2 = item.y2 ?? 0)
        'w2' in item && (w2 = item.w2 ?? 1)
        'h2' in item && (h2 = item.h2 ?? 1)
      }
    }
    currentY += 1
  }
  return result
}
function generateKeymap(data: (string | Record<string, any>)[][]) {
  const map = new Map<string, number>()
  for (let i = 0; i < data.length; i++) {
    let jIndex = 0
    for (let j = 0; j < data[i]!.length; j++) {
      const item = data[i]![j]
      if (typeof item === 'string') {
        map.set(`0,${i},${jIndex}`, Object.values(keyCodeMap).find(keyInfo => keyInfo.rmk === item)?.code || 0)
        jIndex += 1
      }
    }
  }
  return map
}

const baseKeyboard = computed(() => generateKeyboard(getBaseData.value))
const baseKeymap = computed(() => generateKeymap(getBaseData.value))
const ISOKeyboard = computed(() => generateKeyboard(getISOData.value))
const ISOKeymap = computed(() => generateKeymap(getISOData.value))

const BaseCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x0000 && value.code <= 0x0067)
    || (value.code >= 0x00E0 && value.code <= 0x00E7)
    || (value.code >= 0x0085 && value.code <= 0x0086),
  )
})
const ISOCodeMap = computed(() => {
  return Object.entries(keyCodeMap).filter(([, value]) =>
    (value.code >= 0x0000 && value.code <= 0x0067)
    || (value.code >= 0x0085 && value.code <= 0x0098)
    || (value.code >= 0x00E0 && value.code <= 0x00E7))
})
const LayersCodeMap = computed(() => {
  const layerEntries = Object.entries(keyCodeMap).filter(([, value]) => value.code >= 0x4000 && value.code <= 0x52FF)
  
  // Group by first 2-3 alpha characters (LT-, TO-, DF-, etc.)
  const grouped = new Map<string, Array<[string, typeof keyCodeMap[number]]>>()
  
  layerEntries.forEach(([key, value]) => {
    const symbol = value.symbol[0] || value.symbol[1] || ''
    const match = symbol.match(/^([A-Z]{2,3})-/)
    const prefix = match ? match[1] : 'Other'
    
    if (!grouped.has(prefix)) {
      grouped.set(prefix, [])
    }
    grouped.get(prefix)!.push([key, value])
  })
  
  return grouped
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

const BaseCodeMapFliter = computed(() => BaseCodeMap.value.filter(item => !baseKeymap.value.entries().find(key => item[1].code === key[1])))
const ISOCodeMapFliter = computed(() => ISOCodeMap.value.filter(item => !ISOKeymap.value.entries().find(key => item[1].code === key[1])))

const tabs = computed(() => [
  { area: 'any', title: 'base', content: BaseCodeMapFliter.value, value: '0' },
  { area: 'any', title: 'ISO/JIS', content: ISOCodeMapFliter.value, value: '1' },
  { area: 'outer', title: 'Layers', content: LayersCodeMap.value, value: '2' },
  { area: 'outer', title: 'Quantum', content: QuantumCodeMap.value, value: '3' },
  { area: 'outer', title: 'Backlight', content: BacklightCodeMap.value, value: '4' },
  { area: 'any', title: 'App,Media and Mouse', content: ToolsCodeMap.value, value: '5' },
  { area: 'outer', title: 'User', content: UserCodeMap.value, value: '6' },
  { area: 'outer', title: 'Macro', content: MacroCodeMap.value, value: '7' },
].filter(tab => tab.area === 'any' || tab.area === area || area === null))

function setBaseKeyBoardKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  emit('setKeycode', baseKeymap.value.get(`0,${key.labels[0]!}`)!)
}
function setISOKeyBoardKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  emit('setKeycode', ISOKeymap.value.get(`0,${key.labels[0]!}`)!)
}

watch(() => area, () => {
  activeTab.value = '0'
})
</script>

<template>
  <Tabs v-model:value="activeTab" class=" flex flex-col items-center justify-start h-full w-full" scrollable>
    <TabList class=" flex justify-start items-start h-10 w-full">
      <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value" class="h-10 !p-3 !pt-2 text-sm !bg-suface-0 dark:!bg-surface-900">
        {{ tab.title }}
      </Tab>
    </TabList>
    <TabPanels class="!p-3 h-[calc(100%-40px)] w-full">
      <TabPanel v-for="tab in tabs" :key="tab.value" :value="tab.value" class="h-full w-full">
        <ScrollPanel
          class="w-full h-full overflow-hidden"
          pt:barx:class="!hidden"
        >
          <div class="m-1 w-[calc(100%-8px)]">
            <template v-if="tab.title === 'base'">
              <div class="h-full w-full flex justify-center items-start mb-8">
                <KeyMapKeyboardCanvas
                  :key-board-keys="baseKeyboard"
                  :key-board-keys-map="baseKeymap"
                  @set-keycode="setBaseKeyBoardKeycode"
                />
              </div>
            </template>
            <template v-else-if="tab.title === 'ISO/JIS'">
              <div class="h-full w-full flex justify-center items-start mb-5 pb-5">
                <KeyMapKeyboardCanvas
                  :key-board-keys="ISOKeyboard"
                  :key-board-keys-map="ISOKeymap"
                  @set-keycode="setISOKeyBoardKeycode"
                />
              </div>
            </template>
            <template v-if="tab.title === 'Layers'">
              <div class="h-full w-full">
                <template v-for="[groupName, entries] in tab.content" :key="groupName">
                  <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">{{ groupName }}</h3>
                    <div class="flex flex-wrap items-start justify-start gap-2">
                      <template v-for="[, value] in entries" :key="value">
                        <KeyMapKey :keys="value.symbol" @click="emit('setKeycode', value.code)" />
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </template>
            <template v-else>
              <div class="h-full w-full flex flex-wrap items-start justify-start gap-2">
                <template v-for="[, value] in tab.content" :key="value">
                  <KeyMapKey :keys="value.symbol" @click="emit('setKeycode', value.code)" />
                </template>
              </div>
            </template>
          </div>
        </ScrollPanel>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
