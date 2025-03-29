<script lang="ts" setup>
const keyboard = useKeyboardStore();
const pageKeymap = usePageKeymap();
const selectedLyrRowCol = ref<[number, number, number]>([0, 1, 1]);

const selectKey = (key: Key) => {
  pageKeymap.selectedLyrRowCol = key.lyr_row_col;
};

const containerSize = computed(() => {
  let width = 0;
  let height = 0;
  keyboard.keyboard.keys.forEach((key) => {
    let vertexs: [number, number][] = [
      // rectangle 1
      [key.position_x[0], key.position_y[0]],
      [key.position_x[0] + key.width[0], key.position_y[0]],
      [key.position_x[0] + key.width[0], key.position_y[0] + key.height[0]],
      [key.position_x[0], key.position_y[0] + key.height[0]],
      // rectangle 2
      [key.position_x[0] + key.position_x[1], key.position_y[0] + key.position_y[1]],
      [key.position_x[0] + key.position_x[1] + key.width[1], key.position_y[0] + key.position_y[1]],
      [key.position_x[0] + key.position_x[1] + key.width[1], key.position_y[0] + key.position_y[1] + key.height[1]],
      [key.position_x[0] + key.position_x[1], key.position_y[0] + key.position_y[1] + key.height[1]],
    ];
    vertexs.forEach((vertex) => {
      let [angle, centerX, centerY] = key.rotation;
      let [x, y] = vertex;
      angle = (angle * Math.PI) / 180;
      const offsetX = x - centerX;
      const offsetY = y - centerY;
      x = centerX + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
      y = centerY + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
      width = Math.max(width, x);
      height = Math.max(height, y);
    });
  });
  return { width: width * 58, height: height * 58 };
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
          v-if="key.lyr_row_col[0] === pageKeymap.selectedLayer"
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
