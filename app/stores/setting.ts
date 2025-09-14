import { updatePrimaryPalette, updateSurfacePalette } from '@primeuix/themes'

export const useSettingStore = defineStore('setting', () => {
  const i18n = useI18n()
  const language = ref('en')
  const primary = ref('emerald')
  const surface = ref('slate')
  const darkMode = ref('system')

  watch(language, (newLanguage: any) => {
    i18n.setLocale(newLanguage)
  })

  watch(primary, (newPrimary) => {
    const color = primaryColors.find(c => c.name === newPrimary)
    if (color) {
      updatePrimaryPalette(color.palette)
    }
  })

  watch(surface, (newSurface) => {
    const surfaceColor = surfaceColors.find(s => s.name === newSurface)
    if (surfaceColor) {
      updateSurfacePalette(surfaceColor.palette)
    }
  })

  watch(darkMode, (newDarkMode) => {
    useColorMode().preference = newDarkMode
  })

  return {
    language,
    primary,
    surface,
    darkMode,
  }
}, {
  persist: true,
})
