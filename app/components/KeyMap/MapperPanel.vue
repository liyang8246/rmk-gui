<script lang="ts" setup>
</script>

<template>
  <template
    v-for="(i, index) in Object.keys(KeyCode).filter(
      (key) => !isNaN(Number(key)),
    )" :key="index"
  >
    <KeyMapMappingKey :key-value="keyToConfig(Number(i))" />
  </template>
</template>

<style>

</style>
