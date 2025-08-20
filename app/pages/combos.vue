<script lang="ts" setup>
const combosCount = ref(8)
const currCombos = ref(0)
const currKey = ref<[number, number, number, 'outer' | 'inner' | null]>([0, 0, 0, null])
const showMapperPanel = ref(false)
function clearSelectedProps() {
  currKey.value = [0, 0, 0, null]
  showMapperPanel.value = false
}

const keyList = ref<[string | null, string | null][][][]>([
  [[[null, 'A'], [null, 'A'], [null, 'A'], [null, 'A'], [null, 'A']]],
  [[[null, 'B'], [null, 'B'], [null, 'B'], [null, 'B'], [null, 'B']]],
  [[[null, 'C'], [null, 'C'], [null, 'C'], [null, 'C'], [null, 'C']]],
  [[[null, 'D'], [null, 'D'], [null, 'D'], [null, 'D'], [null, 'D']]],
  [[[null, 'E'], [null, 'E'], [null, 'E'], [null, 'E'], [null, 'E']]],
  [[[null, 'F'], [null, 'F'], [null, 'F'], [null, 'F'], [null, 'F']]],
  [[[null, 'G'], [null, 'G'], [null, 'G'], [null, 'G'], [null, 'G']]],
  [[[null, 'H'], [null, 'H'], [null, 'H'], [null, 'H'], [null, 'H']]],
])

const replaceKey = ref<number | null>(null)
function setMapperKeycode(key: number) {
  replaceKey.value = key
  // 替换键后清空操作
  clearSelectedProps()
  replaceKey.value = null
}
function setKeycode(zone: 'outer' | 'inner', row: number, col: number) {
  currKey.value = [currCombos.value, row, col, zone]
  showMapperPanel.value = true
}
function selectKeycode(row: number, col: number) {
  return currKey.value[1] === row && currKey.value[2] === col ? currKey.value[3] : null
}
</script>

<template>
  <div
    class="flex size-full flex-auto flex-col items-center justify-around gap-3 overflow-hidden p-3 text-surface-500 dark:text-surface-400"
    @click="clearSelectedProps()"
  >
    <div class="flex w-full items-start justify-start">
      <Switcher text="Combos" :count="combosCount" :layer="currCombos" @change="currCombos = $event" />
    </div>
    <div class="rounded-prime-md flex size-full items-center justify-center gap-6 overflow-hidden transition-all duration-200">
      <div v-for="list, list_index in keyList[currCombos]" :key="list_index" class="grid grid-cols-2 gap-2">
        <div class="flex flex-col items-center justify-around gap-2">
          <template v-for="(keyCode, keyCodes_index) in list" :key="keyCodes_index">
            <span v-if="keyCodes_index < list.length - 1" class="h-42px flex items-center justify-center">key{{ keyCodes_index }}</span>
          </template>
          <span class="h-42px flex items-center justify-center">outputKey</span>
        </div>
        <div class="flex flex-col items-center justify-start gap-2">
          <template v-for="(keyCode, keyCodes_index) in list" :key="keyCodes_index">
            <KeyMapKey
              :keys="keyCode"
              :select="selectKeycode(list_index, keyCodes_index)"
              @click="setKeycode($event, list_index, keyCodes_index)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
  <MapperDialog :show="showMapperPanel" @clear-currkey="clearSelectedProps()" @set-keycode="setMapperKeycode" />
</template>
