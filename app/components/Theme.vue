<script lang="ts" setup>
const themeStore = useThemeStore()

const options = [
  { icon: 'tabler:sun', label: 'light' },
  { icon: 'tabler:moon-stars', label: 'dark' },
  { icon: 'tabler:settings', label: 'system' },
]
const value = ref(options.find(option => option.label === useColorMode().preference) || options[0]!)
const opSuface = ref()
const opPrimary = ref()
function toggle(value: any, event: MouseEvent) {
  value.toggle(event)
}
</script>

<template>
  <div class="rounded-prime-md w-full bg-surface-50 p-3 shadow-sm shadow-surface-300 dark:bg-surface-700 dark:shadow-surface-950">
    <h1 class="mb-4 text-lg font-bold text-surface-800 dark:text-surface-200">
      Theme
    </h1>
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">Primary</span>
        <div class="relative">
          <Button
            type="button"
            aria-label="primary-setting"
            class="h-9 w-28 pl-2"
            @click="toggle(opPrimary, $event)"
          >
            <template #default>
              <div class="flex size-full items-center justify-start gap-2">
                <Icon name="tabler:color-filter" />
                <span>{{ themeStore.primary }}</span>
              </div>
            </template>
          </Button>
          <Popover ref="opPrimary">
            <div class="flex w-56 flex-wrap justify-start gap-2">
              <button
                v-for="pc of primaryColors"
                :key="pc.name"
                type="button"
                :title="pc.name"
                class="size-5 cursor-pointer rounded-full transition-all duration-300" :class="[
                  { 'ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-900': themeStore.primary === pc.name },
                ]"
                :style="{ backgroundColor: pc.palette['500'] }"
                @click="themeStore.primary = pc.name"
              />
            </div>
          </Popover>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">Surface</span>
        <div class="relative">
          <Button
            type="button"
            aria-label="surface-setting"
            class="h-9 w-28 !border-surface-500 !bg-surface-500 pl-2"
            @click="toggle(opSuface, $event)"
          >
            <template #default>
              <div class="flex size-full items-center justify-start gap-2">
                <Icon name="tabler:color-swatch" />
                <span>{{ themeStore.surface }}</span>
              </div>
            </template>
          </Button>
          <Popover ref="opSuface">
            <div class="flex w-56 flex-wrap justify-start gap-2">
              <button
                v-for="surface of surfaces"
                :key="surface.name"
                type="button"
                :title="surface.name"
                class="size-5 cursor-pointer rounded-full transition-all duration-300" :class="[
                  { 'ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-900': themeStore.surface === surface.name },
                ]"
                :style="{ backgroundColor: surface.palette['500'] }"
                @click="themeStore.surface = surface.name"
              />
            </div>
          </Popover>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">Mode</span>
        <div class="flex justify-start">
          <SelectButton
            v-model="value"
            :options="options"
            option-label="label"
            data-key="label"
            @click="$colorMode.preference = value.label"
          >
            <template #option="slotProps">
              <Icon :name="slotProps.option.icon" />
              <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">{{ slotProps.option.label }}</span>
            </template>
          </SelectButton>
        </div>
      </div>
    </div>
  </div>
</template>
