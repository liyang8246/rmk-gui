import { describe, expect, it } from 'vitest'
import { actionLabel, hidLabel, keyActionLabel, keyActionText, modifierLabel, NO_MODIFIERS } from './keycode'

describe('hidLabel', () => {
  it('prints the glyph where the variant name reads badly', () => {
    expect(hidLabel('Kc1')).toBe('1')
    expect(hidLabel('Minus')).toBe('-')
    expect(hidLabel('Left')).toBe('←')
    expect(hidLabel('Kp7')).toBe('KP 7')
  })

  it('falls back to the name rynk generated', () => {
    expect(hidLabel('A')).toBe('A')
    expect(hidLabel('MediaPlayPause')).toBe('MediaPlayPause')
  })
})

describe('actionLabel', () => {
  it('names layer actions the way keymaps do', () => {
    expect(actionLabel({ LayerOn: 2 })).toBe('MO 2')
    expect(actionLabel({ LayerToggle: 1 })).toBe('TG 1')
    expect(actionLabel({ OneShotLayer: 3 })).toBe('OSL 3')
    expect(actionLabel({ TriggerMacro: 4 })).toBe('Macro 4')
  })

  it('spells out a modified key', () => {
    const mods = { ...NO_MODIFIERS, left_ctrl: true, left_shift: true }
    expect(actionLabel({ KeyWithModifier: ['Escape', mods] })).toBe('LC+LS+Esc')
    expect(modifierLabel(NO_MODIFIERS)).toBe('none')
  })
})

describe('keyActionLabel', () => {
  it('puts the hold action on the second line', () => {
    expect(keyActionLabel({ TapHold: [{ Key: { Hid: 'A' } }, { LayerOn: 1 }, 200] }))
      .toEqual({ main: 'A', sub: 'MO 1' })
    expect(keyActionText({ TapHold: [{ Key: { Hid: 'A' } }, { LayerOn: 1 }, 200] })).toBe('A / MO 1')
  })

  it('marks the empty slots apart', () => {
    expect(keyActionLabel('No')).toEqual({ main: '✕' })
    expect(keyActionLabel('Transparent')).toEqual({ main: '▽' })
    expect(keyActionLabel({ Morse: 2 })).toEqual({ main: 'Morse 2', sub: 'morse' })
  })
})
