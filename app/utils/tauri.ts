export function isTauri(): boolean {
  return typeof window !== "undefined" && typeof (window as any).__TAURI__ !== "undefined";
}
