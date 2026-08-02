import type { Action, DeviceCapabilities, HidKeyCode, KeyAction, KeyboardAction, LightAction, ModifierCombination } from '../rynk'
import { hidLabel, NO_MODIFIERS } from './keycode'

export interface CatalogEntry {
  /// Keys the picker grid. Labels collide — `Backslash` and `NonusBackslash`
  /// both print `\` — and a duplicate key tears down the each block.
  id: string
  label: string
  action: KeyAction
  /// Set for plain HID keys: the modifier row can re-emit them as
  /// `KeyWithModifier` without re-deriving what was picked.
  hid?: HidKeyCode
  title?: string
}

export interface CatalogGroup {
  name: string
  entries: CatalogEntry[]
}

function key(code: HidKeyCode): CatalogEntry {
  return { id: code, label: hidLabel(code), action: { Single: { Key: { Hid: code } } }, hid: code, title: code }
}

function act(label: string, action: Action, title?: string): CatalogEntry {
  return { id: label, label, action: { Single: action }, title: title ?? label }
}

/// Whole families of keycodes are named by pattern, so match them instead of
/// listing them: a code the firmware gains lands in the right group by itself,
/// which is how `MouseBtn6..8` got here.
const LETTER = /^[A-Z]$/
const DIGIT = /^Kc\d$/
const FUNCTION = /^F([1-9]|1\d|2[0-4])$/
const KEYPAD = /^(?:Kp|NumLock$)/
const MODIFIER = /^[LR](?:Ctrl|Shift|Alt|Gui)$/
const MOUSE = /^Mouse/
const MEDIA = /^(?:Audio|Media|Brightness|KbMute|KbVolume)/
// Anchored on the three power codes: `SystemRequest` is the SysRq on a
// keyboard, not a way to control the computer.
const COMPUTER = /^(?:System(?:Power|Sleep|Wake)$|Www)/

/// The rest have no pattern to match on.
const PUNCTUATION = ['Minus', 'Equal', 'LeftBracket', 'RightBracket', 'Backslash', 'NonusHash', 'Semicolon', 'Quote', 'Grave', 'Comma', 'Dot', 'Slash', 'NonusBackslash'] satisfies HidKeyCode[]
const EDITING = ['Enter', 'Escape', 'Backspace', 'Tab', 'Space', 'CapsLock'] satisfies HidKeyCode[]
const NAVIGATION = ['Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown', 'Up', 'Down', 'Left', 'Right', 'PrintScreen', 'ScrollLock', 'Pause', 'Application', 'Menu'] satisfies HidKeyCode[]
const LAUNCHERS = ['Mail', 'Calculator', 'MyComputer', 'ControlPanel', 'Assistant', 'MissionControl', 'Launchpad'] satisfies HidKeyCode[]
const KEYBOARD_CONTROL = ['Bootloader', 'Reboot', 'DebugToggle', 'ClearEeprom', 'OutputAuto', 'OutputUsb', 'OutputBluetooth', 'ComboOn', 'ComboOff', 'ComboToggle', 'CapsWordToggle'] satisfies KeyboardAction[]
const LIGHTING = ['BacklightToggle', 'BacklightUp', 'BacklightDown', 'BacklightStep', 'BacklightToggleBreathing', 'RgbTog', 'RgbModeForward', 'RgbModeReverse', 'RgbHui', 'RgbHud', 'RgbSai', 'RgbSad', 'RgbVai', 'RgbVad', 'RgbSpi', 'RgbSpd'] satisfies LightAction[]

const SINGLE_MODIFIER = {
  LCtrl: 'left_ctrl',
  LShift: 'left_shift',
  LAlt: 'left_alt',
  LGui: 'left_gui',
  RCtrl: 'right_ctrl',
  RShift: 'right_shift',
  RAlt: 'right_alt',
  RGui: 'right_gui',
} as const satisfies Record<string, keyof ModifierCombination>

function modifiersOf(names: (keyof ModifierCombination)[]): ModifierCombination {
  return names.reduce<ModifierCombination>((acc, n) => ({ ...acc, [n]: true }), { ...NO_MODIFIERS })
}

export function anyModifier(mods: ModifierCombination): boolean {
  return Object.values(mods).some(Boolean)
}

/// The GUI addresses a fixed number of macro slots: the protocol exposes the
/// macro region as flat bytes, and the firmware finds macro `n` by counting
/// `0x00` terminators, so the slot count is ours to pick.
const MACRO_SLOTS = 8

/// Not keys: the HID error codes a keyboard reports when it cannot keep up.
/// Offering them would let someone bind a rollover error to a keycap.
const NOT_BINDABLE: readonly HidKeyCode[] = ['No', 'ErrorRollover', 'PostFail', 'ErrorUndefined']

