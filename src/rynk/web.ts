function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

export class WebByteLink {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private writer: WritableStreamDefaultWriter<Uint8Array>
  private rx: Uint8Array = new Uint8Array(0)
  private closed = false
  private wake: (() => void) | null = null

  constructor(port: SerialPort) {
    this.reader = port.readable!.getReader()
    this.writer = port.writable!.getWriter()
    this.pump()
  }

  private async pump() {
    while (true) {
      const { value, done } = await this.reader.read()
      if (done) break
      if (value && value.length) {
        this.rx = concat(this.rx, value)
        this.signal()
      }
    }
    this.closed = true
    this.signal()
  }

  private signal() {
    if (this.wake) {
      const w = this.wake
      this.wake = null
      w()
    }
  }

  async send(frame: Uint8Array): Promise<void> {
    await this.writer.write(frame)
  }

  async recv(): Promise<Uint8Array> {
    while (this.rx.length === 0 && !this.closed)
      await new Promise<void>((res) => { this.wake = res })
    if (this.rx.length > 0) {
      const c = this.rx
      this.rx = new Uint8Array(0)
      return c
    }
    return new Uint8Array(0)
  }

  async close(): Promise<void> {
    await this.reader.cancel()
    this.reader.releaseLock()
    await this.writer.abort()
    this.writer.releaseLock()
  }
}

export async function connectWebSerial(): Promise<WebByteLink> {
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: 115200 })
  return new WebByteLink(port)
}
