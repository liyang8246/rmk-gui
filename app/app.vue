<script setup lang="ts">
interface MenuItem {
  id: string
  label: string
  icon: string
}

interface MockKeyboard {
  id: string
  name: string
  connection: 'BLE' | 'USB' | 'Dongle'
  bleSlot?: number
  state: 'Connected' | 'Advertising' | 'Sleeping'
  batteries: { label?: string, level: number, charging?: boolean }[]
  leds: [boolean, boolean, boolean]
}

const menuGroups: MenuItem[][] = [
  [
    {
      id: 'keymap',
      label: 'Keymap',
      icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10',
    },
    {
      id: 'combo',
      label: 'Combo',
      icon: 'M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3',
    },
    {
      id: 'macro',
      label: 'Macro',
      icon: 'm7 11 2-2-2-2M11 13h4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
    },
    {
      id: 'fork',
      label: 'Fork',
      icon: 'M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3m12 6 6-6',
    },
    {
      id: 'morse',
      label: 'Morse',
      icon: 'M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2',
    },
  ],
  [
    {
      id: 'advanced',
      label: 'Advanced Setting',
      icon: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
    },
    {
      id: 'about',
      label: 'About',
      icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
    },
  ],
]

const keyboards: MockKeyboard[] = [
  {
    id: '1',
    name: 'RMK Corne v4',
    connection: 'BLE',
    bleSlot: 1,
    state: 'Connected',
    batteries: [
      { label: 'L', level: 86, charging: true },
      { label: 'R', level: 72 },
    ],
    leds: [true, false, false],
  },
  {
    id: '2',
    name: 'Sweep Dongle',
    connection: 'Dongle',
    state: 'Sleeping',
    batteries: [
      { label: 'L', level: 94 },
      { label: 'R', level: 88 },
    ],
    leds: [true, true, false],
  },
  {
    id: '3',
    name: 'RMK60 Pro',
    connection: 'USB',
    state: 'Connected',
    batteries: [{ level: 100, charging: true }],
    leds: [false, false, false],
  },
]

const ledNames = ['Num Lock', 'Caps Lock', 'Scroll Lock']
const activeMenu = ref('keymap')
const switcherOpen = ref(false)
const currentKb = ref<MockKeyboard>(keyboards[0]!)

const wpmSamples = [28, 34, 30, 48, 62, 55, 71, 64, 78, 74, 85, 68]
const wpmPoints = computed(() => {
  const max = 100
  return wpmSamples
    .map((v, i) => `${(i / (wpmSamples.length - 1)) * 232},${36 - (v / max) * 30}`)
    .join(' ')
})
const wpmArea = computed(() => `0,36 ${wpmPoints.value} 232,36`)
</script>

