import type { Action, HidKeyCode, KeyAction, KeyCode, ModifierCombination } from '../rynk'
import { match, P } from 'ts-pattern'

/// How a keycode reads on a keycap and in the picker: a short label, plus an
/// optional qualifier that separates codes sharing one label. Both keyboard-page
/// `KbMute` and consumer-page `AudioMute` say "Mute", and only the qualifier
/// tells them apart. Anything absent falls back to the name rynk generated.
const LEGEND: Partial<Record<HidKeyCode, readonly [string, string?, string?]>> = {
  // Digits and punctuation print as themselves.
  Kc1: ['1'],
  Kc2: ['2'],
  Kc3: ['3'],
  Kc4: ['4'],
  Kc5: ['5'],
  Kc6: ['6'],
  Kc7: ['7'],
  Kc8: ['8'],
  Kc9: ['9'],
  Kc0: ['0'],
  Minus: ['-'],
  Equal: ['='],
  LeftBracket: ['['],
  RightBracket: [']'],
  Backslash: ['\\'],
  Semicolon: [';'],
  Quote: ['\''],
  Grave: ['`'],
  Comma: [','],
  Dot: ['.'],
  Slash: ['/'],
  NonusHash: ['#', 'non-US'],
  NonusBackslash: ['\\', 'non-US'],

  // Editing and navigation.
  Escape: ['Esc'],
  Backspace: ['Bksp', undefined, 'Backspace'],
  Delete: ['Del'],
  Insert: ['Ins'],
  PageUp: ['PgUp'],
  PageDown: ['PgDn'],
  PrintScreen: ['PrtSc'],
  ScrollLock: ['ScrLk'],
  CapsLock: ['Caps'],
  Application: ['Menu'],
  Left: ['\u2190'],
  Right: ['\u2192'],
  Up: ['\u2191'],
  Down: ['\u2193'],
  SystemRequest: ['SysRq'],
  AlternateErase: ['Alt Erase'],
  ClearAgain: ['Clr Again'],
  Crsel: ['CrSel'],
  Exsel: ['ExSel'],
  Separator: ['Sep'],

  // Modifiers keep one label; the side is the qualifier, as on a real keycap.
  LCtrl: ['Ctrl', 'left'],
  RCtrl: ['Ctrl', 'right'],
  LShift: ['Shift', 'left'],
  RShift: ['Shift', 'right'],
  LAlt: ['Alt', 'left'],
  RAlt: ['Alt', 'right'],
  LGui: ['Gui', 'left'],
  RGui: ['Gui', 'right'],

  // Keypad. The glyph is the same as the main block's, so every one of these
  // needs the qualifier to be legible.
  NumLock: ['Num Lk'],
  KpSlash: ['/', 'num'],
  KpAsterisk: ['*', 'num'],
  KpMinus: ['\u2212', 'num'],
  KpPlus: ['+', 'num'],
  KpEnter: ['Enter', 'num'],
  KpEqual: ['=', 'num'],
  KpEqualAs400: ['=', 'num'],
  KpDot: ['.', 'num'],
  KpComma: [',', 'num'],
  Kp1: ['1', 'num'],
  Kp2: ['2', 'num'],
  Kp3: ['3', 'num'],
  Kp4: ['4', 'num'],
  Kp5: ['5', 'num'],
  Kp6: ['6', 'num'],
  Kp7: ['7', 'num'],
  Kp8: ['8', 'num'],
  Kp9: ['9', 'num'],
  Kp0: ['0', 'num'],

  // Keyboard-page audio and power, distinct from the consumer-page keys below.
  KbMute: ['Mute', 'kbd'],
  KbVolumeUp: ['Vol +', 'kbd'],
  KbVolumeDown: ['Vol \u2212', 'kbd'],
  KbPower: ['Power', 'kbd'],
  LockingCapsLock: ['Caps', 'locking'],
  LockingNumLock: ['Num Lk', 'locking'],
  LockingScrollLock: ['ScrLk', 'locking'],

  // Consumer page: media transport, volume, brightness, launchers.
  AudioMute: ['Mute'],
  AudioVolUp: ['Vol +'],
  AudioVolDown: ['Vol \u2212'],
  MediaPlayPause: ['Play'],
  MediaNextTrack: ['Next'],
  MediaPrevTrack: ['Prev'],
  MediaStop: ['Stop', 'media'],
  MediaFastForward: ['FFwd'],
  MediaRewind: ['Rew'],
  MediaSelect: ['Media'],
  MediaEject: ['Eject'],
  BrightnessUp: ['Bright +'],
  BrightnessDown: ['Bright \u2212'],
  Calculator: ['Calc'],
  MyComputer: ['Files'],
  ControlPanel: ['Ctrl Panel'],
  Assistant: ['Assist'],
  MissionControl: ['Mission'],
  Launchpad: ['Launch'],
  SystemPower: ['Power'],
  SystemSleep: ['Sleep'],
  SystemWake: ['Wake'],

  // Browser keys all share labels with ordinary keys, hence the qualifier.
  WwwSearch: ['Search', 'web'],
  WwwHome: ['Home', 'web'],
  WwwBack: ['Back', 'web'],
  WwwForward: ['Fwd', 'web'],
  WwwStop: ['Stop', 'web'],
  WwwRefresh: ['Reload', 'web'],
  WwwFavorites: ['Bookmark', 'web'],

  // Mouse: direction glyphs for movement, the usual names for the buttons.
  MouseUp: ['\u25B2', 'move'],
  MouseDown: ['\u25BC', 'move'],
  MouseLeft: ['\u25C0', 'move'],
  MouseRight: ['\u25B6', 'move'],
  MouseBtn1: ['Left', 'click'],
  MouseBtn2: ['Right', 'click'],
  MouseBtn3: ['Middle', 'click'],
  MouseBtn4: ['Back', 'click'],
  MouseBtn5: ['Fwd', 'click'],
  MouseBtn6: ['Btn 6', 'click'],
  MouseBtn7: ['Btn 7', 'click'],
  MouseBtn8: ['Btn 8', 'click'],
  MouseWheelUp: ['Whl \u25B2'],
  MouseWheelDown: ['Whl \u25BC'],
  MouseWheelLeft: ['Whl \u25C0'],
  MouseWheelRight: ['Whl \u25B6'],
  MouseAccel0: ['Acc 0'],
  MouseAccel1: ['Acc 1'],
  MouseAccel2: ['Acc 2'],
}

