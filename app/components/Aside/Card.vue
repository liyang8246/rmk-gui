<script lang="ts" setup>
const {
  name,
  icon,
  selected = false,
} = defineProps<{
  name: string
  icon: string
  selected?: boolean
}>()

const cardClasses = computed(() => {
  return selected
    ? 'bg-primary-50 dark:bg-primary-900 shadow-sm shadow-primary-300 dark:shadow-primary-950 text-primary-500 dark:text-primary-300'
    : 'bg-surface-100 dark:bg-surface-900 text-surface-700 dark:text-surface-300'
})
</script>

<template>
  <div
    v-ripple
    class="ripple-box cardClasses rounded-prime-xl w-full border-0 p-3 transition-all duration-100" :class="[cardClasses]"
  >
    <div class="flex ">
      <Icon :name="icon" class="mr-2 text-2xl" />
      <span class="font-bold"> {{ name }} </span>
    </div>
  </div>
</template>
