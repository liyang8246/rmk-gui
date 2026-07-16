import type { RynkClient } from '../rynk/wasm/rynk_wasm.js'
import type { KeyboardStatus } from './keyboard'
import { reconcile } from 'solid-js/store'
import { clientHolder, eventQueue, setStore, setWakeDriver, store } from './keyboard'
import { commitShadow, reapplyChanges, rollbackToShadow, sendChanges } from './sync'

let running = false
let stopped = false
let wakeFn: (() => void) | null = null

setWakeDriver(() => wakeFn?.())

export function startDriver() {
  if (running) return
  running = true
  stopped = false
  driverLoop()
}

export function stopDriver() {
  stopped = true
  running = false
}

const rotatedPollers: { key: keyof KeyboardStatus, poll: (c: RynkClient) => Promise<unknown>, enabled: () => boolean }[] = [
  { key: 'connection', poll: c => c.get_connection_status(), enabled: () => true },
  { key: 'battery', poll: c => c.get_battery_status(), enabled: () => store.device?.capabilities.ble_enabled ?? false },
  { key: 'bleStatus', poll: c => c.get_ble_status(), enabled: () => store.device?.capabilities.ble_enabled ?? false },
  { key: 'matrixState', poll: c => c.get_matrix_state(), enabled: () => true },
  { key: 'ledIndicator', poll: c => c.get_led_indicator(), enabled: () => true },
  { key: 'sleepState', poll: c => c.get_sleep_state(), enabled: () => true },
  { key: 'wpm', poll: c => c.get_wpm(), enabled: () => true },
  { key: 'lockStatus', poll: c => c.get_lock_status(), enabled: () => true },
]
let pollIdx = 0

async function driverLoop() {
  while (!stopped) {
    const c = clientHolder.client
    if (!c || !store.connection) break

    // 1. Drain sync queue (high priority, no sleep while pending)
    if (eventQueue.length > 0) {
      const event = eventQueue.shift()!
      setStore('sync', 'syncing', true)
      try {
        reapplyChanges(event.changes)
        const caps = store.device!.capabilities
        await sendChanges(c, event.changes, caps)
        commitShadow(event.changes)
      } catch (err) {
        rollbackToShadow(event.changes)
        setStore('sync', 'errors', prev => [
          ...prev.slice(-9),
          { slice: event.changes[0]?.slice ?? 'unknown', error: String(err), timestamp: Date.now() },
        ])
      } finally {
        setStore('sync', 'syncing', false)
      }
      continue
    }

    // 2. Poll currentLayer every iteration + one rotated field
    try {
      const layer = await c.get_current_layer()
      setStore('status', 'currentLayer', layer)

      const poller = pickRotated()
      if (poller) {
        const value = await poller.poll(c)
        setStore('status', poller.key, reconcile(value as never))
      }
    } catch {
      handleDisconnect()
      break
    }

    try {
      const dropped = c.events_dropped()
      if (dropped > (store.status.eventsDropped ?? 0)) {
        setStore('status', 'eventsDropped', dropped)
      }
    } catch { /* ignore */ }

    if (eventQueue.length === 0) {
      await sleep(500)
    }
  }
  running = false
}

function pickRotated() {
  for (let i = 0; i < rotatedPollers.length; i++) {
    const p = rotatedPollers[(pollIdx + i) % rotatedPollers.length]
    if (p.enabled()) {
      pollIdx = ((pollIdx + i + 1) % rotatedPollers.length)
      return p
    }
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    wakeFn = () => {
      clearTimeout(timer)
      resolve()
    }
  })
}

function handleDisconnect() {
  setStore('connection', null)
  eventQueue.length = 0
  stopped = true
}
