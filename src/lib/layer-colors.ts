/// One dot colour per layer, cycling — the design's palette.
export const LAYER_COLORS = [
  '#ff8904',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
]

export function layerColor(layer: number): string {
  return LAYER_COLORS[layer % LAYER_COLORS.length]!
}
