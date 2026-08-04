import { describe, expect, it } from 'vitest'
import { actionLabel, hidLabel, hidLegend, keyActionLabel, keyActionText, modifierLabel, NO_MODIFIERS } from './keycode'

describe('hidLabel', () => {
  it('prints the glyph where the variant name reads badly', () => {
    expect(hidLabel('Kc1')).toBe('1')
    expect(hidLabel('Minus')).toBe('-')
    expect(hidLabel('Left')).toBe('←')
    expect(hidLabel('MediaPlayPause')).toBe('Play')
  })

  it('falls back to the name rynk generated', () => {
    expect(hidLabel('A')).toBe('A')
    expect(hidLabel('F5')).toBe('F5')
    expect(hidLabel('Help')).toBe('Help')
  })
})

describe('hidLegend', () => {
  it('qualifies the keypad, which shares its glyphs with the main block', () => {
    expect(hidLegend('Kp7')).toEqual({ label: '7', qualifier: 'num' })
    expect(hidLegend('Kc7')).toEqual({ label: '7', qualifier: undefined })
  })

  it('separates the keyboard page from the consumer page', () => {
    expect(hidLegend('KbMute')).toEqual({ label: 'Mute', qualifier: 'kbd' })
    expect(hidLegend('AudioMute')).toEqual({ label: 'Mute', qualifier: undefined })
  })

  it('names the international and language blocks by their number', () => {
    expect(hidLegend('International2')).toEqual({ label: 'Intl 2', qualifier: 'intl' })
    expect(hidLegend('Language3')).toEqual({ label: 'Lang 3', qualifier: 'intl' })
  })

  it('puts the side of a modifier in the qualifier, not the label', () => {
    expect(hidLegend('LCtrl')).toEqual({ label: 'Ctrl', qualifier: 'left' })
    expect(hidLegend('RCtrl')).toEqual({ label: 'Ctrl', qualifier: 'right' })
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
