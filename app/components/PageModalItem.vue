<script setup lang="ts">
import type { PageModalEntry } from '~/composables/usePageModal'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { provide } from 'vue'
import {
  PAGE_MODAL_KEY,
  usePageModalStore,
} from '~/composables/usePageModal'

const props = defineProps<{ entry: PageModalEntry }>()
const store = usePageModalStore()

const close = () => store.close(props.entry.id)
provide(PAGE_MODAL_KEY, { close })
</script>

<template>
  <DialogRoot
    open
    @update:open="(v: boolean) => { if (!v) close() }"
  >
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <DialogContent
        class="
          fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-3xl
          -translate-1/2 overflow-auto rounded-xl bg-base-100 shadow-xl ring-1
          ring-base-300
        "
      >
        <DialogTitle class="sr-only">
          Dialog
        </DialogTitle>
        <component :is="entry.component" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
