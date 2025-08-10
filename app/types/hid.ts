export interface HIDInterface {
  isConnected: () => boolean
  productName: () => Promise<string>
  writeRead: (data: number[]) => Promise<Uint8Array>
  disconnect: () => Promise<void>
}

export interface HIDApi {
  listDevices: () => Promise<any[]>
  connectDevice: (device: any) => Promise<HIDInterface>
}
