import type { DeviceCapabilities, Key, LayoutInfo } from '../rynk'
import { describe, expect, it } from 'vitest'
import { renderVariants, variantBounds } from './layout'

const CAPS = {
  num_layers: 2,
  num_rows: 2,
  num_cols: 3,
  num_encoders: 0,
} as DeviceCapabilities

function key(x: number, y: number, w = 1, h = 1, r = 0, rect2?: Key['rect2']): Key {
  return { row: 0, col: 0, rect: { x, y, w, h }, r, rect2, pivot: undefined }
}

function variant(keys: Key[], encoders: LayoutInfo['variants'][number]['encoders'] = []) {
  return { name: 'ANSI', keys, encoders }
}

describe('renderVariants', () => {
  it('falls back to the bare matrix when the firmware ships no layout map', () => {
    const [only] = renderVariants({ default_variant: 0, variants: [] }, CAPS)
    expect(only?.name).toBe('Matrix')
    expect(only?.keys).toHaveLength(6)
    expect(only?.keys[4]).toEqual({
      row: 1,
      col: 1,
      rect: { x: 1.5, y: 1.5, w: 1, h: 1 },
      r: 0,
      rect2: undefined,
      pivot: undefined,
    })
  })

  it('gives encoders a row of their own in the fallback', () => {
    const [only] = renderVariants(undefined, { ...CAPS, num_encoders: 2 })
    expect(only?.encoders.map(e => [e.id, e.x, e.y])).toEqual([[0, 0.5, 2.5], [1, 1.5, 2.5]])
  })

  it('hands back the decoded variants untouched', () => {
    const decoded = variant([key(0.5, 0.5)])
    const layout = { default_variant: 0, variants: [decoded] }
    expect(renderVariants(layout, CAPS)[0]).toBe(decoded)
  })

  it('has nothing to draw without capabilities', () => {
    expect(renderVariants(undefined, undefined)).toEqual([])
  })
})

describe('variantBounds', () => {
  it('covers a flat row exactly', () => {
    const b = variantBounds(variant([key(0.5, 0.5), key(1.5, 0.5), key(2.5, 0.5)]))
    expect(b).toEqual({ x: 1.5, y: 0.5, w: 3, h: 1 })
  })

  it('follows a turned key, not its upright rect', () => {
    // A 1u square swung 45° needs its diagonal, not its side.
    const b = variantBounds(variant([key(0.5, 0.5, 1, 1, 45)]))
    expect(b.w).toBeCloseTo(Math.SQRT2, 5)
    expect(b.h).toBeCloseTo(Math.SQRT2, 5)
  })

  it('takes in both halves of an L-shaped key', () => {
    // ISO enter: a 1.25u bar with a 1.5u overhang on the row above.
    const b = variantBounds(variant([key(0.625, 1, 1.25, 2, 0, { x: 0.5, y: 0.5, w: 1.5, h: 1 })]))
    expect(b).toEqual({ x: 0.5, y: 1, w: 1.5, h: 2 })
  })

  it('leaves room for the knob', () => {
    const b = variantBounds(variant([key(0.5, 0.5)], [{ id: 0, x: 1.5, y: 0.5, pivot: undefined }]))
    expect(b.w).toBe(2)
  })

  it('reports no extent for an empty variant', () => {
    expect(variantBounds(variant([]))).toEqual({ x: 0, y: 0, w: 0, h: 0 })
  })
})
