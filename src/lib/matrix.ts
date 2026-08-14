import type { MatrixState } from '../rynk'

/// The matrix bitmap is row-major: each row occupies `ceil(cols / 8)` bytes,
/// bit 0 of a row's first byte is column 0. Decoded to `"row,col"` keys, the
/// same cell format the board keys its keycaps by.
export function pressedCells(state: MatrixState, rows: number, cols: number): Set<string> {
  const bytesPerRow = Math.ceil(cols / 8)
  const pressed = new Set<string>()
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const byte = state.pressed_bitmap[row * bytesPerRow + (col >> 3)] ?? 0
      if (byte & (1 << (col & 7))) pressed.add(`${row},${col}`)
    }
  }
  return pressed
}
