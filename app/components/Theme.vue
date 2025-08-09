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
  <div class="rounded-prime-md w-full p-3 bg-surface-50 dark:bg-surface-700 shadow-sm shadow-surface-300 dark:shadow-surface-950">
    <h1 class="text-lg text-surface-800 dark:text-surface-200 font-bold mb-4">
      Theme
    </h1>
    <div class="flex flex-col gap-6">
      <div class="flex justify-between items-center">
        <span class="text-sm text-surface-600 dark:text-surface-300 font-semibold">Primary</span>
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
            class="w-28 h-9 !justify-start"
            :label="themeStore.primary"
            aria-label="Settings"
          />
          <div
            class="absolute top-10 right-0 w-64 p-4 bg-surface-0 dark:bg-surface-900 rounded-md shadow-lg border border-surface-200 dark:border-surface-700 origin-top z-50 hidden"
          >
            <div class="flex gap-2 flex-wrap justify-between">
              <button
                v-for="pc of themeStore.primaryColors"
                :key="pc.name"
                type="button"
                :title="pc.name"
                class="w-5 h-5 rounded-full cursor-pointer transition-all duration-300" :class="[
                  { 'ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-900': themeStore.primary === pc.name },
                ]"
                :style="{ backgroundColor: pc.palette['500'] }"
                @click="themeStore.updateColors('primary', pc.name)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-surface-600 dark:text-surface-300 font-semibold">Surface</span>
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
            class="w-28 h-9 !bg-surface-500 !border-surface-500 !justify-start"
            :label="themeStore.surface"
            aria-label="Settings"
          />
          <div
            class="absolute top-10 right-0 w-64 p-4 bg-surface-0 dark:bg-surface-900 rounded-md shadow-lg border border-surface-200 dark:border-surface-700 origin-top z-50 hidden"
          >
            <div class="flex gap-2 flex-wrap justify-between">
              <button
                v-for="surface of themeStore.surfaces"
                :key="surface.name"
                type="button"
                :title="surface.name"
                class="w-5 h-5 rounded-full cursor-pointer transition-all duration-300" :class="[
                  { 'ring-2 ring-primary-500 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-900': themeStore.surface === surface.name },
                ]"
                :style="{ backgroundColor: surface.palette['500'] }"
                @click="themeStore.updateColors('surface', surface.name)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-surface-600 dark:text-surface-300 font-semibold">Mode</span>
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
              <span class="text-sm text-surface-600 dark:text-surface-400 font-semibold">{{ slotProps.option.label }}</span>
            </template>
          </SelectButton>
        </div>
      </div>
    </div>
  </div>
</template>
