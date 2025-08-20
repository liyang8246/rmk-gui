<script lang="ts" setup>
const themeStore = useThemeStore()

const options = [
  { icon: 'pi pi-sun text-base', label: 'light' },
  { icon: 'pi pi-moon text-base', label: 'dark' },
  { icon: 'pi pi-cog text-base', label: 'system' },
]
const value = ref(options.find(option => option.label === useColorMode().preference) || options[0]!)
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
            v-styleclass="{
              selector: '@next',
              enterFromClass: 'hidden',
              enterActiveClass: 'animate-scalein',
              leaveToClass: 'hidden',
              leaveActiveClass: 'animate-fadeout',
              hideOnOutsideClick: true,
            }"
            icon="pi pi-palette"
            class="h-9 w-28 !justify-start"
            :label="themeStore.primary"
            aria-label="Settings"
          />
          <div
            class="absolute right-0 top-10 z-50 hidden w-64 origin-top rounded-md border border-surface-200 bg-surface-0 p-4 shadow-lg dark:border-surface-700 dark:bg-surface-900"
          >
            <div class="flex flex-wrap justify-between gap-2">
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
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">Surface</span>
        <div class="relative">
          <Button
            v-styleclass="{
              selector: '@next',
              enterFromClass: 'hidden',
              enterActiveClass: 'animate-scalein',
              leaveToClass: 'hidden',
              leaveActiveClass: 'animate-fadeout',
              hideOnOutsideClick: true,
            }"
            icon="pi pi-desktop"
            class="h-9 w-28 !justify-start !border-surface-500 !bg-surface-500"
            :label="themeStore.surface"
            aria-label="Settings"
          />
          <div
            class="absolute right-0 top-10 z-50 hidden w-64 origin-top rounded-md border border-surface-200 bg-surface-0 p-4 shadow-lg dark:border-surface-700 dark:bg-surface-900"
          >
            <div class="flex flex-wrap justify-between gap-2">
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
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">Mode</span>
        <div class="card flex justify-start">
          <SelectButton
            v-model="value"
            :options="options"
            option-label="label"
            data-key="label"
            @click="$colorMode.preference = value.label"
          >
            <template #option="slotProps">
              <i :class="slotProps.option.icon" />
              <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">{{ slotProps.option.label }}</span>
            </template>
          </SelectButton>
        </div>
      </div>
    </div>
  </div>
</template>
