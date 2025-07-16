<script lang="ts" setup>

</script>

<template>
  <div class="flex flex-col">
    <KeyMap />
    <div class="flex flex-wrap items-start justify-center gap-1">
      <template
        v-for="(i, index) in Object.keys(KeyCode).filter(
          (key) => !isNaN(Number(key)),
        )" :key="index"
      >
        <KeyMapKeyBoard :key-value="keyToLable(Number(i))" />
      </template>
    </div>
  </div>
</template>

<style scoped></style>
