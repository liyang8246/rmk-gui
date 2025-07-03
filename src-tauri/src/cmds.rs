use std::ffi::CString;

use crate::{
    models::{AppState, VialDevice},
    utils::{hid_write_read, is_vial_device},
};

#[tauri::command]
pub async fn list(state: tauri::State<'_, AppState>) -> Result<Vec<VialDevice>, String> {
    let mut state = state.lock().await;
    state
        .hid_api
        .refresh_devices()
        .map_err(|e| format!("Failed to refresh HID devices: {}", e))?;
    let devices = state
        .hid_api
        .device_list()
        .filter(|device_info| is_vial_device(device_info))
        .map(|device_info| {
            VialDevice::new(
                device_info.product_string().unwrap_or("Unknown Device").to_string(),
                device_info.path().to_owned(),
            )
        })
        .collect();
    Ok(devices)
}

#[tauri::command]
pub async fn connect(state: tauri::State<'_, AppState>, path: CString) -> Result<(), String> {
    let mut state = state.lock().await;

    let device = match state.hid_api.open_path(&path) {
        Ok(device) => device,
        Err(e) => return Err(format!("Failed to connect to selected device: {}", e)),
    };
    state.current_device = Some(device);
    Ok(())
}

#[tauri::command]
pub async fn product_name(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let state = state.lock().await;
    return Ok(state
        .current_device
        .as_ref()
        .unwrap()
        .get_device_info()
        .unwrap()
        .product_string()
        .unwrap()
        .to_string());
}

#[tauri::command]
pub async fn write_read(state: tauri::State<'_, AppState>, data: Vec<u8>) -> Result<[u8; 32], String> {
    let state = state.lock().await;
    let device = state.current_device.as_ref().unwrap();

    let data = hid_write_read(device, &data).unwrap();

    Ok(data)
}