const INTERNATIONAL = /^International(\d)$/
const LANGUAGE = /^Language(\d)$/

export interface HidLegend {
  label: string
  /// Set only where the label alone would be ambiguous.
  qualifier?: string
  /// The unabbreviated name, for keys drawn wide enough to hold it.
  long?: string
}

export function hidLegend(code: HidKeyCode): HidLegend {
  const known = LEGEND[code]
  if (known) return { label: known[0], qualifier: known[1], long: known[2] }
  const intl = INTERNATIONAL.exec(code)
  if (intl) return { label: `Intl ${intl[1]}`, qualifier: 'intl' }
  const lang = LANGUAGE.exec(code)
  if (lang) return { label: `Lang ${lang[1]}`, qualifier: 'intl' }
  return { label: code }
}

/// Firmware action names are one CamelCase token — `CapsWordToggle` — which a
/// fixed-width chip can only clip, because there is nowhere to break it. Spacing
/// the words gives the renderer somewhere to wrap.
const KEEP_JOINED: Record<string, string> = {
  CapsWordToggle: 'CapsWord Toggle',
}

export function humanize(name: string): string {
  return KEEP_JOINED[name] ?? name.replace(/([a-z\d])([A-Z])/g, '$1 $2')
}

export function hidLabel(code: HidKeyCode): string {
  return hidLegend(code).label
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
