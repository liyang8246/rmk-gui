export const usePageKeymapStore = defineStore('pageKeymap', () => {
  const currLayer = ref(0)

  const currKey = ref<[number, number, number, string | null, string | null, 'outer' | 'inner' | null]>([0, 0, 0, null, null, null])
  const replaceKey = ref<[number, number, number, string | null, string | null, 'outer' | 'inner' | null]>([0, 0, 0, null, null, null])

  function clearSelectedProps() {
    currKey.value = [0, 0, 0, null, null, null]
    replaceKey.value = [0, 0, 0, null, null, null]
  }

  const position = ref<{
    max_x: number
    max_y: number
    min_x: number
    min_y: number
    last_width: number
    last_height: number
  }>({
    max_x: 0,
    max_y: 0,
    min_x: 100,
    min_y: 100,
    last_width: 0,
    last_height: 0,
  })
  function getPosition(key: InstanceType<typeof KleKey>): void {
    if (key !== null) {
      position.value.max_x = Math.max(position.value.max_x, key.x)
      position.value.max_y = Math.max(position.value.max_y, key.y)
      position.value.min_x = Math.min(position.value.min_x, key.x)
      position.value.min_y = Math.min(position.value.min_y, key.y)
      position.value.last_width = key.width
      position.value.last_height = key.height
    }
  }

  return {
    currLayer,
    currKey,
    replaceKey,
    clearSelectedProps,
    position,
    getPosition,
  }
})
