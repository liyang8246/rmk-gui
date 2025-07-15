export class WebHIDApi implements HIDApi {
  async listDevices(): Promise<any[]> {
    return navigator.hid.requestDevice({
      filters: [VialConstants.HIDFilter],
    })
  }

  async connectDevice(device: HIDDevice): Promise<HIDInterface> {
    if (!device)
      throw new Error('No device provided')
    await device.open()
    return new WebHIDDevice(device)
  }
}

export class WebHIDDevice implements HIDInterface {
  constructor(private device: HIDDevice) {}

  isConnected(): boolean {
    return this.device?.opened || false
  }

  async productName(): Promise<string> {
    return this.device.productName || 'Unknown WebHID Device'
  }

  // ai 生成的
  async writeRead(data: number[]): Promise<Uint8Array> {
    if (!this.isConnected())
      throw new Error('Device not connected')

    return new Promise<Uint8Array>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>
      const handler = (event: HIDInputReportEvent) => {
        if (event.reportId === 0) {
          // 根据设备描述匹配报告ID
          clearTimeout(timeout)
          this.device.removeEventListener('inputreport', handler)
          resolve(new Uint8Array(event.data.buffer))
        }
      }
      timeout = setTimeout(() => {
        this.device.removeEventListener('inputreport', handler)
        reject(new Error('Device response timeout'))
      }, 1000)
      this.device.addEventListener('inputreport', handler)

      this.device.sendReport(0, new Uint8Array(data)).catch((err) => {
        clearTimeout(timeout)
        this.device.removeEventListener('inputreport', handler)
        reject(err)
      })
    })
  }

  async disconnect(): Promise<void> {
    if (this.device?.opened) {
      await this.device.close()
    }
  }
}

export class TauriHIDApi implements HIDApi {
  async listDevices(): Promise<any[]> {
    return await invoke('list')
  }

  async connectDevice(device: number[]): Promise<HIDInterface> {
    if (!device)
      throw new Error('No device provided')
    await invoke('connect', { path: device })
    return new TauriHIDDevice()
  }
}

export class TauriHIDDevice implements HIDInterface {
  private connected = true

  isConnected(): boolean {
    return this.connected
  }

  async productName(): Promise<string> {
    return await invoke('product_name')
  }

  async writeRead(data: number[]): Promise<Uint8Array> {
    if (!this.connected)
      throw new Error('Device not connected')

    const result: number[] = await invoke('write_read', {
      data: Array.from(data),
    })
    return new Uint8Array(result)
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await invoke('disconnect')
      this.connected = false
    }
  }
}
