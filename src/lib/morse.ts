/// A morse pattern is a tap/hold sequence packed into a u16: `0b1` is empty,
/// and each step shifts left and sets the low bit for hold. The high set bit
/// is a marker, not a step, so the first step is the bit just below it.

export type MorseStep = 'tap' | 'hold'

/// The wire's named encodings, used as picker presets.
export const TAP = 0b10
export const HOLD = 0b11
export const DOUBLE_TAP = 0b100
export const HOLD_AFTER_TAP = 0b101

export const MAX_PATTERN_STEPS = 15

export function decodePattern(pattern: number): MorseStep[] {
  const marker = 31 - Math.clz32(pattern)
  const steps: MorseStep[] = []
  for (let i = marker - 1; i >= 0; i--) {
    steps.push((pattern >> i) & 1 ? 'hold' : 'tap')
  }
  return steps
}

export function encodePattern(steps: MorseStep[]): number {
  let pattern = 0b1
  for (const step of steps) pattern = (pattern << 1) | (step === 'hold' ? 1 : 0)
  return pattern
}

const NAMED: Record<number, string> = {
  [TAP]: 'Tap',
  [HOLD]: 'Hold',
  [DOUBLE_TAP]: 'Double tap',
  [HOLD_AFTER_TAP]: 'Tap, hold',
}

export function patternName(pattern: number): string {
  const named = NAMED[pattern]
  if (named) return named
  return decodePattern(pattern).join(', ')
}
