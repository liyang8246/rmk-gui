export interface VialInterface {
  productName(): Promise<string>;
  layerCount(): Promise<number>;
  marcoCount(): Promise<number>;
  vialJson(): Promise<VialJson>;
  kleDefinition(vialJson: VialJson): InstanceType<typeof Keyboard>;
  keymap(layer: number, rows: number, cols: number): Promise<[string | null, string | null][]>;
}

export interface Matrix {
  rows: number;
  cols: number;
}

export interface CustomKeycode {
  name: string;
  title: string;
  shortName: string;
}

export type KeymapItem =
  | string
  | {
      r?: number;
      rx?: number;
      ry?: number;
      x?: number;
      y?: number;
      w?: number;
    };

export interface Layout {
  keymap: KeymapItem[][];
}

export interface VialJson {
  name: string;
  vendorId: string;
  productId: string;
  lighting: string;
  matrix: Matrix;
  customKeycodes: CustomKeycode[];
  layouts: Layout;
}
