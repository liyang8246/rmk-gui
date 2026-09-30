<script setup lang="ts">
const toast = useToast()

const isDev = import.meta.dev
const showModal = ref(false)
const showDevice = ref(false)

const BUTTON = 'rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900'

function burst() {
  for (let i = 1; i <= 6; i++) toast.info(`Toast ${i}`)
}
</script>

<template>
  <section v-if="isDev" class="mt-8 max-w-md rounded-lg border border-dashed border-neutral-300 p-4">
    <h2 class="text-xs font-medium tracking-wide text-neutral-400 uppercase">
      Debug
    </h2>

    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" :class="BUTTON" @click="toast.success('Saved', 'Keymap written to the keyboard')">
        Success
      </button>
      <button type="button" :class="BUTTON" @click="toast.error('Scan failed', 'link lost')">
        Error
      </button>
      <button type="button" :class="BUTTON" @click="toast.info('Scanning for devices…')">
        Info
      </button>
      <button
        type="button"
        :class="BUTTON"
        @click="toast.add({ title: 'Tap a key to test', description: 'Stays until dismissed', variant: 'info', duration: 0 })"
      >
        Persistent
      </button>
      <button type="button" :class="BUTTON" @click="burst">
        Burst ×6
      </button>
      <button type="button" :class="BUTTON" @click="showModal = true">
        Modal
      </button>
      <button type="button" :class="BUTTON" @click="showDevice = true">
        Device dialog
      </button>
    </div>

    <Modal
      v-model:open="showModal"
      title="Sample modal"
      description="Declarative usage of the Modal base component."
    >
      <p class="text-sm text-neutral-600">
        Body content goes in the default slot. Esc, the close button and a backdrop click all dismiss.
      </p>
      <template #footer>
        <button type="button" :class="BUTTON" @click="showModal = false">
          Close
        </button>
      </template>
    </Modal>

    <DeviceDialog v-model:open="showDevice" />
  </section>
</template>
