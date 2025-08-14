export interface TauriStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}
export interface WebStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
