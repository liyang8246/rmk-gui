<script lang="ts" setup>
const keyboard = useKeyboard();
const pageKeymap = usePageKeymap();
const selectedLyrRowCol = ref<[number, number, number]>([0, 1, 1]);

const selectKey = (key: Key) => {
  pageKeymap.selectedLyrRowCol = key.lyr_row_col;
};

const containerSize = computed(() => {
  let maxWidth = 0;
  let maxHeight = 0;
  keyboard.keyboard.keys.forEach((key) => {
    const rightEdge = key.position_x[0] * 58 + key.width[0] * 58;
    const bottomEdge = key.position_y[0] * 58 + 58;
    maxWidth = Math.max(maxWidth, rightEdge);
    maxHeight = Math.max(maxHeight, bottomEdge);
  });
  return { width: maxWidth, height: maxHeight };
});
</script>

<template>
  <div>
    <div
      class="relative mx-auto mt-4 bg-base-100 outline outline-4 outline-base-100 rounded"
      :style="{
        height: `${containerSize.height}px`,
        width: `${containerSize.width}px`,
      }"
    >
      <template v-for="(key, index) in keyboard.keyboard.keys" :key="index">
        <Key
          v-if="key.lyr_row_col[0] === 0"
          :keyProp="key"
          :border="key.lyr_row_col.toString() === pageKeymap.selectedLyrRowCol.toString()"
          @click="selectKey(key)"
          :style="{
            position: 'absolute',
            left: key.position_x[0] * 58 + 'px',
            top: key.position_y[0] * 58 + 'px',
          }"
        />
      </template>
    </div>
  </div>
</template>
