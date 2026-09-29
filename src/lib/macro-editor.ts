import type { Action, MacroOp } from '../rynk'

export type StepKind = 'tap' | 'press' | 'release' | 'text' | 'delay' | 'pause'
export type MacroStep
  = | { kind: 'tap' | 'press' | 'release', action: Action }
    | { kind: 'text', value: string }
    | { kind: 'delay', ms: number }
    | { kind: 'pause' }

export const MAX_DELAY_MS = 65535

export function validateMacro(ops: readonly MacroOp[], capacity: number): string | null {
  if (!Array.isArray(ops) || ops.length > capacity) return `A macro can contain at most ${capacity} operations`
  let paused = false
  for (const op of ops) {
    if (op === 'PauseForRelease') {
      if (paused) return 'A macro can wait for release only once'
      paused = true
    }
    else if (typeof op !== 'object' || op === null) {
      return 'Invalid macro operation'
    }
    else if ('Char' in op) {
      if (!Number.isInteger(op.Char) || op.Char < 0 || op.Char > 127) return 'Text must contain only ASCII characters'
    }
    else if ('Delay' in op) {
      if (!Number.isInteger(op.Delay) || op.Delay < 0 || op.Delay > MAX_DELAY_MS) return 'Delay must be between 0 and 65535 ms'
    }
    else {
      const action = 'Tap' in op ? op.Tap : 'Press' in op ? op.Press : 'Release' in op ? op.Release : null
      if (action === null) return 'Invalid macro operation'
      if (typeof action === 'object' && 'TriggerMacro' in action) return 'A macro cannot trigger another macro'
    }
  }
  return null
}

export function toSteps(ops: readonly MacroOp[]): MacroStep[] {
  const steps: MacroStep[] = []
  for (const op of ops) {
    if (op === 'PauseForRelease') {
      steps.push({ kind: 'pause' })
    }
    else if ('Char' in op) {
      const last = steps[steps.length - 1]
      const char = String.fromCharCode(op.Char)
      if (last?.kind === 'text') last.value += char
      else steps.push({ kind: 'text', value: char })
    }
    else if ('Delay' in op) {
      steps.push({ kind: 'delay', ms: op.Delay })
    }
    else if ('Tap' in op) {
      steps.push({ kind: 'tap', action: op.Tap })
    }
    else if ('Press' in op) {
      steps.push({ kind: 'press', action: op.Press })
    }
    else {
      steps.push({ kind: 'release', action: op.Release })
    }
  }
  return steps
}

export function fromSteps(steps: readonly MacroStep[]): MacroOp[] {
  return steps.flatMap((step): MacroOp[] => {
    switch (step.kind) {
      case 'tap': return [{ Tap: step.action }]
      case 'press': return [{ Press: step.action }]
      case 'release': return [{ Release: step.action }]
      case 'text': return [...step.value].map(c => ({ Char: c.codePointAt(0)! }))
      case 'delay': return [{ Delay: step.ms }]
      case 'pause': return ['PauseForRelease']
      default: throw new Error('Invalid macro step')
    }
  })
}

/// Content keys survive the rebuild every write causes, so a moved row keeps its DOM node.
export function stepKeys(steps: readonly MacroStep[]): string[] {
  const seen = new Map<string, number>()
  return steps.map((step) => {
    const content = JSON.stringify(step)
    const n = seen.get(content) ?? 0
    seen.set(content, n + 1)
    return `${content}#${n}`
  })
}

/// `to` is an insertion index into the original list, so `steps.length` means "move to the end".
export function moveStep<T>(steps: readonly T[], from: number, to: number): T[] {
  const next = [...steps]
  const [step] = next.splice(from, 1)
  if (step === undefined) return next
  next.splice(to > from ? to - 1 : to, 0, step)
  return next
}
