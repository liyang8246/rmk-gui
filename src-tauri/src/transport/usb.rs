use rynk::RynkDevice;
use rynk_usb::UsbDevice;
use serde::Serialize;
use tauri::State;

use super::{Sessions, rynk_pump, spawn_session};

#[derive(Serialize)]
pub struct UsbDeviceInfo {
    pub id: String,
    pub name: String,
}

/// The one encoding of a device's identity, shared by discover and connect so
/// the two cannot drift.
fn device_id(device: &UsbDevice) -> String {
    format!("{:?}", device.id())
}

/// `rynk-usb` recognises a keyboard by the vendor interface class triple the
/// firmware advertises, reading only cached descriptors — no device is opened
/// and there is no DTR to trip.
#[tauri::command]
pub async fn rynk_discover_usb() -> Result<Vec<UsbDeviceInfo>, String> {
    let devices = UsbDevice::discover().await.map_err(|e| e.to_string())?;
    Ok(devices
        .into_iter()
        .map(|d| UsbDeviceInfo {
            id: device_id(&d),
            name: d.label(),
        })
        .collect())
}

#[tauri::command]
pub async fn rynk_connect_usb(id: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    // Re-listing is how an id becomes a device: `DeviceId` is stable across
    // enumerations while the keyboard stays plugged in, and `UsbDevice` is the
    // only thing that can open one.
    let device = UsbDevice::discover()
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .find(|d| device_id(d) == id)
        .ok_or_else(|| format!("no Rynk keyboard {id}"))?;
    let (read, write) = device.open().await.map_err(|e| e.to_string())?;
    Ok(spawn_session(sessions, |cmd_rx, data_tx| rynk_pump(read, write, cmd_rx, data_tx)).await)
}
