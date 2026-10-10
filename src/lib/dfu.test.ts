import type { DfuTarget } from './dfu'
import { describe, expect, it, vi } from 'vitest'
import { detach, DetachRefused, DFU_STATE, DfuError, download, transferSizeOf } from './dfu'

/// rmk-bootloader's USB side as the host sees it: one block in flight at a
/// time, `dfuDNBUSY` while the session task works, `dfuMANIFEST` once the
/// final verification passes, and a restart on the request after that.
class FakeBootloader implements DfuTarget {
  readonly label = 'fake'
  readonly transferSize = 512
  state: number = DFU_STATE.dfuIdle
  status = 0
  /// GETSTATUS polls left before the current block reports done.
  busyFor = 0
  received: number[] = []
  blocks: number[] = []
  restarted = false
  /// Block index that fails, and how.
  failAt: { block: number, status: number } | null = null
  manifested = false
  statusAfterManifest = 0

  constructor(readonly busyPolls = 0) {}

  async out(request: number, value: number, data?: Uint8Array): Promise<void> {
    if (this.manifested) {
      this.restarted = true
      throw new Error('device gone')
    }
    switch (request) {
      case 1: { // DNLOAD
        if (value !== this.blocks.length) {
          this.state = DFU_STATE.error
          this.status = 0x0E
          throw new Error('stall')
        }
        this.blocks.push(data?.length ?? 0)
        if (this.failAt?.block === value) {
          this.status = this.failAt.status
          this.state = DFU_STATE.error
          return
        }
        if (data && data.length > 0) {
          this.received.push(...data)
          this.state = DFU_STATE.dnBusy
          this.busyFor = this.busyPolls
        }
        else {
          // Verification: busy, then manifest.
          this.state = DFU_STATE.manifestSync
          this.busyFor = this.busyPolls
        }
        return
      }
      case 4: // CLRSTATUS
      case 6: // ABORT
        this.state = DFU_STATE.dfuIdle
        this.status = 0
        this.blocks = []
        this.received = []
        return
      default:
        throw new Error(`unexpected OUT ${request}`)
    }
  }

  async in(request: number, _value: number, _length: number): Promise<Uint8Array> {
    if (request !== 3) throw new Error(`unexpected IN ${request}`)
    if (this.manifested) {
      this.statusAfterManifest++
      this.restarted = true
      throw new Error('device gone')
    }
    if (this.state === DFU_STATE.dnBusy || this.state === DFU_STATE.manifestSync) {
      if (this.busyFor > 0) {
        this.busyFor--
        return new Uint8Array([0, 10, 0, 0, DFU_STATE.dnBusy, 0])
      }
      if (this.state === DFU_STATE.dnBusy) {
        this.state = DFU_STATE.dnloadIdle
      }
      else {
        this.state = DFU_STATE.manifest
        this.manifested = true
        return new Uint8Array([0, 0, 0, 0, DFU_STATE.manifest, 0])
      }
    }
    return new Uint8Array([this.status, 0, 0, 0, this.state, 0])
  }

  async restart(): Promise<void> {
    this.restarted = true
  }

  async close(): Promise<void> {}
}

async function noSleep(): Promise<void> {}

function image(length: number): Uint8Array {
  return Uint8Array.from({ length }, (_, i) => i & 0xFF)
}

function hex(s: string): Uint8Array {
  return Uint8Array.from(s.split(' ').map(b => Number.parseInt(b, 16)))
}

