<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
function setKeycode(zone: 'outer' | 'inner', key: [number, number, number, string | null, string | null]) {
  pageKeymapStore.replaceKey = [...key, zone]
}
</script>

<template>
  <template v-for="i in keyCodeMap" :key="i.symbol">
    <div class="cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300">
      <KeyMapKey :keys="i.symbol" :select="pageKeymapStore.replaceKey" @click="setKeycode" />
    </div>
  </template>
</template>
