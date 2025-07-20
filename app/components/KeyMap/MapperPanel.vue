<script lang="ts" setup>
</script>

<template>
  <template
    v-for="(i, index) in Object.keys(keyCodeMap).filter(
      (key) => !isNaN(Number(key)),
    )" :key="index"
  >
    <KeyMapMappingKey :key-value="keyToRmk(Number(i))" />
  </template>
</template>
