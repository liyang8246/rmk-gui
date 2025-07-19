<script lang="ts" setup>
const themeStore = useThemeStore()
</script>

<template>
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
      icon="pi pi-cog"
      text
      rounded
      aria-label="Settings"
    />
    <div
      class="absolute top-16 right-0 w-64 p-4 bg-white dark:bg-surface-900 rounded-md shadow-lg border border-surface-200 dark:border-surface-700 origin-top z-50 hidden"
    >
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-sm text-surface-600 dark:text-surface-400 font-semibold">Primary</span>
          <div class="pt-2 flex gap-2 flex-wrap justify-between">
            <button
              v-for="pc of themeStore.primaryColors"
              :key="pc.name"
              type="button"
              :title="pc.name"
              class="border-none w-5 h-5 rounded-full p-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2" :class="[
                { 'ring-2 ring-primary ring-offset-2': themeStore.primary === pc.name },
              ]"
              :style="{ backgroundColor: pc.palette['500'] }"
              @click="themeStore.updateColors('primary', pc.name)"
            />
          </div>
        </div>
        <div>
          <span class="text-sm text-surface-600 dark:text-surface-400 font-semibold">Surface</span>
          <div class="pt-2 flex gap-2 flex-wrap justify-between">
            <button
              v-for="s of themeStore.surfaces"
              :key="s.name"
              type="button"
              :title="s.name"
              class="border-none w-5 h-5 rounded-full p-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2" :class="[
                {
                  'ring-2 ring-primary ring-offset-2': themeStore.surface
                    ? themeStore.surface === s.name
                    : s.name === 'slate',
                },
              ]"
              :style="{ backgroundColor: s.palette['500'] }"
              @click="themeStore.updateColors('surface', s.name)"
            />
          </div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-all text-surface-900 dark:text-surface-0 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 dark:focus-visible:ring-offset-surface-950"
              @click="$colorMode.preference = 'dark'"
            >
              <i class="pi pi-moon text-base" />
            </button>
            <button
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-all text-surface-900 dark:text-surface-0 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 dark:focus-visible:ring-offset-surface-950"
              @click="$colorMode.preference = 'light'"
            >
              <i class="pi pi-sun text-base" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
