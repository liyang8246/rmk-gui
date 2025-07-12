<script lang="ts" setup>
const {
  name,
  icon,
  selected = false,
} = defineProps<{
  name: string;
  icon: string;
  selected?: boolean;
}>();

const cardClasses = computed(() => {
  return selected ? "bg-surface-0 dark:bg-black shadow" : "bg-surface-100 dark:bg-surface-900";
});
</script>

<template>
  <div
    v-ripple
    :class="['ripple-box cardClasses rounded-prime-xl w-full border-0 p-3 transition-all duration-100', cardClasses]"
  >
    <div class="flex text-surface-700 dark:text-surface-300">
      <Icon :name="icon" class="mr-2 text-2xl" />
      <span class="font-bold"> {{ name }} </span>
    </div>
  </div>
</template>
