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

const baseData = [
  ['Escape', { x: 1 }, 'F1', 'F2', 'F3', 'F4', { x: 0.5 }, 'F5', 'F6', 'F7', 'F8', { x: 0.5 }, 'F9', 'F10', 'F11', 'F12', { x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
  [{ y: 0.5 }, 'Grave', 'Kc1', 'Kc2', 'Kc3', 'Kc4', 'Kc5', 'Kc6', 'Kc7', 'Kc8', 'Kc9', 'Kc0', 'Minus', 'Equal', { w: 2 }, 'Backspace', { x: 0.25 }, 'Insert', 'Home', 'PageUp', { x: 0.25 }, 'NumLock', 'KpSlash', 'KpAsterisk', 'KpMinus'],
  [{ w: 1.5 }, 'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'LeftBracket', 'RightBracket', { w: 1.5 }, 'Backslash', { x: 0.25 }, 'Delete', 'End', 'PageDown', { x: 0.25 }, 'Kp7', 'Kp8', 'Kp9', { h: 2 }, 'KpPlus'],
  [{ w: 1.75 }, 'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', { w: 2.25 }, 'Enter', { x: 3.5 }, 'Kp4', 'Kp5', 'Kp6'],
  [{ w: 2.25 }, 'LShift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Dot', 'Slash', { w: 2.75 }, 'RShift', { x: 1.25 }, 'Up', { x: 1.25 }, 'Kp1', 'Kp2', 'Kp3', { h: 2 }, 'KpEnter'],
  [{ w: 1.25 }, 'LCtrl', { w: 1.25 }, 'LGui', { w: 1.25 }, 'LAlt', { w: 6.25 }, 'Space', { w: 1.25 }, 'RAlt', { w: 1.25 }, 'RGui', { w: 1.25 }, 'Application', { w: 1.25 }, 'RCtrl', { x: 0.25 }, 'Left', 'Down', 'Right', { x: 0.25, w: 2 }, 'Kp0', 'KpDot'],
]
const ISOData = [
  ['Escape', { x: 1 }, 'F1', 'F2', 'F3', 'F4', { x: 0.5 }, 'F5', 'F6', 'F7', 'F8', { x: 0.5 }, 'F9', 'F10', 'F11', 'F12', { x: 0.25 }, 'PrintScreen', 'ScrollLock', 'Pause'],
  [{ y: 0.5 }, 'Grave', 'Kc1', 'Kc2', 'Kc3', 'Kc4', 'Kc5', 'Kc6', 'Kc7', 'Kc8', 'Kc9', 'Kc0', 'Minus', 'Equal', { w: 2 }, 'Backspace', { x: 0.25 }, 'Insert', 'Home', 'PageUp', { x: 0.25 }, 'NumLock', 'KpSlash', 'KpAsterisk', 'KpMinus'],
  [{ w: 1.5 }, 'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'LeftBracket', 'RightBracket', { x: 0.25, w: 1.25, h: 2, w2: 1.5, h2: 1, x2: -0.25 }, 'Enter', { x: 0.25 }, 'Delete', 'End', 'PageDown', { x: 0.25 }, 'Kp7', 'Kp8', 'Kp9', { h: 2 }, 'KpPlus'],
  [{ w: 1.75 }, 'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', 'Backslash', { x: 4.75 }, 'Kp4', 'Kp5', 'Kp6'],
  [{ w: 1.25 }, 'LShift', 'Backslash', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Dot', 'Slash', { w: 2.75 }, 'RShift', { x: 1.25 }, 'Up', { x: 1.25 }, 'Kp1', 'Kp2', 'Kp3', { h: 2 }, 'KpEnter'],
  [{ w: 1.25 }, 'LCtrl', { w: 1.25 }, 'LGui', { w: 1.25 }, 'LAlt', { a: 7, w: 6.25 }, 'Space', { a: 4, w: 1.25 }, 'RAlt', { w: 1.25 }, 'RGui', { w: 1.25 }, 'Application', { w: 1.25 }, 'RCtrl', { x: 0.25 }, 'Left', 'Down', 'Right', { x: 0.25, w: 2 }, 'Kp0', 'KpDot'],
]

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
        if ('x' in item && item.x !== undefined)
          currentX += item.x as number
        if ('y' in item && item.y !== undefined)
          currentY += item.y as number
        if ('w' in item && item.w !== undefined)
          w = item.w as number
        if ('h' in item && item.h !== undefined)
          h = item.h as number
        if ('x2' in item && item.x2 !== undefined)
          currentX2 = item.x2 as number
        if ('y2' in item && item.y2 !== undefined)
          currentY2 = item.y2 as number
        if ('w2' in item && item.w2 !== undefined)
          w2 = item.w2 as number
        if ('h2' in item && item.h2 !== undefined)
          h2 = item.h2 as number
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

const baseKeyboard = computed(() => generateKeyboard(baseData))
const baseKeymap = computed(() => generateKeymap(baseData))
const ISOKeyboard = computed(() => generateKeyboard(ISOData))
const ISOKeymap = computed(() => generateKeymap(ISOData))

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

function setBaseKeyBoardKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  emit('setKeycode', baseKeymap.value.get(`0,${key.labels[0]!}`)!)
}
function setISOKeyBoardKeycode(zone: 'outer' | 'inner', key: InstanceType<typeof KleKey>) {
  emit('setKeycode', ISOKeymap.value.get(`0,${key.labels[0]!}`)!)
}
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
              <div class="h-full w-full flex justify-center items-start">
                <KeyMapKeyboardCanvas
                  :key-board-keys="baseKeyboard"
                  :key-board-keys-map="baseKeymap"
                  @set-keycode="setBaseKeyBoardKeycode"
                />
              </div>
            </template>
            <template v-else-if="tab.title === 'ISO/JIS'">
              <div class="h-full w-full flex justify-center items-start">
                <KeyMapKeyboardCanvas
                  :key-board-keys="ISOKeyboard"
                  :key-board-keys-map="ISOKeymap"
                  @set-keycode="setISOKeyBoardKeycode"
                />
              </div>
            </template>
            <div v-else class="relative h-full w-full flex flex-1 flex-wrap items-start justify-start gap-2">
              <template v-for="[, value] in tab.content" :key="value">
                <KeyMapKey :keys="value.symbol" @click="emit('setKeycode', value.code)" />
              </template>
            </div>
          </div>
        </ScrollPanel>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
