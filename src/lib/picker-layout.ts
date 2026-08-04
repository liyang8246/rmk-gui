import type { HidKeyCode } from '../rynk'

/// A cell in a row-laid block: either a key of `w` units, or dead space.
export type Cell = { code: HidKeyCode, w: number } | { gap: number }

/// A key placed by unit coordinates, for blocks with keys taller than one row.
export interface PlacedKey {
  code: HidKeyCode
  x: number
  y: number
  w: number
  h: number
}

function k(code: HidKeyCode, w = 1): Cell {
  return { code, w }
}

function gap(w: number): Cell {
  return { gap: w }
}

const letters = (s: string) => [...s].map(c => k(c as HidKeyCode))

/// The Basic tab draws a real board instead of an alphabetical grid, so keys
/// are where the hand expects them. Row 0 is dropped on narrow widths.
export const MAIN_ROWS: Cell[][] = [
  [
    k('Escape'),
    gap(0.5),
    k('F1'),
    k('F2'),
    k('F3'),
    k('F4'),
    gap(0.5),
    k('F5'),
    k('F6'),
    k('F7'),
    k('F8'),
    gap(0.5),
    k('F9'),
    k('F10'),
    k('F11'),
    k('F12'),
  ],
  [
    k('Grave'),
    k('Kc1'),
    k('Kc2'),
    k('Kc3'),
    k('Kc4'),
    k('Kc5'),
    k('Kc6'),
    k('Kc7'),
    k('Kc8'),
    k('Kc9'),
    k('Kc0'),
    k('Minus'),
    k('Equal'),
    k('Backspace', 2),
  ],
  [
    k('Tab', 1.5),
    ...letters('QWERTYUIOP'),
    k('LeftBracket'),
    k('RightBracket'),
    k('Backslash', 1.5),
  ],
  [
    k('CapsLock', 1.75),
    ...letters('ASDFGHJKL'),
    k('Semicolon'),
    k('Quote'),
    k('Enter', 2.25),
  ],
  [
    k('LShift', 2.25),
    ...letters('ZXCVBNM'),
    k('Comma'),
    k('Dot'),
    k('Slash'),
    k('RShift', 2.75),
  ],
  [
    k('LCtrl', 1.25),
    k('LGui', 1.25),
    k('LAlt', 1.25),
    k('Space', 6.25),
    k('RAlt', 1.25),
    k('RGui', 1.25),
    k('Application', 1.25),
    k('RCtrl', 1.25),
  ],
]

export const NAV_CLUSTER: Cell[][] = [
  [k('Insert'), k('Home'), k('PageUp')],
  [k('Delete'), k('End'), k('PageDown')],
  [gap(1), k('Up'), gap(1)],
  [k('Left'), k('Down'), k('Right')],
]

/// Placed rather than rowed: `+` and `Enter` are two rows tall and `0` is two
/// columns wide, which a row of widths cannot express.
export const NUMPAD: PlacedKey[] = [
  { code: 'NumLock', x: 0, y: 0, w: 1, h: 1 },
  { code: 'KpSlash', x: 1, y: 0, w: 1, h: 1 },
  { code: 'KpAsterisk', x: 2, y: 0, w: 1, h: 1 },
  { code: 'KpMinus', x: 3, y: 0, w: 1, h: 1 },
  { code: 'Kp7', x: 0, y: 1, w: 1, h: 1 },
  { code: 'Kp8', x: 1, y: 1, w: 1, h: 1 },
  { code: 'Kp9', x: 2, y: 1, w: 1, h: 1 },
  { code: 'KpPlus', x: 3, y: 1, w: 1, h: 2 },
  { code: 'Kp4', x: 0, y: 2, w: 1, h: 1 },
  { code: 'Kp5', x: 1, y: 2, w: 1, h: 1 },
  { code: 'Kp6', x: 2, y: 2, w: 1, h: 1 },
  { code: 'Kp1', x: 0, y: 3, w: 1, h: 1 },
  { code: 'Kp2', x: 1, y: 3, w: 1, h: 1 },
  { code: 'Kp3', x: 2, y: 3, w: 1, h: 1 },
  { code: 'KpEnter', x: 3, y: 3, w: 1, h: 2 },
  { code: 'Kp0', x: 0, y: 4, w: 2, h: 1 },
  { code: 'KpDot', x: 2, y: 4, w: 1, h: 1 },
]

export const NUMPAD_UNITS = { w: 4, h: 5 }

/// The clusters the layout drops at narrower widths, re-offered as a flat strip
/// underneath so no keycode becomes unreachable.
export const FUNCTION_FLAT: HidKeyCode[] = [
  'Escape',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]
export const NAV_FLAT: HidKeyCode[] = [
  'Insert',
  'Home',
  'PageUp',
  'Delete',
  'End',
  'PageDown',
  'Left',
  'Down',
  'Up',
  'Right',
]
export const NUMPAD_FLAT: HidKeyCode[] = NUMPAD.map(key => key.code)

/// One key unit, and the gap between two of them.
export const PICKER_UNIT = 42
export const PICKER_GAP = 4

/// Pixels a run of `units` occupies, gaps between them included.
export function span(units: number): number {
  return units * PICKER_UNIT - PICKER_GAP
}

export function rowWidth(row: Cell[]): number {
  return row.reduce((sum, cell) => sum + ('gap' in cell ? cell.gap : cell.w), 0)
}

/// Everything the drawn board can reach, so the picker can offer the remainder
/// of the Basic group — `No`, `Transparent`, `Menu` — as keys beside it.
export const BOARD_CODES: ReadonlySet<HidKeyCode> = new Set([
  ...[...MAIN_ROWS, ...NAV_CLUSTER]
    .flat()
    .filter(cell => !('gap' in cell))
    .map(cell => (cell as { code: HidKeyCode }).code),
  ...NUMPAD_FLAT,
])
