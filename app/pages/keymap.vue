<script lang="ts" setup>
const keyboardStore = useKeyboardStore()

const currLayer = ref('0')
const currKey = ref<StringMap<[number, number], 'outer' | 'inner'>>(new StringMap())
const keys = computed(() =>
  keyboardStore.fetchKeyList(Number.parseInt(currLayer.value)),
)
const layerOption = Array.from({ length: keyboardStore.layerCount! }, (_, i) => i.toString())

function handleSelected(key: Key, zone: 'outer' | 'inner') {
  const pos: [number, number] = [key.position.row, key.position.col]
  if (currKey.value.has(pos)) {
    currKey.value.clear()
  }
  else {
    currKey.value.clear()
    currKey.value.set(pos, zone)
  }
}
</script>

<template>
  <div class="p-3">
    <SelectButton v-model="currLayer" :allow-empty="false" :options="layerOption" size="small" />
    <div class="flex h-full flex-col items-center justify-around">
      <Keyboard :keys="keys" :highlight="currKey" @click="handleSelected" />
      <MapperPanel />
    </div>
  </div>
</template>
