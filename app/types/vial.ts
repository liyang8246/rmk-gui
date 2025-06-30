export interface VialInterface {
  productName(): Promise<string>;
  layerCount(): Promise<number>;
  marcoCount(): Promise<number>;
  vialJson(): Promise<VialJson>;
  kleDefinition(vialJson: VialJson): InstanceType<typeof Keyboard>;
}

export enum VialCommand {
  GetSize = 0x01,
  GetDefinition = 0x02,
  SetKeycode = 0x05,
  GetMacroCount = 0x0c,
  GetMacroBuffer = 0x0e,
  GetMacroBufferSize = 0x0d,
  GetLayerCount = 0x11,
  GetKeymapBuffer = 0x12,
  VialPrefix = 0xfe,
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
