import type { Action, HidKeyCode, KeyAction, KeyCode, ModifierCombination } from '../rynk'
import { match, P } from 'ts-pattern'

/// Only the codes whose variant name reads badly on a keycap; everything else
/// falls back to the name rynk generated.
const GLYPH: Partial<Record<HidKeyCode, string>> = {
  Kc1: '1',
  Kc2: '2',
  Kc3: '3',
  Kc4: '4',
  Kc5: '5',
  Kc6: '6',
  Kc7: '7',
  Kc8: '8',
  Kc9: '9',
  Kc0: '0',
  Minus: '-',
  Equal: '=',
  LeftBracket: '[',
  RightBracket: ']',
  Backslash: '\\',
  NonusHash: '#',
  NonusBackslash: '\\',
  Semicolon: ';',
  Quote: '\'',
  Grave: '`',
  Comma: ',',
  Dot: '.',
  Slash: '/',
  Escape: 'Esc',
  Backspace: 'Bksp',
  Delete: 'Del',
  Insert: 'Ins',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  PrintScreen: 'PrtSc',
  ScrollLock: 'ScrLk',
  CapsLock: 'Caps',
  NumLock: 'NumLk',
  Application: 'Menu',
  Left: '←',
  Right: '→',
  Up: '↑',
  Down: '↓',
  KpSlash: 'KP /',
  KpAsterisk: 'KP *',
  KpMinus: 'KP -',
  KpPlus: 'KP +',
  KpEnter: 'KP ⏎',
  KpDot: 'KP .',
  KpComma: 'KP ,',
  KpEqual: 'KP =',
  LCtrl: 'LCtrl',
  LShift: 'LShift',
  LAlt: 'LAlt',
  LGui: 'LGui',
  RCtrl: 'RCtrl',
  RShift: 'RShift',
  RAlt: 'RAlt',
  RGui: 'RGui',
}

const KP_DIGIT = /^Kp(\d)$/

export function hidLabel(code: HidKeyCode): string {
  const kp = KP_DIGIT.exec(code)
  if (kp) return `KP ${kp[1]}`
  return GLYPH[code] ?? code
}

const MOD_FLAGS = [
  ['left_ctrl', 'LC'],
  ['left_shift', 'LS'],
  ['left_alt', 'LA'],
  ['left_gui', 'LG'],
  ['right_ctrl', 'RC'],
  ['right_shift', 'RS'],
  ['right_alt', 'RA'],
  ['right_gui', 'RG'],
] as const satisfies readonly (readonly [keyof ModifierCombination, string])[]

export const NO_MODIFIERS: ModifierCombination = {
  left_ctrl: false,
  left_shift: false,
  left_alt: false,
  left_gui: false,
  right_ctrl: false,
  right_shift: false,
  right_alt: false,
  right_gui: false,
}

export function modifierLabel(mods: ModifierCombination): string {
  const on = MOD_FLAGS.filter(([flag]) => mods[flag]).map(([, name]) => name)
  return on.length ? on.join('+') : 'none'
}

export function keyCodeLabel(code: KeyCode): string {
  return match(code)
    .with({ Hid: P.select() }, hidLabel)
    .with({ Consumer: P.select() }, c => c)
    .with({ SystemControl: P.select() }, c => c)
    .exhaustive()
}

export function actionLabel(action: Action): string {
  return match(action)
    .with('No', () => '✕')
    .with({ Key: P.select() }, keyCodeLabel)
    .with({ Modifier: P.select() }, modifierLabel)
    .with({ KeyWithModifier: P.select() }, ([code, mods]) => `${modifierLabel(mods)}+${hidLabel(code)}`)
    .with({ LayerOn: P.select() }, l => `MO ${l}`)
    .with({ LayerOnWithModifier: P.select() }, ([l, mods]) => `MO ${l}+${modifierLabel(mods)}`)
    .with({ LayerOff: P.select() }, l => `LOFF ${l}`)
    .with({ LayerToggle: P.select() }, l => `TG ${l}`)
    .with({ DefaultLayer: P.select() }, l => `DF ${l}`)
    .with({ LayerToggleOnly: P.select() }, l => `TO ${l}`)
    .with('TriLayerLower', () => 'TriLower')
    .with('TriLayerUpper', () => 'TriUpper')
    .with({ TriggerMacro: P.select() }, m => `Macro ${m}`)
    .with({ OneShotLayer: P.select() }, l => `OSL ${l}`)
    .with({ OneShotModifier: P.select() }, m => `OSM ${modifierLabel(m)}`)
    .with({ OneShotKey: P.select() }, k => `OSK ${hidLabel(k)}`)
    .with({ Light: P.select() }, l => l)
    .with({ KeyboardControl: P.select() }, k => k)
    .with({ Special: P.select() }, s => s)
    .with({ User: P.select() }, u => `User ${u}`)
    .with({ PersistentDefaultLayer: P.select() }, l => `PDF ${l}`)
    .with({ Steno: P.select() }, s => `Steno ${s}`)
    .exhaustive()
}

export interface KeyLabel {
  main: string
  /// Second line on the cap: the hold action, or what makes this not a plain key.
  sub?: string
}

export function keyActionLabel(action: KeyAction): KeyLabel {
  return match(action)
    .with('No', () => ({ main: '✕' }))
    .with('Transparent', () => ({ main: '▽' }))
    .with({ Single: P.select() }, a => ({ main: actionLabel(a) }))
    .with({ Tap: P.select() }, a => ({ main: actionLabel(a), sub: 'tap' }))
    .with({ TapHold: P.select() }, ([tap, hold]) => ({ main: actionLabel(tap), sub: actionLabel(hold) }))
    .with({ Morse: P.select() }, m => ({ main: `Morse ${m}`, sub: 'morse' }))
    .exhaustive()
}

/// Flat text for lists and pickers, where two lines do not fit.
export function keyActionText(action: KeyAction): string {
  const { main, sub } = keyActionLabel(action)
  return sub ? `${main} / ${sub}` : main
}

/// Serialising is enough because every `KeyAction` on both sides comes out of
/// the same serde-generated shape, so field order is fixed.
export function sameKeyAction(a: KeyAction, b: KeyAction): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
