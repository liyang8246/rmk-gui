<script lang="ts" setup>
const pageMacrosStore = usePageMacrosStore()
const fake = ref(['data', 'data', 'data'])

function delMacro(index: number) {
  fake.value.splice(index, 1)
  pageMacrosStore.operation.splice(index, 1)
}
function addMacro() {
  fake.value.push('data')
  pageMacrosStore.operation.push('')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1 w-full">
    <template v-for=" i, index in fake" :key="index">
      <div class="flex h-12 w-full px-4 items-center justify-between rounded-prime-md bg-surface-300">
        <div class="flex items-center justify-start gap-2 w-full h-full">
          <span><i class="pi pi-caret-up w-4 h-4 text-2xl" /></span>
          <span><i class="pi pi-caret-down w-4 h-4 text-2xl" /></span>
          <MacrosSelect :index="index" />
          <div>
            {{ pageMacrosStore.operation[index] }}三种情况(text)(up,down,tap)(delay)下的不同获取数据的方式
          </div>
        </div>
        <span
          class="rounded-prime-md w-6 h-6 flex justify-center items-center cursor-pointer transition-colors duration-200 hover:text-surface-400"
          @click="delMacro(index)"
        ><i class="pi pi-times w-4 h-4 text-2xl" /></span>
      </div>
    </template>
    <div class="flex justify-start items-start h-12 w-full  gap-1">
      <span class="rounded-prime-md bg-surface-300 py-1 px-2 cursor-pointer" @click="addMacro()">add</span>
      <span class="rounded-prime-md bg-surface-300 py-1 px-2 cursor-pointer">save</span>
    </div>
  </div>
</template>