/// `hid` is the firmware's own table, from `keycodeTables()`. Groups decide
/// order and naming only — whatever none of them claims lands in `Other`, so a
/// keycode added upstream needs no edit here.
export function actionCatalog(
  caps: DeviceCapabilities | undefined,
  hid: readonly HidKeyCode[] = [],
): CatalogGroup[] {
  // Every group is a view over the firmware's table, so without it there is
  // nothing honest to offer — the picker waits the one tick it takes to arrive.
  if (hid.length === 0) return []

  const layers = Array.from({ length: caps?.num_layers ?? 0 }, (_, i) => i)
  const pick = (...tests: (RegExp | readonly HidKeyCode[])[]) =>
    tests.flatMap(test =>
      test instanceof RegExp ? hid.filter(code => test.test(code)) : test.filter(code => hid.includes(code)),
    )

  const groups: CatalogGroup[] = [
    {
      name: 'Basic',
      entries: [
        { id: 'no', label: '✕', action: 'No', title: 'No action' },
        { id: 'transparent', label: '▽', action: 'Transparent', title: 'Fall through to the layer below' },
        ...pick(LETTER, DIGIT, PUNCTUATION, EDITING, FUNCTION, NAVIGATION, KEYPAD, MODIFIER).map(key),
      ],
    },
    { name: 'Media', entries: pick(MEDIA).map(key) },
    {
      name: 'Layer',
      entries: [
        ...layers.map(l => act(`MO ${l}`, { LayerOn: l }, `Hold for layer ${l}`)),
        ...layers.map(l => act(`TG ${l}`, { LayerToggle: l }, `Toggle layer ${l}`)),
        ...layers.map(l => act(`TO ${l}`, { LayerToggleOnly: l }, `Activate only layer ${l}`)),
        ...layers.map(l => act(`OSL ${l}`, { OneShotLayer: l }, `One-shot layer ${l}`)),
        ...layers.map(l => act(`DF ${l}`, { DefaultLayer: l }, `Default layer ${l}`)),
        ...layers.map(l => act(`PDF ${l}`, { PersistentDefaultLayer: l }, `Persistent default layer ${l}`)),
        ...layers.map(l => act(`LOFF ${l}`, { LayerOff: l }, `Turn layer ${l} off`)),
        act('TriLower', 'TriLayerLower'),
        act('TriUpper', 'TriLayerUpper'),
      ],
    },
    {
      name: 'Control',
      entries: [
        ...pick(COMPUTER, LAUNCHERS).map(key),
        ...KEYBOARD_CONTROL.map(c => act(c, { KeyboardControl: c })),
      ],
    },
    { name: 'Mouse', entries: pick(MOUSE).map(key) },
    {
      // Everything a key can be bound to that is not a key: one-shot
      // modifiers, the two special behaviours, and the slot references whose
      // contents live on the device.
      name: 'Advanced',
      entries: [
        ...Object.entries(SINGLE_MODIFIER).map(([code, flag]) => act(
          `OSM ${hidLabel(code as HidKeyCode)}`,
          { OneShotModifier: modifiersOf([flag]) },
          `One-shot ${code}`,
        )),
        act('GraveEsc', { Special: 'GraveEscape' }, 'Grave, or Escape when a modifier is held'),
        act('Repeat', { Special: 'Repeat' }, 'Repeat the last key'),
        ...Array.from({ length: caps?.max_morse ?? 0 }, (_, i) => ({
          id: `morse-${i}`,
          label: `Morse ${i}`,
          action: { Morse: i } satisfies KeyAction,
          title: `Morse key ${i}`,
        })),
        ...Array.from(
          { length: (caps?.macro_space_size ?? 0) > 0 ? MACRO_SLOTS : 0 },
          (_, i) => act(`Macro ${i}`, { TriggerMacro: i }),
        ),
      ],
    },
  ]

  // Placeholder until the lighting editor lands: the actions bind, nothing in
  // the app configures the effects behind them yet.
  if (caps?.lighting_enabled) {
    groups.push({ name: 'Light', entries: LIGHTING.map(l => act(l, { Light: l })) })
  }

  // Derived from what the groups actually took, so there is no second list to
  // keep in step with them.
  const claimed = new Set<HidKeyCode>([
    ...NOT_BINDABLE,
    ...groups.flatMap(g => g.entries.map(e => e.hid).filter(code => code !== undefined)),
  ])
  const other = hid.filter(code => !claimed.has(code))
  if (other.length > 0) groups.push({ name: 'Other', entries: other.map(key) })

  return groups
}

/// `TapHold` holds plain `Action`s, so composite picks (morse, transparent)
/// cannot serve as a hold. Returns null for those.
export function asAction(action: KeyAction): Action | null {
  if (action === 'No') return 'No'
  if (typeof action === 'object' && 'Single' in action) return action.Single
  if (typeof action === 'object' && 'Tap' in action) return action.Tap
  return null
}

export function withModifiers(entry: CatalogEntry, mods: ModifierCombination): KeyAction {
  if (!entry.hid || !anyModifier(mods)) return entry.action
  return { Single: { KeyWithModifier: [entry.hid, mods] } }
}
