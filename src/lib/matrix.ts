import type { MatrixState } from '../rynk'

/// Row-major, one run of `ceil(num_cols / 8)` bytes per row, bit 0 = col 0.
export function isPressed(matrix: MatrixState | null, numCols: number, row: number, col: number): boolean {
  if (!matrix || col >= numCols) return false
  const stride = Math.ceil(numCols / 8)
  const byte = matrix.pressed_bitmap[row * stride + (col >> 3)]
  return byte !== undefined && (byte & (1 << (col & 7))) !== 0
}
