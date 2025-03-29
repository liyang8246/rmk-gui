use log::info;
use std::ffi::CString;

use crate::models::*;
use crate::utils::*;

#[tauri::command]
pub async fn get_vial_devices(state: tauri::State<'_, AppState>) -> Result<Vec<VialDevice>, ()> {
    let mut state = state.lock().await;
    state.hid_api.refresh_devices().unwrap();
    let mut devices = Vec::new();
    for device_info in state.hid_api.device_list() {
        let serial_number = device_info.serial_number().unwrap_or("");
        if serial_number.contains(VIAL_SERIAL_NUMBER_MAGIC) && is_rawhid(&device_info) {
            devices.push(VialDevice::new(
                device_info.product_string().unwrap().to_string(),
                device_info.path().to_owned(),
            ));
            info!(
                "Found Vial device: {} with path: {:?}",
                device_info.product_string().unwrap(),
                device_info.path()
            );
        }
    }
    Ok(devices)
}

#[tauri::command]
pub async fn connect_vial_device(state: tauri::State<'_, AppState>, path: CString) -> Result<(), ()> {
    let mut state = state.lock().await;
    let device = state.hid_api.open_path(&path).unwrap();
    state.kbd_params.layers = layer_count(&device);
    state.kbd_params.macros = macro_count(&device);
    state.kbd_params.payload = get_vial_payload(&device);
    state.kbd_params.rows = state.kbd_params.payload["matrix"]["rows"].as_u64().unwrap() as u8;
    state.kbd_params.cols = state.kbd_params.payload["matrix"]["cols"].as_u64().unwrap() as u8;
    state.kbd_params.keys = key_count(&state.kbd_params.payload);
    state.current_device = Some(device);

    Ok(())
}

#[tauri::command]
pub fn get_gui_version(_state: tauri::State<'_, AppState>) -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn get_layer_count(state: tauri::State<'_, AppState>) -> Result<u8, ()> {
    let state = state.lock().await;
    Ok(state.kbd_params.layers)
}

#[tauri::command]
pub async fn get_macro_count(state: tauri::State<'_, AppState>) -> Result<u8, ()> {
    let state = state.lock().await;
    Ok(state.kbd_params.macros)
}

#[tauri::command]
pub async fn get_key_count(state: tauri::State<'_, AppState>) -> Result<usize, ()> {
    let state = state.lock().await;
    Ok(state.kbd_params.keys)
}
