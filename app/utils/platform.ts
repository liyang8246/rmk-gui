export function isTauri(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).__TAURI__ !== 'undefined'
}

export function hidSupport(): boolean {
  return isTauri() || 'hid' in navigator
}
