import { describe, expect, it } from 'vitest'
import { isPressed } from './matrix'

describe('isPressed', () => {
  it('walks one stride of ceil(cols / 8) bytes per row', () => {
    // 12 cols → 2 bytes a row. Row 1 col 9 is bit 1 of the second byte.
    const matrix = { pressed_bitmap: [0b0000_0001, 0, 0, 0b0000_0010] }
    expect(isPressed(matrix, 12, 0, 0)).toBe(true)
    expect(isPressed(matrix, 12, 0, 1)).toBe(false)
    expect(isPressed(matrix, 12, 1, 9)).toBe(true)
    expect(isPressed(matrix, 12, 1, 8)).toBe(false)
  })

  it('reads nothing outside the matrix', () => {
    const matrix = { pressed_bitmap: [0xFF] }
    expect(isPressed(matrix, 4, 0, 4)).toBe(false)
    expect(isPressed(matrix, 4, 9, 0)).toBe(false)
    expect(isPressed(null, 4, 0, 0)).toBe(false)
  })
})
