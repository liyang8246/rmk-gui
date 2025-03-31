use crate::cmds::current_device;
use byteorder::BigEndian;
use byteorder::ByteOrder;
use serde_json::Value;
use strum::IntoEnumIterator;
use wasm_bindgen::prelude::*;

use crate::models::*;
use crate::utils::*;

pub async fn get_layout(state: &AppState) -> Result<Value, ()> {
    let state = state.lock().expect("Failed to get lock");
    Ok(state.kbd_params.payload.clone())
}

pub async fn update_keymap(state: &AppState) -> Result<JsValue, JsValue> {
    let mut state = state.lock().expect("Failed to get lock");
    let device = current_device().await;
    let mut size = 2usize;
    size *= state.kbd_params.layers as usize;
    size *= state.kbd_params.rows as usize;
    size *= state.kbd_params.cols as usize;
    let mut keymap = Vec::with_capacity(size);
    for i in 0..size.div_ceil(BUFFER_FETCH_CHUNK) {
        let read_size = BUFFER_FETCH_CHUNK.min(size - i * BUFFER_FETCH_CHUNK);
        let mut msg = [0u8; 32];
        msg[0] = VialCommand::GetKeymapBuffer.into();
        BigEndian::write_u16(&mut msg[1..=2], (i * BUFFER_FETCH_CHUNK) as u16);
        msg[3] = read_size as u8;
        let data = write_read(&device, &mut msg).await.unwrap();
        keymap.extend_from_slice(&data[4..4 + read_size]);
    }
    itertools::iproduct!(0..state.kbd_params.layers, 0..state.kbd_params.rows, 0..state.kbd_params.cols).for_each(
        |(layer, row, col)| {
            let offset = layer as usize * state.kbd_params.rows as usize * state.kbd_params.cols as usize * 2
                + row as usize * state.kbd_params.cols as usize * 2
                + col as usize * 2;
            let keycode = KeyCode::from(&keymap[offset..=offset + 1]);
            state.kbd_params.keymap_set.insert((layer, row, col), keycode);
        },
    );
    Ok(JsValue::null())
}

pub async fn get_layout_keymap(state: &AppState) -> Result<JsValue, JsValue> {
    let state = state.lock().expect("Failed to get lock");
    let kle: kle_serial::Keyboard =
        serde_json::from_value(state.kbd_params.payload.clone()["layouts"]["keymap"].clone()).unwrap();
    let mut keys = vec![];
    for kle_key in kle.keys {
        let position_x = (kle_key.x, kle_key.x2);
        let position_y = (kle_key.y, kle_key.y2);
        let width = (kle_key.width, kle_key.width2);
        let height = (kle_key.height, kle_key.height2);
        let rotation = (kle_key.rotation, kle_key.rx, kle_key.ry);
        let legends_text = kle_key.legends[0].as_ref().unwrap().text.clone();
        let mut parts = legends_text.split(',').map(|s| s.parse::<u8>().unwrap());
        let row = parts.next().unwrap();
        let col = parts.next().unwrap();
        for layer in 0..state.kbd_params.layers {
            let keycode = state
                .kbd_params
                .keymap_set
                .get(&(layer, row, col))
                .unwrap_or(&KeyCode::No)
                .clone();
            keys.push(Key::new(
                (layer, row, col),
                position_x,
                position_y,
                width,
                height,
                rotation,
                keycode,
            ));
        }
    }
    Ok(serde_wasm_bindgen::to_value(&keys).unwrap())
}

pub async fn get_keycode_list(_state: &AppState) -> Result<JsValue, JsValue> {
    let mut keycode_list = vec![];
    for keycode in KeyCode::iter() {
        keycode_list.push(Key::new(
            (0, 0, 0),
            (0f64, 0f64),
            (0f64, 0f64),
            (1f64, 1f64),
            (1f64, 1f64),
            (0f64, 0f64, 0f64),
            keycode,
        ));
    }
    Ok(serde_wasm_bindgen::to_value(&keycode_list).unwrap())
}

#[derive(serde::Deserialize)]
struct SetKeycodeArgs {
    #[serde(rename = "lyrRowCol")]
    lyr_row_col: (u8, u8, u8),
    keycode: KeyCode,
}

pub async fn set_keycode(state: &AppState, args: JsValue) -> Result<JsValue, JsValue> {
    let SetKeycodeArgs { lyr_row_col, keycode } =
        serde_wasm_bindgen::from_value(args.clone()).expect("Argument parsing failed");
    let _state = state.lock().expect("Failed to get the lock");
    let device = current_device().await;
    let mut msg = [0u8; 6];
    msg[0] = VialCommand::SetKeycode.into();
    msg[1] = lyr_row_col.0;
    msg[2] = lyr_row_col.1;
    msg[3] = lyr_row_col.2;
    BigEndian::write_u16(&mut msg[4..=5], keycode as u16);
    write_read(&device, &mut msg).await.unwrap();
    Ok(JsValue::null())
}
