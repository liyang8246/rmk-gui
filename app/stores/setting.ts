import { updatePrimaryPalette, updateSurfacePalette } from '@primeuix/themes'

export const useSettingStore = defineStore('setting', () => {
  const primary = ref('emerald')
  const surface = ref('slate')
  const darkMode = ref('system')

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
    primary,
    surface,
    darkMode,
  }
}, {
  persist: true,
})
