<script lang="ts" setup>
const route = useRoute()

const pages = [
  { name: 'Home', icon: 'tabler:home-filled', to: '/' },
  { name: 'Keymap', icon: 'tabler:keyboard-filled', to: '/keymap' },
  { name: 'Macros', icon: 'tabler:circle-letter-a-filled', to: '/macros' },
  { name: 'Combos', icon: 'tabler:circle-letter-k-filled', to: '/combos' },
  { name: 'Settings', icon: 'tabler:settings-filled', to: '/settings' },
  { name: 'Export', icon: 'tabler:file-export', to: '/export' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class=" flex h-screen w-48 flex-col border-r-2 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-950">
    <div class="relative mb-3 h-[54px]">
      <div class="absolute left-[34px] top-[5px] h-[38px] w-[98px] bg-gradient-to-b from-surface-100 to-surface-300 shadow-lg shadow-surface-300 dark:from-surface-400 dark:to-surface-600 dark:shadow-surface-600" />
      <img src="~/assets/rmk_logo.svg" class="absolute left-[29px] h-[54px] w-[109px]">
    </div>
    <div class="rounded-prime-xl bg-surface-100 p-3 shadow-inner dark:bg-surface-900">
      <div class="flex flex-col gap-3">
        <NuxtLink v-for="page in pages" :key="page.to" :to="page.to" class="no-underline">
          <AsideCard :name="page.name" :icon="page.icon" :selected="isActive(page.to)" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
