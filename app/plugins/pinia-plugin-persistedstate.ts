import type { Pinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

function createHybridStorage() {
  return {
    getItem(key: string): string | null {
      if (isTauri()) {
        return null
      }
      return localStorage.getItem(key)
    },

    setItem(key: string, value: string) {
      if (isTauri()) {
        return
      }
      localStorage.setItem(key, value)
    },

    removeItem(key: string) {
      if (isTauri()) {
        return
      }
      localStorage.removeItem(key)
    },
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    const pinia = nuxtApp.$pinia as Pinia
    const hybridStorage = createHybridStorage()

    pinia.use(createPersistedState(
      { storage: hybridStorage },
    ))
  }
})
