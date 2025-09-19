<script lang="ts" setup>
const route = useRoute()
const keyboardStore = useKeyboardStore()

const pages = computed(() => [
  { name: $t('aside.home'), icon: 'tabler:home-filled', to: '/' },
  { name: $t('aside.keymap'), icon: 'tabler:keyboard-filled', to: '/keymap', disabled: !keyboardStore.layoutKeymap },
  { name: $t('aside.macros'), icon: 'tabler:circle-letter-a-filled', to: '/macros', disabled: !keyboardStore.keyMacros },
  { name: $t('aside.combos'), icon: 'tabler:circle-letter-k-filled', to: '/combos' },
  { name: $t('aside.export'), icon: 'tabler:file-export', to: '/export' },
  { name: $t('aside.settings'), icon: 'tabler:settings-filled', to: '/settings' },
])

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class=" flex h-screen w-48 flex-col border-r-2 bg-surface-50 p-3 dark:border-surface-800 dark:bg-surface-950">
    <div class="relative mb-3 min-h-[54px]">
      <div class="absolute left-[34px] top-[5px] h-[38px] w-[98px] bg-gradient-to-b from-surface-100 to-surface-300 shadow-lg dark:from-surface-400 dark:to-surface-600" />
      <img src="~/assets/rmk_logo.svg" class="absolute left-[29px] h-[54px] w-[109px]">
    </div>
    <div
      class="rounded-prime-xl max-h-[calc(100%-54px-12px)] bg-surface-100 p-1 shadow-inner dark:bg-surface-900"
      :style="{ height: `${pages.length * 60 + 12}` + 'px' }"
    >
      <ScrollPanel class="size-full" pt:bary:class="bg-surface-200 dark:bg-surface-800">
        <div class="flex flex-col gap-3 p-2">
          <NuxtLink
            v-for="page in pages"
            :key="page.to"
            :to="page.to"
            class="h-12 no-underline"
            :class="{
              'pointer-events-none opacity-50': page.disabled,
            }"
          >
            <AsideCard :name="page.name" :icon="page.icon" :selected="isActive(page.to)" />
          </NuxtLink>
        </div>
      </ScrollPanel>
    </div>
  </div>
</template>
