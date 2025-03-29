<script lang="ts" setup>
const router = useRouter();

const selectedPage = ref('/');
watch(selectedPage, (newValue) => {
  router.push(newValue);
});

const items = [
  { icon: 'material-symbols:home', label: 'Home', value: '/' },
  { icon: 'material-symbols:format-shapes-rounded', label: 'Keymap', value: 'keymap' },
  { icon: 'material-symbols:autoplay', label: 'Macro', value: 'macro' },
  { icon: 'material-symbols:arrow-circle-up', label: 'OTA', value: 'ota' },
  { icon: 'material-symbols:settings', label: 'Setting', value: 'setting' },
];
</script>

<template>
  <div class="flex flex-col items-center bg-base-100 min-w-48 border-r border-base-300">
    <img src="~/assets/rmk_logo.png" class="h-16 mx-auto" />
    <!-- items -->
    <label
      v-for="item in items"
      class="outline outline-2 hover:bg-base-200 outline-base-100 rounded-lg mt-3 cursor-pointer"
      :class="{ 'outline-primary': selectedPage == item.value }"
    >
      <div class="flex justify-start items-center py-2 px-4">
        <input type="radio" :value="item.value" v-model="selectedPage" class="hidden" />
        <Icon :name="item.icon" class="text-2xl mr-3" />
        <span class="w-16 text-center font-bold">{{ item.label }}</span>
      </div>
    </label>
  </div>
</template>
