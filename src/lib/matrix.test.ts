import { describe, expect, it } from 'vitest'
import { pressedCells } from './matrix'

describe('pressedCells', () => {
  it('decodes bit 0 as column 0, row-major', () => {
    // 2 rows × 10 cols → 2 bytes per row.
    const state = { pressed_bitmap: [0b0000_0101, 0b0000_0010, 0b0000_0000, 0b0000_0001] }
    expect(pressedCells(state, 2, 10)).toEqual(new Set(['0,0', '0,2', '0,9', '1,8']))
  })

  it('treats a short bitmap as nothing pressed', () => {
    expect(pressedCells({ pressed_bitmap: [] }, 2, 10)).toEqual(new Set())
  })
})
