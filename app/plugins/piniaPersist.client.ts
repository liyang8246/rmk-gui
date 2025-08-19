import type { Pinia, PiniaPluginContext } from 'pinia'

declare module 'pinia' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean
    afterRestore?: (store: Store) => void
  }
}

interface StorageAdapter {
  read: (key: string) => Promise<any>
  write: (key: string, value: any) => Promise<void>
}

class LocalStorageAdapter implements StorageAdapter {
  read(key: string): Promise<any> {
    return Promise.resolve(localStorage.getItem(key))
  }

  write(key: string, value: any): Promise<void> {
    return Promise.resolve(localStorage.setItem(key, value))
  }
}

function storageAdapter(): StorageAdapter {
  return new LocalStorageAdapter()
}

function piniaPersist({ store, options }: PiniaPluginContext) {
  if (!options.persist)
    return

  const storage = storageAdapter()
  const key = `pinia-${store.$id}`

  storage.read(key).then((data) => {
    if (data) {
      store.$patch(JSON.parse(data))
    }
    options.afterRestore?.(store)
  })

  window.addEventListener('beforeunload', () => {
    storage.write(key, JSON.stringify(store.$state))
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  const $pinia = nuxtApp.$pinia as Pinia
  $pinia.use(piniaPersist)
})
