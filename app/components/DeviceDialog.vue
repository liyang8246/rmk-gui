<script setup lang="ts">
import type { ResultAsync } from 'neverthrow'
import type { KeyboardError } from '~/stores/keyboard/errors'
import { describeKeyboardError } from '~/stores/keyboard/errors'

const open = defineModel<boolean>('open', { default: false })

const DANGER_BUTTON = 'rounded-md px-3 py-1.5 text-sm font-medium text-error ring-1 ring-error/30 hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error'
const SECONDARY_BUTTON = 'rounded-md px-3 py-1.5 text-sm font-medium text-content-muted ring-1 ring-border hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content'

const keyboard = useKeyboardStore()
const toast = useToast()

const info = computed(() => keyboard.device?.info ?? null)
const capabilities = computed(() => keyboard.device?.capabilities ?? null)
const deviceName = computed(() => info.value?.product_name.trim() || 'Device')

// The store drops the device on disconnect; a dialog showing stale data must go with it.
watch(() => keyboard.device, (device) => {
  if (!device) open.value = false
})

const identity = computed(() => {
  const device = info.value
  if (!device) return []
  const hex = (value: number) => `0x${value.toString(16).padStart(4, '0')}`
  return [
    { label: 'Firmware', value: `v${device.rmk_version.major}.${device.rmk_version.minor}.${device.rmk_version.patch}` },
    { label: 'Manufacturer', value: device.manufacturer || 'unknown' },
    { label: 'Serial number', value: device.serial_number || 'unknown' },
    { label: 'Vendor', value: hex(device.vendor_id) },
    { label: 'Product', value: hex(device.product_id) },
  ]
})

const features = computed(() => {
  const caps = capabilities.value
  if (!caps) return []
  const list = [
    `${caps.num_layers} layers`,
    `${caps.num_rows}×${caps.num_cols} matrix`,
    `${caps.num_encoders} encoders`,
    `${caps.max_combos} combos`,
    `${caps.max_morse} morses`,
    `${caps.max_forks} forks`,
  ]
  if (caps.ble_enabled) list.push(`${caps.num_ble_profiles} BLE profiles`)
  if (caps.is_split) list.push(`${caps.num_split_peripherals} peripherals`)
  return list
})

interface ActionSpec {
  title: string
  description: string
  confirmText: string
  success: string
  failure: string
  /** Keep the dialog open when the device stays usable. */
  keepOpen?: boolean
  run: () => ResultAsync<void, KeyboardError>
}

const pending = ref<ActionSpec | null>(null)
const confirming = ref(false)

function ask(spec: ActionSpec) {
  pending.value = spec
  confirming.value = true
}

async function runPending() {
  const spec = pending.value
  confirming.value = false
  if (!spec) return

  const result = await spec.run()
  result.match(
    () => {
      toast.success(spec.success)
      if (!spec.keepOpen) open.value = false
    },
    error => toast.error(spec.failure, describeKeyboardError(error)),
  )
}

function reboot() {
  ask({
    title: 'Reboot the keyboard?',
    description: 'The keyboard restarts and disconnects. Reconnect it afterwards.',
    confirmText: 'Reboot',
    success: 'Reboot command sent',
    failure: 'Could not reboot the keyboard',
    run: () => keyboard.reboot(),
  })
}

function enterBootloader() {
  ask({
    title: 'Enter bootloader mode?',
    description: 'The keyboard disconnects and waits for a firmware update. Re-plug it to leave bootloader mode.',
    confirmText: 'Enter bootloader',
    success: 'Bootloader jump command sent',
    failure: 'Could not enter bootloader mode',
    run: () => keyboard.bootloaderJump(),
  })
}

function resetStorage(mode: 'Full' | 'LayoutOnly') {
  const label = mode === 'Full' ? 'Factory reset' : 'Reset layout'
  ask({
    title: `${label}?`,
    description: mode === 'Full'
      ? 'Erases the whole stored configuration on the keyboard. This cannot be undone.'
      : 'Erases the stored layout configuration on the keyboard. This cannot be undone.',
    confirmText: label,
    success: mode === 'Full' ? 'Storage reset complete' : 'Layout reset complete',
    failure: `${label} failed`,
    keepOpen: true,
    run: () => keyboard.storageReset(mode),
  })
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="deviceName"
    description="Connected keyboard"
  >
    <section>
      <h3 class="text-xs font-medium tracking-wide text-content-muted uppercase">
        Identity
      </h3>
      <dl class="mt-2 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-sm">
        <template v-for="row in identity" :key="row.label">
          <dt class="text-content-muted">
            {{ row.label }}
          </dt>
          <dd class="truncate text-content">
            {{ row.value }}
          </dd>
        </template>
      </dl>
    </section>

    <section class="mt-6">
      <h3 class="text-xs font-medium tracking-wide text-content-muted uppercase">
        Capabilities
      </h3>
      <ul class="mt-2 flex flex-wrap gap-1.5">
        <li
          v-for="feature in features"
          :key="feature"
          class="rounded-full bg-base-200 px-2.5 py-1 text-xs text-content-muted"
        >
          {{ feature }}
        </li>
      </ul>
    </section>

    <section class="mt-6 rounded-lg ring-1 ring-error/30">
      <div class="border-b border-error/20 px-4 py-3">
        <h3 class="text-sm font-medium text-error">
          Danger zone
        </h3>
        <p class="mt-0.5 text-xs text-content-muted">
          These commands interrupt or erase the keyboard state.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 p-4">
        <button
          type="button"
          :class="DANGER_BUTTON"
          @click="reboot"
        >
          Reboot
        </button>
        <button
          type="button"
          :class="DANGER_BUTTON"
          @click="enterBootloader"
        >
          Enter bootloader
        </button>
        <template v-if="capabilities?.storage_enabled">
          <button
            type="button"
            :class="DANGER_BUTTON"
            @click="resetStorage('LayoutOnly')"
          >
            Reset layout
          </button>
          <button
            type="button"
            :class="DANGER_BUTTON"
            @click="resetStorage('Full')"
          >
            Factory reset
          </button>
        </template>
      </div>
    </section>

    <template #footer>
      <button
        type="button"
        :class="SECONDARY_BUTTON"
        @click="open = false"
      >
        Close
      </button>
    </template>
  </Modal>

  <Modal
    :open="confirming"
    :title="pending?.title ?? ''"
    :description="pending?.description"
    @update:open="confirming = $event"
  >
    <template #footer>
      <button
        type="button"
        :class="SECONDARY_BUTTON"
        @click="confirming = false"
      >
        Cancel
      </button>
      <button
        type="button"
        :class="DANGER_BUTTON"
        @click="runPending"
      >
        {{ pending?.confirmText }}
      </button>
    </template>
  </Modal>
</template>
