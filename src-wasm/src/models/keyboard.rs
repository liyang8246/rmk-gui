use super::{KeyCode, keycode_to_display};
use serde::Serialize;
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug)]
pub struct KeyboardParams {
    #[allow(unused)]
    pub name:       String,
    pub rows:       u8,
    pub cols:       u8,
    pub layers:     u8,
    pub macros:     u8,
    pub keys:       usize,
    pub payload:    Value,
    // (layer, row, col)
    pub keymap_set: BTreeMap<(u8, u8, u8), KeyCode>,
}

impl KeyboardParams {
    pub fn new() -> Self {
        Self {
            name:       String::from(""),
            rows:       0,
            cols:       0,
            layers:     0,
            macros:     0,
            keys:       0,
            payload:    Value::Null,
            keymap_set: BTreeMap::new(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct Key {
    pub lyr_row_col: (u8, u8, u8),
    pub position_x:  (f64, f64),
    pub position_y:  (f64, f64),
    pub width:       (f64, f64),
    pub height:      (f64, f64),
    pub rotation:    (f64, f64, f64),
    pub keycode:     KeyCode,
    pub display:     (String, Option<String>),
}

impl Key {
    pub fn new(
        lyr_row_col: (u8, u8, u8),
        position_x: (f64, f64),
        position_y: (f64, f64),
        width: (f64, f64),
        height: (f64, f64),
        rotation: (f64, f64, f64),
        keycode: KeyCode,
    ) -> Self {
        Self {
            lyr_row_col,
            position_x,
            position_y,
            width,
            height,
            rotation,
            keycode,
            display: keycode_to_display(keycode),
        }
    }
}
