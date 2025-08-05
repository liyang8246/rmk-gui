export function useScreenWidth() {
  const screenWidth = ref(0)
  const updateScreenWidth = () => {
    screenWidth.value = window.innerWidth
  }
  onMounted(() => {
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })

  return { screenWidth }
}
