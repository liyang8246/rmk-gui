<script lang="ts" setup>
const { keys, keySize = 50 } = defineProps<{
  keys: Key[]
  highlight?: StringSet<[number, number]>
  keySize?: number
}>()
const keyPadding = computed(() => keySize * 0.13) // Magic Keyboard`s margin ratio
</script>

<template>
  <div class="relative">
    <key
      v-for="key in keys" :key="`${key.position}`" :keys="key.info.symbol" :key-margin="0" :default-key-size="keySize - keyPadding" :style="{
        position: 'absolute',
        top: `${key.geometry.y * keySize}px`,
        left: `${key.geometry.x * keySize}px`,
        transform: `rotate(${key.geometry.rotation_angle}deg)`,
        transformOrigin: `${(key.geometry.rotation_x - key.geometry.x) * keySize}px ${(key.geometry.rotation_y - key.geometry.y) * keySize}px}`,
      }"
      @click="(e) => console.log(e)"
    />
  </div>
</template>
