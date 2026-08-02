import type { DeviceCapabilities, HidKeyCode } from '../rynk'
import { describe, expect, it } from 'vitest'
import { actionCatalog, asAction, withModifiers } from './keycatalog'
import { NO_MODIFIERS } from './keycode'

/// A stand-in for the firmware table: one code from each family the groups match.
const HID = [
  'A',
  'Kc1',
  'Minus',
  'Enter',
  'F13',
  'Home',
  'Kp7',
  'LShift',
  'KbVolumeUp',
  'MouseBtn1',
  'MouseBtn8',
  'WwwHome',
  'Execute',
  'KbPower',
] satisfies HidKeyCode[]

const CAPS = {
  num_layers: 2,
  max_morse: 4,
  macro_space_size: 256,
  lighting_enabled: true,
} as DeviceCapabilities

describe('actionCatalog', () => {
  it('names every group distinctly', () => {
    const names = actionCatalog(CAPS, HID).map(g => g.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every entry in a group a distinct id', () => {
    // Labels are not distinct — `Backslash` and `NonusBackslash` both print `\`
    // — and the picker keys its grid on the id.
    for (const group of actionCatalog(CAPS, HID)) {
      const ids = group.entries.map(e => e.id)
      expect(new Set(ids).size, `${group.name} has duplicate ids`).toBe(ids.length)
    }
  })

  it('drops what the firmware left out', () => {
    const bare = actionCatalog({ ...CAPS, max_morse: 0, macro_space_size: 0, lighting_enabled: false }, HID)
    expect(bare.map(g => g.name)).not.toContain('Light')
    const advanced = bare.find(g => g.name === 'Advanced')!.entries.map(e => e.id)
    expect(advanced.some(id => id.startsWith('morse'))).toBe(false)
    expect(advanced.some(id => id.startsWith('Macro'))).toBe(false)
    // The one-shots and special behaviours need no capability.
    expect(advanced).toContain('OSM LCtrl')
  })

  it('offers one layer action per layer', () => {
    const layer = actionCatalog(CAPS, HID).find(g => g.name === 'Layer')!
    expect(layer.entries.filter(e => e.label.startsWith('MO '))).toHaveLength(2)
  })

  it('lays the eight groups out in one order', () => {
    const names = actionCatalog(CAPS, ['A', 'KbVolumeUp', 'MouseBtn1', 'WwwHome', 'Execute']).map(g => g.name)
    expect(names).toEqual(['Basic', 'Media', 'Layer', 'Control', 'Mouse', 'Advanced', 'Light', 'Other'])
  })

  it('keeps the whole keyboard page in Basic, clearing included', () => {
    const basic = actionCatalog(CAPS, ['A', 'Kc1', 'Minus', 'Enter', 'F13', 'Home', 'Kp7', 'LShift'])
      .find(g => g.name === 'Basic')!
      .entries
      .map(e => e.id)
    expect(basic.slice(0, 2)).toEqual(['no', 'transparent'])
    for (const code of ['A', 'Kc1', 'Minus', 'Enter', 'F13', 'Home', 'Kp7', 'LShift'])
      expect(basic, code).toContain(code)
  })

  it('does not let a family regex overreach', () => {
    const groups = actionCatalog(CAPS, ['NumLock', 'SystemPower', 'SystemRequest'])
    const basic = groups.find(g => g.name === 'Basic')!.entries.map(e => e.id)
    const control = groups.find(g => g.name === 'Control')!.entries.map(e => e.id)
    // NumLock lives with the keypad it locks; SysRq is a keyboard key, not a
    // way to control the computer.
    expect(basic).toContain('NumLock')
    expect(control).toContain('SystemPower')
    expect(control).not.toContain('SystemRequest')
  })

  it('matches families by name, so a new one needs no edit', () => {
    // MouseBtn6..8 exist in the firmware table but were never hand-listed.
    const mouse = actionCatalog(CAPS, ['MouseBtn1', 'MouseBtn8', 'MouseWheelUp'])
      .find(g => g.name === 'Mouse')!
    expect(mouse.entries.map(e => e.id)).toEqual(['MouseBtn1', 'MouseBtn8', 'MouseWheelUp'])
  })

  it('carries a keycode no group claims through to Other', () => {
    const other = actionCatalog(CAPS, ['A', 'Kp7', 'KbPower', 'Execute'])
      .find(g => g.name === 'Other')
    expect(other?.entries.map(e => e.id)).toEqual(['KbPower', 'Execute'])
  })

  it('keeps the error codes off the board', () => {
    const groups = actionCatalog(CAPS, ['No', 'ErrorRollover', 'PostFail', 'ErrorUndefined'])
    expect(groups.find(g => g.name === 'Other')).toBeUndefined()
  })
})

describe('withModifiers', () => {
  it('rewrites a plain key as a modified one', () => {
    const entry = actionCatalog(CAPS, HID)[0]!.entries.find(e => e.hid === 'A')!
    expect(withModifiers(entry, NO_MODIFIERS)).toEqual(entry.action)
    expect(withModifiers(entry, { ...NO_MODIFIERS, left_ctrl: true }))
      .toEqual({ Single: { KeyWithModifier: ['A', { ...NO_MODIFIERS, left_ctrl: true }] } })
  })

  it('leaves an entry that carries no keycode alone', () => {
    const layerEntry = actionCatalog(CAPS, HID).find(g => g.name === 'Layer')!.entries[0]!
    expect(withModifiers(layerEntry, { ...NO_MODIFIERS, left_ctrl: true })).toEqual(layerEntry.action)
  })
})

describe('asAction', () => {
  it('unwraps what a tap-hold can hold, and refuses the rest', () => {
    expect(asAction({ Single: { LayerOn: 1 } })).toEqual({ LayerOn: 1 })
    expect(asAction('No')).toBe('No')
    expect(asAction({ Morse: 0 })).toBeNull()
    expect(asAction('Transparent')).toBeNull()
  })
})
