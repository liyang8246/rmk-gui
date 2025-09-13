<script lang="ts" setup>
const themeStore = useSettingStore()
const { locales } = useI18n()

const themeModeOptions = [
  { icon: 'tabler:sun', label: 'light' },
  { icon: 'tabler:moon-stars', label: 'dark' },
  { icon: 'tabler:settings', label: 'system' },
]

const primaryOptions = primaryColors.map(color => color.name)
const surfaceOptions = surfaceColors.map(color => color.name)
</script>

<template>
  <ThemeCard :title="$t('settings.general.title')">
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.language") }} </h2>
      <Select v-model="themeStore.language" :options="locales" option-label="name" option-value="code" size="small" class="w-32" />
    </div>
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.mode") }} </h2>
      <Select v-model="themeStore.darkMode" :options="themeModeOptions" option-label="label" option-value="label" size="small" class="w-32" />
    </div>
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.primary") }} </h2>
      <Select v-model="themeStore.primary" :options="primaryOptions" size="small" class="w-32" />
    </div>
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.surface") }} </h2>
      <Select v-model="themeStore.surface" :options="surfaceOptions" size="small" class="w-32" />
    </div>
  </ThemeCard>
</template>