describe('download', () => {
  it('sends the image in transfer-size blocks and ends with an empty one', async () => {
    const device = new FakeBootloader()
    const fw = image(1300)
    const progress: number[] = []
    await download(device, fw, sent => progress.push(sent), noSleep)
    expect(device.blocks).toEqual([512, 512, 276, 0])
    expect(Uint8Array.from(device.received)).toEqual(fw)
    expect(progress).toEqual([512, 1024, 1300])
    expect(device.restarted).toBe(true)
    expect(device.statusAfterManifest).toBe(0)
  })

  it('restarts through GETSTATUS when USB reset is unsupported', async () => {
    const device = new FakeBootloader()
    vi.spyOn(device, 'restart').mockRejectedValue(new Error('reset not supported by WinUSB'))
    await download(device, image(100), undefined, noSleep)
    expect(device.restarted).toBe(true)
    expect(device.statusAfterManifest).toBe(1)
  })

  it('accepts a disconnect after the installed image starts rebooting', async () => {
    const device = new FakeBootloader()
    vi.spyOn(device, 'restart').mockImplementation(async () => {
      device.restarted = true
      throw new Error('device gone')
    })
    await expect(download(device, image(100), undefined, noSleep)).resolves.toBeUndefined()
    expect(device.restarted).toBe(true)
  })

  it('waits out dfuDNBUSY for as long as the device asks', async () => {
    const device = new FakeBootloader(3)
    const waits: number[] = []
    await download(device, image(600), undefined, async (ms) => {
      waits.push(ms)
    })
    // Two data blocks and the verification each report busy three times.
    expect(waits).toEqual(Array.from({ length: 9 }).fill(10))
    expect(device.blocks).toEqual([512, 88, 0])
  })

  it.each([1, 2])('surfaces failure at block %i without restarting', async (block) => {
    const device = new FakeBootloader()
    device.failAt = { block, status: 0x07 }
    const restart = vi.spyOn(device, 'restart')
    const err = await download(device, image(1024), undefined, noSleep).catch(e => e)
    expect(err).toBeInstanceOf(DfuError)
    expect((err as DfuError).status).toBe(0x07)
    expect((err as DfuError).message).toMatch(/errVERIFY/)
    expect(device.restarted).toBe(false)
    expect(device.statusAfterManifest).toBe(0)
    expect(restart).not.toHaveBeenCalled()
  })

  it('clears a previous failure before starting over', async () => {
    const device = new FakeBootloader()
    device.state = DFU_STATE.error
    device.status = 0x07
    await download(device, image(100), undefined, noSleep)
    expect(device.blocks).toEqual([100, 0])
  })

  it('aborts an unfinished download before starting over', async () => {
    const device = new FakeBootloader()
    device.state = DFU_STATE.dnloadIdle
    device.blocks = [512]
    await download(device, image(100), undefined, noSleep)
    expect(device.blocks).toEqual([100, 0])
  })

  it('refuses an empty image', async () => {
    const device = new FakeBootloader()
    await expect(download(device, new Uint8Array(0), undefined, noSleep)).rejects.toThrow(/empty/)
    expect(device.blocks).toEqual([])
  })
})

describe('detach', () => {
  /// An application's runtime interface: `honours` decides whether DETACH
  /// resets the device (every later request fails) or stalls.
  function application(honours: boolean): DfuTarget & { requests: number[] } {
    let gone = false
    return {
      label: 'app',
      transferSize: 64,
      requests: [],
      async out(request) {
        this.requests.push(request)
        if (gone) throw new Error('device gone')
        if (!honours) throw new Error('rejected: stall')
        gone = true
        throw new Error('device gone')
      },
      async in() {
        if (gone) throw new Error('device gone')
        return new Uint8Array(6)
      },
      restart: async () => {},
      close: async () => {},
    }
  }

  it('sends DFU_DETACH and treats the device vanishing as success', async () => {
    const app = application(true)
    await expect(detach(app, noSleep)).resolves.toBeUndefined()
    expect(app.requests).toEqual([0])
  })

  it('reports a refusal when the device is still answering afterwards', async () => {
    const app = application(false)
    await expect(detach(app, noSleep)).rejects.toBeInstanceOf(DetachRefused)
  })
})

describe('transferSizeOf', () => {
  /// A configuration with one DFU interface: config, interface, DFU functional
  /// (wTransferSize 0x0200 at its bytes 5–6).
  const config = hex(
    '09 02 1b 00 01 01 00 80 32 '
    + '09 04 00 00 00 fe 01 02 00 '
    + '09 21 09 c4 09 00 02 10 01',
  )

  it('reads wTransferSize from the DFU functional descriptor', () => {
    expect(transferSizeOf(config)).toBe(512)
  })

  it('is null without one', () => {
    expect(transferSizeOf(config.subarray(0, 18))).toBeNull()
    expect(transferSizeOf(new Uint8Array([0, 0]))).toBeNull()
  })
})
