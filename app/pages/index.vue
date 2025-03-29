<script lang="ts" setup>
const guiVersion = ref<string | null>(null);
const layerCount = ref<number | null>(null);
const keyCount = ref<number | null>(null);
const macrosCount = ref<number | null>(null);
const { keyboard } = useKeyboardStore();

onMounted(async () => {
  const [version, layers, keys, macros] = await Promise.all([
    invoke<string>('get_gui_version'),
    invoke<number>('get_layer_count'),
    invoke<number>('get_key_count'),
    invoke<number>('get_macro_count'),
  ]);
  guiVersion.value = version;
  layerCount.value = layers;
  keyboard.layer = layers;
  keyCount.value = keys;
  macrosCount.value = macros;
});
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-grow justify-center items-center">
      <div class="grid grid-cols-3 gap-2 w-fit">
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">GUI</div>
          <div>{{ guiVersion }}</div>
        </div>
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">RMK</div>
          <div>x.x.x</div>
        </div>
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">Vial</div>
          <div>x.x.x</div>
        </div>
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">Layers</div>
          <div>{{ layerCount }}</div>
        </div>
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">Keys</div>
          <div>{{ keyCount }}</div>
        </div>
        <div class="flex flex-col justify-center items-center bg-base-100 w-48 h-32 rounded-lg">
          <div class="text-2xl font-bold">Macros</div>
          <div>{{ macrosCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
