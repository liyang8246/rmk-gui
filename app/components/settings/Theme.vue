<script lang="ts" setup>
const themeStore = useThemeStore()

const themeModeOptions = [
  { icon: 'tabler:sun', label: 'light' },
  { icon: 'tabler:moon-stars', label: 'dark' },
  { icon: 'tabler:settings', label: 'system' },
]

const primaryColorOptions = primaryColors.map(color => color.name)
</script>

<template>
  <ThemeCard :title="$t('settings.general.title')">
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.mode") }} </h2>
      <Select v-model="themeStore.darkMode" :options="themeModeOptions" option-label="label" option-value="label" size="small" />
    </div>
    <div class="flex h-9 items-center justify-between">
      <h2> {{ $t("settings.general.primary") }} </h2>
      <Select v-model="themeStore.primary" :options="primaryColorOptions" size="small" />
    </div>
  </ThemeCard>
</template>
