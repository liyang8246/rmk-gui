import type { HidTable } from './hid-table'

/// Codec for RMK's flat macro region (`rmk/src/keyboard_macros.rs`).
///
/// Sequences are `0x00`-terminated and the region is zero-filled past the last
/// one. Inside a sequence, `0x01` introduces an operation; any other byte is
/// the ASCII character it encodes.

export type StepKind = 'tap' | 'press' | 'release' | 'text' | 'delay'

export type MacroStep
  /// `code` is the wire byte, which stays authoritative: a value outside the
  /// firmware's table still round-trips instead of being silently rewritten.
  = | { kind: 'tap' | 'press' | 'release', code: number }
    | { kind: 'text', value: string }
    | { kind: 'delay', ms: number }

const OPS = { 1: 'tap', 2: 'press', 3: 'release' } as const
const OP_BYTES = { tap: 0x01, press: 0x02, release: 0x03 } as const

/// Vial packs a delay into two 1-based bytes so the payload never contains a
/// `0x00` that would look like a terminator. Hence the ceiling.
export const MAX_DELAY_MS = 254 * 255 + 254

/// Text is written as raw ASCII, so it cannot carry the terminator or the
/// operation prefix; the printable range is what remains.
export function printableAscii(text: string): string {
  return [...text].filter((c) => {
    const n = c.charCodeAt(0)
    return n >= 0x20 && n <= 0x7E
  }).join('')
}

function unpackDelay(lo: number, hi: number): number {
  return (Math.max(lo, 1) - 1) + (Math.max(hi, 1) - 1) * 255
}

function packDelay(ms: number): [number, number] {
  const clamped = Math.max(0, Math.min(MAX_DELAY_MS, Math.round(ms)))
  return [(clamped % 255) + 1, Math.min(Math.floor(clamped / 255), 254) + 1]
}

function decodeSequence(bytes: number[]): MacroStep[] {
  const steps: MacroStep[] = []
  let i = 0
  while (i < bytes.length) {
    if (bytes[i] !== 0x01) {
      // Runs of ASCII coalesce into one step, the way they were authored.
      let text = ''
      while (i < bytes.length && bytes[i] !== 0x01) text += String.fromCharCode(bytes[i++]!)
      steps.push({ kind: 'text', value: text })
      continue
    }
    const tag = bytes[i + 1]
    if (tag !== undefined && tag in OPS) {
      const code = bytes[i + 2]
      if (code === undefined) break
      steps.push({ kind: OPS[tag as keyof typeof OPS], code })
      i += 3
    }
    else if (tag === 4) {
      const lo = bytes[i + 2]
      const hi = bytes[i + 3]
      if (lo === undefined || hi === undefined) break
      steps.push({ kind: 'delay', ms: unpackDelay(lo, hi) })
      i += 4
    }
    else {
      // `0x01 05..07` carry a 16-bit Vial keycode for actions that do not fit a
      // byte, and anything else here is malformed. Neither is editable, so the
      // whole sequence is dropped rather than half-decoded into a lie.
      throw new Error('unsupported macro operation')
    }
  }
  return steps
}

/// Bytes up to and including the last sequence terminator. The rest is padding.
export function macroBytesUsed(region: readonly number[]): number {
  let last = -1
  for (let i = 0; i < region.length; i++) {
    if (region[i] !== 0) last = i
  }
  if (last === -1) return 0
  // The terminator after the final sequence counts as used storage.
  return Math.min(last + 2, region.length)
}

/// One entry per slot, up to `slots`. A sequence this codec cannot represent
/// comes back as `null`, so the editor can refuse to overwrite it.
export function decodeMacros(region: readonly number[], slots: number): (MacroStep[] | null)[] {
  const used = region.slice(0, macroBytesUsed(region))
  const macros: (MacroStep[] | null)[] = []
  let current: number[] = []
  const push = (bytes: number[]) => {
    try {
      macros.push(decodeSequence(bytes))
    }
    catch {
      macros.push(null)
    }
  }
  for (const b of used) {
    if (b === 0) {
      push(current)
      current = []
    }
    else {
      current.push(b)
    }
  }
  if (current.length) push(current)
  while (macros.length < slots) macros.push([])
  return macros.slice(0, slots)
}

function encodeStep(step: MacroStep): number[] {
  if (step.kind === 'text') {
    return [...printableAscii(step.value)].map(c => c.charCodeAt(0))
  }
  if (step.kind === 'delay') {
    return [0x01, 0x04, ...packDelay(step.ms)]
  }
  return [0x01, OP_BYTES[step.kind], step.code]
}

/// What the slots occupy once written, terminators included.
export function encodedSize(macros: MacroStep[][]): number {
  return macros.reduce((n, steps) => n + steps.reduce((m, s) => m + encodeStep(s).length, 0) + 1, 0)
}

/// Lays the slots back out as a flat, zero-padded region. Returns null when the
/// result would not fit, so the caller can refuse rather than truncate.
export function encodeMacros(macros: MacroStep[][], capacity: number): number[] | null {
  const out = macros.flatMap(steps => [...steps.flatMap(encodeStep), 0x00])
  if (out.length > capacity) return null
  return [...out, ...Array.from<number>({ length: capacity - out.length }).fill(0)]
}

/// The name to print on a macro step, or the bare byte when the firmware's
/// table does not claim it.
export function keyLabel(code: number, table: HidTable): string {
  return table.byValue(code) ?? `0x${code.toString(16).toUpperCase().padStart(2, '0')}`
}
