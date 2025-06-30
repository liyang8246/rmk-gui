<script lang="ts" setup>
const props = defineProps({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  selected: { type: Boolean, default: false },
});

const cardClasses = computed(() => {
  return props.selected ? "bg-surface-0 dark:bg-black shadow" : "bg-surface-100 dark:bg-surface-900";
});
</script>

<template>
  <div
    v-ripple
    :class="['ripple-box cardClasses rounded-prime-xl w-full border-0 p-3 transition-all duration-100', cardClasses]"
  >
    <div class="flex text-surface-700 dark:text-surface-300">
      <Icon :name="props.icon" class="mr-2 text-2xl" />
      <span class="font-bold"> {{ props.name }} </span>
    </div>
  </div>
</template>
