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
    { id: 'keymap', label: 'Keymap', icon: 'lucide:keyboard' },
    { id: 'combo', label: 'Combo', icon: 'lucide:command' },
    { id: 'macro', label: 'Macro', icon: 'lucide:square-terminal' },
    { id: 'fork', label: 'Fork', icon: 'lucide:split' },
    { id: 'morse', label: 'Morse', icon: 'lucide:audio-waveform' },
  ],
  [
    { id: 'advanced', label: 'Advanced Setting', icon: 'lucide:sliders-horizontal' },
    { id: 'about', label: 'About', icon: 'lucide:info' },
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
const route = useRoute()
const currentKb = ref<MockKeyboard>(keyboards[0]!)

const colorMode = useColorMode()
const themeIcons: Record<string, string> = {
  light: 'lucide:sun',
  dark: 'lucide:moon',
  system: 'lucide:monitor',
}

function cycleTheme() {
  const modes = ['light', 'dark', 'system']
  colorMode.preference = modes[(modes.indexOf(colorMode.preference) + 1) % modes.length]!
}

function menuClass(id: string) {
  return route.path === `/${id}`
    ? 'bg-content/10 text-content-highlighted'
    : 'text-content-muted hover:bg-content/5 hover:text-content-highlighted'
}

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
  <div class="isolate flex h-screen bg-base-300 p-2.5 text-content select-none">
    <aside
      class="
        flex w-64 shrink-0 flex-col rounded-xl bg-base-200/80 p-3 ring-1 ring-border
        backdrop-blur-xl
      "
    >
      <div class="mb-5 flex items-center justify-between px-1.5 pt-0.5">
        <div class="flex items-center gap-2" aria-hidden="true">
          <span class="size-3 rounded-full bg-[#ff5f57] inset-ring-1 inset-ring-border" />
          <span class="size-3 rounded-full bg-[#febc2e] inset-ring-1 inset-ring-border" />
          <span class="size-3 rounded-full bg-[#28c840] inset-ring-1 inset-ring-border" />
        </div>
        <span class="text-xs font-semibold tracking-tight text-content-muted">Rynk GUI</span>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <template v-for="(group, gIdx) in menuGroups" :key="gIdx">
          <div v-if="gIdx > 0" class="my-2 border-t border-border" />
          <NuxtLink
            v-for="item in group"
            :key="item.id"
            :to="`/${item.id}`"
            :class="menuClass(item.id)"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-base transition-colors"
          >
            <span class="flex size-6 shrink-0 items-center justify-center">
              <Icon :name="item.icon" class="size-4" />
            </span>
            <span class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>

      <div class="mt-3 px-0.5">
        <div class="text-xs font-medium tracking-wide text-content-muted uppercase tabular-nums">
          WPM {{ wpmSamples[wpmSamples.length - 1] }}
        </div>
        <svg
          viewBox="0 0 232 36"
          preserveAspectRatio="none"
          class="mt-1 h-9 w-full overflow-visible text-content"
        >
          <defs>
            <linearGradient id="wpm-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.14" />
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <polygon :points="wpmArea" fill="url(#wpm-fill)" />
          <polyline
            :points="wpmPoints"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div class="mt-2 rounded-xl bg-base-100/85 p-3 shadow-2xs ring-1 ring-border">
        <DropdownMenuRoot>
          <DropdownMenuTrigger
            class="
              flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left
              hover:bg-base-200/80
            "
          >
            <span class="flex min-w-0 items-center gap-2">
              <svg
                viewBox="890 695 488 558" aria-hidden="true" class="size-4 shrink-0 text-content"
              >
                <polygon fill="currentColor" points="901.07 1107.36 1134.05 1245.1 1134.05 1173.22 901.07 1035.47 901.07 1107.36" />
                <polygon fill="currentColor" points="901.07 941.18 1134.05 1078.92 1134.05 1007.04 901.07 869.29 901.07 941.18" />
                <polygon fill="currentColor" points="901.07 703.11 901.07 774.99 1134.05 912.74 1134.05 840.85 901.07 703.11" />
                <polygon fill="#999" points="1367.03 703.11 1367.03 774.99 1134.05 912.74 1134.05 840.85 1367.03 703.11" />
                <polygon fill="#999" points="1305.15 861.13 1305.15 1072.06 1305.15 1143.94 1367.03 1107.36 1367.03 1035.47 1367.03 824.55 1305.15 861.13" />
                <polygon fill="#999" points="1264.67 1095.99 1134.05 1173.22 1134.05 1245.1 1264.67 1167.87 1264.67 1095.99" />
              </svg>
              <span class="truncate text-sm font-semibold text-content">{{ currentKb.name }}</span>
            </span>
            <Icon name="lucide:chevrons-up-down" class="size-4 shrink-0 text-content-muted" />
          </DropdownMenuTrigger>

          <DropdownMenuPortal>
            <DropdownMenuContent
              align="start"
              side="top"
              class="min-w-52 rounded-xl bg-base-100 p-1.5 shadow-lg ring-1 ring-border"
            >
              <DropdownMenuItem
                v-for="kb in keyboards"
                :key="kb.id"
                class="
                  flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs
                  hover:bg-base-200
                "
                @select="currentKb = kb"
              >
                <span class="truncate font-medium text-content">{{ kb.name }}</span>
                <span class="ml-2 shrink-0 text-content-muted">
                  {{ kb.connection }}{{ kb.bleSlot ? ` ${kb.bleSlot}` : '' }}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-1 border-t border-border" />
              <DropdownMenuItem
                class="
                  flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
                  text-content-muted
                  hover:bg-base-200 hover:text-content-highlighted
                "
              >
                <Icon name="lucide:plus" class="size-3.5" />
                Add Keyboard…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>

        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center gap-1">
            <span
              class="rounded-md bg-base-200 px-1.5 py-0.5 text-xs font-medium text-content-muted"
            >
              {{ currentKb.connection }}
            </span>
            <span
              v-if="currentKb.bleSlot"
              class="rounded-md bg-base-200 px-1.5 py-0.5 text-xs font-medium text-content-muted"
            >
              Slot {{ currentKb.bleSlot }}
            </span>
            <span
              class="rounded-md bg-base-200 px-1.5 py-0.5 text-xs font-medium text-content-muted"
            >
              {{ currentKb.state }}
            </span>
          </div>

          <div class="flex items-center gap-1.5" aria-label="LED indicators">
            <span
              v-for="(on, idx) in currentKb.leds"
              :key="idx"
              :title="ledNames[idx]"
              :class="on ? 'bg-accent' : 'bg-base-300'"
              class="size-1.5 rounded-full transition-colors"
            />
          </div>
        </div>

        <div
          :class="currentKb.batteries.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
          class="mt-2.5 grid gap-2 border-t border-border pt-2.5"
        >
          <div
            v-for="(bat, idx) in currentKb.batteries"
            :key="idx"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-content-muted">{{ bat.label ?? 'Battery' }}</span>
              <span class="flex items-center gap-0.5 font-medium text-content-muted tabular-nums">
                <Icon
                  v-if="bat.charging"
                  name="lucide:zap"
                  class="size-3 fill-current text-warning"
                />
                {{ bat.level }}%
              </span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-base-300">
              <div
                class="h-full rounded-full bg-accent transition-all"
                :style="{ width: `${bat.level}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-2 flex items-center gap-1">
        <NuxtLink
          to="/settings"
          :class="menuClass('settings')"
          class="
            flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-base transition-colors
          "
        >
          <span class="flex size-6 shrink-0 items-center justify-center">
            <Icon name="lucide:settings" class="size-4" />
          </span>
          <span class="truncate">App Settings</span>
        </NuxtLink>
        <button
          type="button"
          :title="`Theme: ${colorMode.preference}`"
          :aria-label="`Theme: ${colorMode.preference}, click to switch`"
          class="
            flex size-8 shrink-0 items-center justify-center rounded-lg text-content-muted
            hover:bg-base-300/60 hover:text-content-highlighted
          "
          @click="cycleTheme"
        >
          <Icon :name="themeIcons[colorMode.preference]!" class="size-4" />
        </button>
      </div>
    </aside>

    <main
      class="
        ml-2.5 flex flex-1 items-center justify-center rounded-xl bg-base-100 ring-1 ring-border
      "
    >
      <NuxtPage />
    </main>

    <div id="modal-provider" />
    <ToasterProvider />
  </div>
</template>
