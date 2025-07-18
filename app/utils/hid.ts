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
  private pendingRequests: Map<number, { resolve: (value: Uint8Array) => void, reject: (reason: any) => void, timeout: ReturnType<typeof setTimeout> }> = new Map()
  private nextRequestId = 1

  constructor(private device: HIDDevice) {
    this.device.addEventListener('inputreport', this.handleInputReport.bind(this))
  }

  private handleInputReport(event: HIDInputReportEvent): void {
    if (event.reportId === 0) {
      const data = new Uint8Array(event.data.buffer)
      if (this.pendingRequests.size > 0) {
        const requestId = this.pendingRequests.keys().next().value as number
        const request = this.pendingRequests.get(requestId)
        if (request) {
          this.pendingRequests.delete(requestId)
          clearTimeout(request.timeout)
          request.resolve(data)
        }
      }
    }
  }

  isConnected(): boolean {
    return this.device?.opened || false
  }

  async productName(): Promise<string> {
    return this.device.productName || 'Unknown WebHID Device'
  }

  async writeRead(data: number[]): Promise<Uint8Array> {
    if (!this.isConnected())
      throw new Error('Device not connected')

    return new Promise<Uint8Array>((resolve, reject) => {
      const requestId = this.nextRequestId++

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('Device response timeout'))
      }, 1000)

      this.pendingRequests.set(requestId, { resolve, reject, timeout })

      this.device.sendReport(0, new Uint8Array(data)).catch((err) => {
        this.pendingRequests.delete(requestId)
        clearTimeout(timeout)
        reject(err)
      })
    })
  }

  async disconnect(): Promise<void> {
    // 清理所有待处理的请求
    for (const request of this.pendingRequests.values()) {
      clearTimeout(request.timeout)
      request.reject(new Error('Device disconnected'))
    }
    this.pendingRequests.clear()

    // 移除事件监听器
    this.device.removeEventListener('inputreport', this.handleInputReport.bind(this))

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
