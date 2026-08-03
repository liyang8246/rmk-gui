use rynk::RynkDevice;
use rynk_serial::SerialDevice;
use serde::Serialize;
use tauri::State;

use super::{Sessions, rynk_pump, spawn_session};

#[derive(Serialize)]
pub struct SerialDeviceInfo {
    pub path: String,
    pub name: Option<String>,
}

/// `rynk-serial` recognises a keyboard by the marker the firmware prepends to
/// its USB serial number, and deliberately never opens a port to do it —
/// opening a CDC port toggles DTR, which resets some MCUs.
#[tauri::command]
pub async fn rynk_discover_serial() -> Result<Vec<SerialDeviceInfo>, String> {
    let devices = SerialDevice::discover().map_err(|e| e.to_string())?;
    Ok(devices
        .into_iter()
        .map(|d| SerialDeviceInfo {
            path: d.path,
            name: d.name,
        })
        .collect())
}

#[tauri::command]
pub async fn rynk_connect_serial(path: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    // Re-listing is how a path becomes a device: `SerialDevice` is the only
    // thing that can open one, and it carries the marker check with it.
    let device = SerialDevice::discover()
        .map_err(|e| e.to_string())?
        .into_iter()
        .find(|d| d.path == path)
        .ok_or_else(|| format!("no Rynk keyboard at {path}"))?;
    let (read, write) = device.open().await.map_err(|e| e.to_string())?;
    Ok(spawn_session(sessions, |cmd_rx, data_tx| rynk_pump(read, write, cmd_rx, data_tx)).await)
}