<template>
  <div class="isolate flex h-screen bg-[#f4f4f6] p-2.5 text-neutral-900 select-none">
    <aside
      class="
        flex w-64 shrink-0 flex-col rounded-xl bg-[#ebebee]/90 p-3 ring-1 ring-black/6
        backdrop-blur-xl
      "
    >
      <div class="mb-5 flex items-center justify-between px-1.5 pt-0.5">
        <div class="flex items-center gap-2" aria-hidden="true">
          <span class="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 ring-inset" />
          <span class="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10 ring-inset" />
          <span class="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10 ring-inset" />
        </div>
        <span class="text-xs font-semibold tracking-tight text-neutral-500">Rynk GUI</span>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <template v-for="(group, gIdx) in menuGroups" :key="gIdx">
          <div v-if="gIdx > 0" class="my-2 border-t border-neutral-300/70" />
          <button
            v-for="item in group"
            :key="item.id"
            type="button"
            :class="
              activeMenu === item.id
                ? 'bg-neutral-300/70 font-medium text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900'
            "
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-base transition-colors"
            @click="activeMenu = item.id"
          >
            <span
              class="
                flex size-6 shrink-0 items-center justify-center rounded-md bg-white/90
                text-neutral-700 shadow-2xs ring-1 ring-black/8
              "
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="
                  size-[15px]
                "
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
              </svg>
            </span>
            <span class="truncate">{{ item.label }}</span>
          </button>
        </template>
      </nav>

      <div class="mt-3 px-0.5">
        <div class="text-[11px] font-medium tracking-wide text-neutral-400 uppercase tabular-nums">
          WPM {{ wpmSamples[wpmSamples.length - 1] }}
        </div>
        <svg
          viewBox="0 0 232 36"
          preserveAspectRatio="none"
          class="mt-1 h-9 w-full overflow-visible"
        >
          <defs>
            <linearGradient id="wpm-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#171717" stop-opacity="0.14" />
              <stop offset="100%" stop-color="#171717" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <polygon :points="wpmArea" fill="url(#wpm-fill)" />
          <polyline
            :points="wpmPoints"
            fill="none"
            stroke="#171717"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div class="relative mt-2 rounded-xl bg-white/85 p-3 shadow-2xs ring-1 ring-black/5">
        <div
          v-if="switcherOpen"
          class="
            absolute inset-x-0 bottom-full z-20 mb-1.5 rounded-xl bg-white p-1.5 shadow-lg ring-1
            ring-black/8
          "
        >
          <button
            v-for="kb in keyboards"
            :key="kb.id"
            type="button"
            class="
              flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs
              hover:bg-neutral-100
            "
            @click="currentKb = kb; switcherOpen = false"
          >
            <span class="truncate font-medium text-neutral-800">{{ kb.name }}</span>
            <span class="ml-2 shrink-0 text-neutral-400">
              {{ kb.connection }}{{ kb.bleSlot ? ` ${kb.bleSlot}` : '' }}
            </span>
          </button>
          <div class="my-1 border-t border-neutral-100" />
          <button
            type="button"
            class="
              flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
              text-neutral-600
              hover:bg-neutral-100 hover:text-neutral-900
            "
            @click="switcherOpen = false"
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="
                size-3.5
              "
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5v14" />
            </svg>
            Add Keyboard…
          </button>
        </div>

        <button
          type="button"
          class="
            -mx-1.5 -mt-1 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-lg
            px-1.5 py-1 text-left
            hover:bg-neutral-100/80
          "
          @click="switcherOpen = !switcherOpen"
        >
          <div class="flex min-w-0 items-center gap-2">
            <svg
              viewBox="890 695 488 558" aria-hidden="true" class="size-4 shrink-0 text-neutral-900"
            >
              <polygon fill="currentColor" points="901.07 1107.36 1134.05 1245.1 1134.05 1173.22 901.07 1035.47 901.07 1107.36" />
              <polygon fill="currentColor" points="901.07 941.18 1134.05 1078.92 1134.05 1007.04 901.07 869.29 901.07 941.18" />
              <polygon fill="currentColor" points="901.07 703.11 901.07 774.99 1134.05 912.74 1134.05 840.85 901.07 703.11" />
              <polygon fill="#999" points="1367.03 703.11 1367.03 774.99 1134.05 912.74 1134.05 840.85 1367.03 703.11" />
              <polygon fill="#999" points="1305.15 861.13 1305.15 1072.06 1305.15 1143.94 1367.03 1107.36 1367.03 1035.47 1367.03 824.55 1305.15 861.13" />
              <polygon fill="#999" points="1264.67 1095.99 1134.05 1173.22 1134.05 1245.1 1264.67 1167.87 1264.67 1095.99" />
            </svg>
            <span class="truncate text-sm font-semibold text-neutral-900">{{ currentKb.name }}</span>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="
              size-4 shrink-0 text-neutral-400
            "
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m7 15 5 5 5-5M7 9l5-5 5 5" />
          </svg>
        </button>

        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center gap-1">
            <span
              class="
                rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600
              "
            >
              {{ currentKb.connection }}
            </span>
            <span
              v-if="currentKb.bleSlot"
              class="
                rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500
              "
            >
              Slot {{ currentKb.bleSlot }}
            </span>
            <span
              class="
                rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500
              "
            >
              {{ currentKb.state }}
            </span>
          </div>

          <div class="flex items-center gap-1.5" aria-label="LED indicators">
            <span
              v-for="(on, idx) in currentKb.leds"
              :key="idx"
              :title="ledNames[idx]"
              :class="on ? 'bg-neutral-800' : 'bg-neutral-300'"
              class="size-1.5 rounded-full transition-colors"
            />
          </div>
        </div>

        <div
          :class="currentKb.batteries.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
          class="mt-2.5 grid gap-2 border-t border-neutral-100 pt-2.5"
        >
          <div
            v-for="(bat, idx) in currentKb.batteries"
            :key="idx"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-neutral-400">{{ bat.label ?? 'Battery' }}</span>
              <span class="flex items-center gap-0.5 font-medium text-neutral-700 tabular-nums">
                <svg
                  v-if="bat.charging"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="size-3 text-amber-500"
                >
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                </svg>
                {{ bat.level }}%
              </span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-neutral-300">
              <div
                class="h-full rounded-full bg-neutral-800 transition-all"
                :style="{ width: `${bat.level}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main
      class="ml-2.5 flex flex-1 items-center justify-center rounded-xl bg-white ring-1 ring-black/6"
    >
      <span class="text-sm text-neutral-400">
        {{ menuGroups.flat().find(i => i.id === activeMenu)?.label }}
      </span>
    </main>

    <Toaster />
  </div>
</template>
