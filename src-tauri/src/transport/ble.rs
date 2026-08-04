use std::time::Duration;

use rynk::RynkDevice;
use rynk_ble::BleDevice;
use serde::Serialize;
use tauri::State;

use super::{Sessions, rynk_pump, spawn_session};

#[derive(Serialize)]
pub struct BleDeviceInfo {
    pub id: String,
    pub name: Option<String>,
}

/// An adapter that is off, or whose permission the user has not answered, parks
/// in `wait_available` instead of erroring — and the device list waits on every
/// transport, so an unbounded BLE probe would hide the USB keyboards too.
const DISCOVER_TIMEOUT: Duration = Duration::from_secs(3);

/// No scan: a keyboard the host is typing on is already connected, and a
/// connected peripheral stops advertising — scanning would never find it.
/// `rynk-ble` asks the adapter for connected peers exposing the Rynk service,
/// which is also the only way to tell a Rynk keyboard from any other.
#[tauri::command]
pub async fn rynk_discover_ble() -> Result<Vec<BleDeviceInfo>, String> {
    let devices = match tokio::time::timeout(DISCOVER_TIMEOUT, BleDevice::discover()).await {
        Ok(result) => result.map_err(|e| e.to_string())?,
        // No adapter, or no answer yet: report no BLE keyboards rather than
        // stalling the picker. A later rescan picks them up.
        Err(_) => return Ok(Vec::new()),
    };
    Ok(devices
        .into_iter()
        .map(|d| BleDeviceInfo {
            id: format!("{:?}", d.id()),
            name: d.name,
        })
        .collect())
}

#[tauri::command]
pub async fn rynk_connect_ble(id: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    let device = BleDevice::discover()
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .find(|d| format!("{:?}", d.id()) == id)
        .ok_or_else(|| "keyboard is no longer connected".to_string())?;
    let (read, write) = device.open().await.map_err(|e| e.to_string())?;
    Ok(spawn_session(sessions, |cmd_rx, data_tx| rynk_pump(read, write, cmd_rx, data_tx)).await)
}
