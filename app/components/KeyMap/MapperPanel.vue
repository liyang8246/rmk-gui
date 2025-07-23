<script lang="ts" setup>
const pageKeymapStore = usePageKeymapStore()
function setKeycode(zone: 'outer' | 'inner', key: [number, number, number, string | null, string | null]) {
  pageKeymapStore.replaceKey = [...key, 'outer']
}
</script>

<template>
  <div class="rounded-prime-md p-3 flex justify-center items-center bg-surface-50 overflow-hidden w-full h-full">
    <ScrollPanel class=" w-full h-full overflow-hidden">
      <div class="m-1 flex flex-wrap items-start justify-center gap-2">
        <template v-for="i in keyCodeMap" :key="i.symbol">
          <div class="cursor-pointer text-center text-xs font-bold text-surface-700 dark:text-surface-300">
            <KeyMapKey :keys="i.symbol" :select="pageKeymapStore.replaceKey" @click="setKeycode" />
          </div>
        </template>
      </div>
    </ScrollPanel>
  </div>
</template>
