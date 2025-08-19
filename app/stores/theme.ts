import { updatePrimaryPalette, updateSurfacePalette } from '@primeuix/themes'

export const useThemeStore = defineStore('theme', () => {
  const primary = ref('emerald')
  const surface = ref('slate')
  const darkMode = ref(false)

  watch(primary, (newPrimary) => {
    const color = primaryColors.find(c => c.name === newPrimary)
    if (color) {
      updatePrimaryPalette(color.palette)
    }
  })

  watch(surface, (newSurface) => {
    const surfaceColor = surfaces.find(s => s.name === newSurface)
    if (surfaceColor) {
      updateSurfacePalette(surfaceColor.palette)
    }
  })

  return {
    primary,
    surface,
    darkMode,
  }
}, {
  persist: true,
})
