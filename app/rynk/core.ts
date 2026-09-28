export interface JsByteLink {
  send: (frame: Uint8Array) => Promise<void>
  recv: () => Promise<Uint8Array>
  close: () => Promise<void>
  readonly label: string
}

export async function connect(link: JsByteLink) {
  const core = await import('./wasm/rynk_wasm.js')
  await core.default()
  return core.connect(link)
}

export type * from './wasm/rynk_wasm.js'
