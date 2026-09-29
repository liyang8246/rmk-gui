import type { MacroOp } from '../rynk'
import { describe, expect, it } from 'vitest'
import { fromSteps, moveStep, stepKeys, toSteps, validateMacro } from './macro-editor'

describe('native macro editor', () => {
  it('preserves actions, ASCII controls, maximum delays, and release pauses', () => {
    const ops: MacroOp[] = [{ Char: 0 }, { Char: 65 }, { Press: { LayerOn: 1 } }, 'PauseForRelease', { Release: { LayerOn: 1 } }, { Delay: 65535 }]
    expect(fromSteps(toSteps(ops))).toEqual(ops)
    expect(validateMacro(ops, 32)).toBeNull()
  })
  it('rejects invalid content and checks expanded text length', () => {
    expect(validateMacro(fromSteps([{ kind: 'text', value: '你好' }]), 32)).not.toBeNull()
    expect(validateMacro(fromSteps([{ kind: 'text', value: 'abc' }]), 2)).not.toBeNull()
    expect(validateMacro(['PauseForRelease', 'PauseForRelease'], 32)).not.toBeNull()
    expect(validateMacro([{ Tap: { TriggerMacro: 0 } }], 32)).not.toBeNull()
    expect(validateMacro([{ Delay: 65536 }], 32)).not.toBeNull()
  })
  it('keys steps by content so a move keeps each key', () => {
    const steps = toSteps([{ Tap: { Key: { Hid: 'A' } } }, { Delay: 5 }, { Tap: { Key: { Hid: 'A' } } }])
    const keys = stepKeys(steps)
    expect(new Set(keys).size).toBe(3)
    expect(stepKeys(toSteps(fromSteps(moveStep(steps, 1, 0))))).toEqual([keys[1], keys[0], keys[2]])
  })
  it('moves a step to an insertion index', () => {
    expect(moveStep(['a', 'b', 'c'], 0, 3)).toEqual(['b', 'c', 'a'])
    expect(moveStep(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveStep(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'a', 'c'])
    expect(moveStep(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })
})
