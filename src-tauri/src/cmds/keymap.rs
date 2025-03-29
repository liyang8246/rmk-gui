use byteorder::BigEndian;
use byteorder::ByteOrder;
use serde_json::Value;
use strum::IntoEnumIterator;

use crate::models::*;
use crate::utils::*;

#[tauri::command]
pub async fn get_layout(state: tauri::State<'_, AppState>) -> Result<Value, ()> {
    let state = state.lock().await;
    Ok(state.kbd_params.payload.clone())
}

#[tauri::command]
pub async fn update_keymap(state: tauri::State<'_, AppState>) -> Result<(), ()> {
    let mut state = state.lock().await;
    let device = state.current_device.as_ref().unwrap();
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
        let data = write_read(device, &msg).unwrap();
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
    Ok(())
}

#[tauri::command]
pub async fn get_layout_keymap(state: tauri::State<'_, AppState>) -> Result<Vec<Key>, ()> {
    let state = state.lock().await;
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
            let keycode = state.kbd_params.keymap_set.get(&(layer, row, col)).unwrap().clone();
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
    Ok(keys)
}

#[tauri::command]
pub async fn get_keycode_list(_state: tauri::State<'_, AppState>) -> Result<Vec<Key>, ()> {
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
    Ok(keycode_list)
}

#[tauri::command]
pub async fn set_keycode(state: tauri::State<'_, AppState>, lyr_row_col: (u8, u8, u8), keycode: u16) -> Result<(), ()> {
    let state = state.lock().await;
    let device = state.current_device.as_ref().unwrap();
    let mut msg = [0u8; 6];
    msg[0] = VialCommand::SetKeycode.into();
    msg[1] = lyr_row_col.0;
    msg[2] = lyr_row_col.1;
    msg[3] = lyr_row_col.2;
    BigEndian::write_u16(&mut msg[4..=5], keycode);
    write_read(&device, &msg).unwrap();
    Ok(())
}
