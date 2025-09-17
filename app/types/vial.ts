export type IndexMap = StringMap<[number, number, number], number>

export interface VialInterface {
  productName: () => Promise<string>
  layerCount: () => Promise<number>
  marcoCount: () => Promise<number>
  vialJson: () => Promise<VialJson>
  kleDefinition: (vialJson: VialJson) => InstanceType<typeof KleBoard>
  keymap: (layer: number, rows: number, cols: number) => Promise<IndexMap>
  layoutKeymap: (
    layout: InstanceType<typeof KleBoard>,
    keymap: IndexMap,
    layerCount: number
  ) => IndexMap
  macros: (count: number) => Promise<Array<Array<MacroAction>>>
  setKeycode: (lyrRowCol: [number, number, number], keycode: number) => Promise<void>
}

export interface CustomKeycode {
  name: string
  title: string
  shortName: string
}

export type KeymapItem
  = | string
    | {
      r?: number
      rx?: number
      ry?: number
      x?: number
      y?: number
      w?: number
    }

export interface Layout {
  keymap: KeymapItem[][]
}

export interface VialJson {
  name: string
  vendorId: string
  productId: string
  lighting: string
  matrix: {
    rows: number
    cols: number
  }
  customKeycodes: CustomKeycode[]
  layouts: Layout
}
