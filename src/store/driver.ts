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

async function driverLoop() {
  while (!stopped) {
    const c = clientHolder.client
    if (!c || !store.connection) break

    // Drain sync queue (no sleep while pending)
    if (eventQueue.length > 0) {
      const event = eventQueue.shift()!
      setStore('sync', 'queueDepth', eventQueue.length)
      setStore('sync', 'syncing', true)
      try {
        reapplyChanges(event.changes)
        const caps = store.device?.capabilities
        if (!caps) {
          handleDisconnect()
          break
        }
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

    // Queue empty — sleep until woken by editConfig
    await sleep()
  }
  running = false
}

function sleep(): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 500)
    wakeFn = () => {
      clearTimeout(timer)
      resolve()
    }
  })
}

function handleDisconnect() {
  // Free the WASM client — it may be internally dead but we can still release its memory
  if (clientHolder.client) {
    try {
      clientHolder.client[Symbol.dispose]()
    } catch { /* already dead */ }
    clientHolder.client = null
  }
  setStore('connection', null)
  eventQueue.length = 0
  stopped = true
}
