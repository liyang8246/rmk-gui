/// USB DFU 1.1 download — the host half of rmk-bootloader's USB transport.
/// Pure protocol over a `DfuTarget`, so a browser (WebUSB) and a native
/// backend drive the same sequence.

/// The DFU interface class triple: a bootloader advertises the DFU-mode
/// protocol, an application that can reboot into one the runtime protocol.
export const DFU_CLASS = 0xFE
export const DFU_SUBCLASS = 0x01
export const DFU_PROTOCOL_RUNTIME = 0x01
export const DFU_PROTOCOL_MODE = 0x02

export type DfuMode = 'runtime' | 'dfu'

/// Descriptor type of the DFU functional descriptor inside the configuration.
const DESC_DFU_FUNCTIONAL = 0x21

const REQ = {
  detach: 0,
  dnload: 1,
  getStatus: 3,
  clrStatus: 4,
  abort: 6,
} as const

export const DFU_STATE = {
  dfuIdle: 2,
  dnloadSync: 3,
  dnBusy: 4,
  dnloadIdle: 5,
  manifestSync: 6,
  manifest: 7,
  error: 10,
} as const

/// bStatus names from the spec; rmk-bootloader maps its own errors onto them.
const STATUS_TEXT: Record<number, string> = {
  0x01: 'errTARGET: image is not for this device',
  0x02: 'errFILE: image failed a vendor check',
  0x03: 'errWRITE: the device cannot write to memory',
  0x04: 'errERASE: flash erase failed',
  0x05: 'errCHECK_ERASED: flash did not erase',
  0x06: 'errPROG: flash program failed',
  0x07: 'errVERIFY: the image read back from flash does not match',
  0x08: 'errADDRESS: image does not fit the application region',
  0x09: 'errNOTDONE: the download ended without any data',
  0x0A: 'errFIRMWARE: the installed image is not bootable',
  0x0B: 'errVENDOR: another transport holds the update session',
  0x0C: 'errUSBR: unexpected USB reset',
  0x0D: 'errPOR: unexpected power-on reset',
  0x0E: 'errUNKNOWN: the device rejected the request',
  0x0F: 'errSTALLEDPKT: the device stalled the request',
}

export interface DfuStatus {
  status: number
  /// Milliseconds the device asks the host to wait before the next GETSTATUS.
  pollMs: number
  state: number
}

/// The device reported `bStatus`; the message carries the spec name.
export class DfuError extends Error {
  constructor(readonly status: number) {
    super(STATUS_TEXT[status] ?? `DFU error 0x${status.toString(16)}`)
    this.name = 'DfuError'
  }
}

/// Class control requests to the DFU interface. `out` rejects when the device
/// refuses the request (a stall), which the class does for a block out of order.
export interface DfuTarget {
  readonly label: string
  /// `wTransferSize` from the functional descriptor: the largest DNLOAD block.
  readonly transferSize: number
  out: (request: number, value: number, data?: Uint8Array) => Promise<void>
  in: (request: number, value: number, length: number) => Promise<Uint8Array>
  /// Bus-reset the device. The bootloader restarts into the new image on the
  /// first request after reporting `dfuMANIFEST`, and on a bus reset — so this
  /// is allowed to fail; the device may already be gone.
  restart: () => Promise<void>
  close: () => Promise<void>
}

/// `wTransferSize` from a configuration descriptor's DFU functional descriptor,
/// or null when the configuration carries none.
export function transferSizeOf(configuration: Uint8Array): number | null {
  for (let i = 0; i + 1 < configuration.length;) {
    const length = configuration[i]!
    if (length < 2) return null
    if (configuration[i + 1] === DESC_DFU_FUNCTIONAL && length >= 7) {
      return configuration[i + 5]! | (configuration[i + 6]! << 8)
    }
    i += length
  }
  return null
}

