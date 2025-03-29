// src-tauri/src/models/keyboard.rs
interface Key {
  lyr_row_col: [number, number, number]; // (u8, u8, u8) -> [number, number, number]
  position_x: [number, number]; // (f64, f64) -> [number, number]
  position_y: [number, number]; // (f64, f64) -> [number, number]
  width: [number, number]; // (f64, f64) -> [number, number]
  height: [number, number]; // (f64, f64) -> [number, number]
  rotation: [number, number, number]; // (f64, f64, f64) -> [number, number, number]
  keycode: number; // KeyCode (u16) -> number
  display: [string, string] | [string]; // Comma -> [',', '<'] or F1 -> ['F1']
}

// src-tauri/src/models/vial_device.rs
interface VialDevice {
  product_string: string; // String -> string
  path: number[]; // CString -> number[]
}

interface Keyboard {
  name: string;
  layer: number;
  row: number;
  col: number;
  keys: Key[];
}
