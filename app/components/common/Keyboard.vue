<script lang="ts" setup>
const { keys, keySize = 50 } = defineProps<{
  keys: Key[]
  highlight?: StringSet<[number, number]>
  keySize?: number
}>()
const keyMargin = computed(() => keySize * 0.15) // Magic Keyboard`s margin ratio
</script>

<template>
  <div class="relative">
    <key
      v-for="key in keys" :key="`${key.position}`" :keys="key.info.symbol" @click="(e) => console.log(e)"
      :style="{
        position: 'absolute',
        top: `${key.geometry.y * keySize}px`,
        left: `${key.geometry.x * keySize}px`,
      }"
    />
  </div>
</template>
