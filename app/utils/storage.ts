export async function createHybridStorage() {
  if (isTauri()) {
    const tauriStore = await import('@tauri-apps/plugin-store')
    const tauriStorage = await tauriStore.Store.load('rmk-gui.dat')
    return {
      async getItem(key: string): Promise<string | null> {
        const value = await tauriStorage.get<string>(key)
        return value === undefined ? null : value
      },

      async setItem(key: string, value: string) {
        await tauriStorage.set(key, value)
        await tauriStorage.save()
      },
    }
  }

  return {
    getItem(key: string) {
      return localStorage.getItem(key)
    },

    setItem(key: string, value: string) {
      localStorage.setItem(key, value)
    },
  }
}