export async function getStatus(target: DfuTarget): Promise<DfuStatus> {
  const s = await target.in(REQ.getStatus, 0, 6)
  if (s.length < 6) throw new Error('short DFU status')
  return {
    status: s[0]!,
    pollMs: s[1]! | (s[2]! << 8) | (s[3]! << 16),
    state: s[4]!,
  }
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/// The device did not leave for its bootloader: an RMK dongle honours DETACH
/// only in the seconds after it was plugged in.
export class DetachRefused extends Error {
  constructor() {
    super('the device did not reboot into its bootloader')
    this.name = 'DetachRefused'
  }
}

/// Ask a running application to reboot into its bootloader. RMK's runtime
/// interface sets `bitWillDetach`, so an honoured request resets the device
/// before it can answer; a refused one is accepted and ignored. The two look
/// alike on the wire, so the device is asked again afterwards: still answering
/// means it refused.
export async function detach(
  target: DfuTarget,
  sleep: (ms: number) => Promise<void> = delay,
): Promise<void> {
  await target.out(REQ.detach, 1000).catch(() => {})
  await sleep(300)
  const stillHere = await getStatus(target).then(() => true, () => false)
  if (stillHere) throw new DetachRefused()
}

/// Poll GETSTATUS until the device reaches one of `accept`, honouring its
/// `bwPollTimeout` while it reports busy. A `dfuERROR` becomes a `DfuError`.
async function settle(
  target: DfuTarget,
  accept: readonly number[],
  sleep: (ms: number) => Promise<void>,
): Promise<DfuStatus> {
  for (;;) {
    const s = await getStatus(target)
    if (s.state === DFU_STATE.error) throw new DfuError(s.status)
    if (accept.includes(s.state)) return s
    if (s.state === DFU_STATE.dnBusy || s.state === DFU_STATE.manifestSync) {
      // A zero timeout would spin on the control pipe.
      await sleep(Math.max(s.pollMs, 1))
      continue
    }
    if (s.state === DFU_STATE.dnloadSync) continue
    throw new Error(`unexpected DFU state ${s.state}`)
  }
}

/// Send `image` and restart the device into it. `onProgress` reports bytes the
/// device has accepted so far. Throws `DfuError` for a device-reported failure;
/// the device then stays in DFU, so the caller can retry from scratch.
export async function download(
  target: DfuTarget,
  image: Uint8Array,
  onProgress?: (sent: number, total: number) => void,
  sleep: (ms: number) => Promise<void> = delay,
): Promise<void> {
  if (image.length === 0) throw new Error('empty firmware image')
  const size = target.transferSize
  if (!(size > 0)) throw new Error('device reports no DFU transfer size')

  // Leave any previous attempt behind: an error state needs CLRSTATUS, an
  // unfinished download an ABORT. Both land in dfuIDLE.
  let s = await getStatus(target)
  if (s.state === DFU_STATE.error) await target.out(REQ.clrStatus, 0)
  else if (s.state !== DFU_STATE.dfuIdle) await target.out(REQ.abort, 0)
  s = await getStatus(target)
  if (s.state !== DFU_STATE.dfuIdle) throw new Error(`bootloader is not idle (state ${s.state})`)

  let block = 0
  for (let offset = 0; offset < image.length; offset += size, block++) {
    await target.out(REQ.dnload, block, image.subarray(offset, offset + size))
    await settle(target, [DFU_STATE.dnloadIdle], sleep)
    onProgress?.(Math.min(offset + size, image.length), image.length)
  }

  // A zero-length block ends the download. The bootloader verifies what landed
  // — busy until then — and reports dfuMANIFEST once the image is installed.
  await target.out(REQ.dnload, block)
  await settle(target, [DFU_STATE.manifest], sleep)
  try {
    await target.restart()
  }
  catch {
    // WinUSB cannot reset the bus; GETSTATUS triggers the bootloader's restart.
    await getStatus(target).catch(() => {})
  }
}
