//! USB DFU control transfers for the frontend's download sequence: the native
//! counterpart of WebUSB. The protocol lives in the frontend; this only lists
//! DFU-capable devices and relays control requests to one.

use std::collections::HashMap;
use std::time::Duration;

use nusb::transfer::{ControlIn, ControlOut, ControlType, Recipient};
use nusb::{DeviceInfo, Interface};
use serde::Serialize;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

const DFU_CLASS: u8 = 0xFE;
const DFU_SUBCLASS: u8 = 0x01;
const DFU_PROTOCOL_RUNTIME: u8 = 0x01;
const DFU_PROTOCOL_MODE: u8 = 0x02;

/// Long enough for a page erase behind a busy poll; the frontend paces itself
/// on the device's `bwPollTimeout`, so nothing here waits on flash.
const TIMEOUT: Duration = Duration::from_secs(5);

pub struct DfuSession {
    device: nusb::Device,
    interface: Interface,
}

pub type DfuSessions = Mutex<HashMap<String, DfuSession>>;

#[derive(Serialize)]
pub struct DfuDeviceInfo {
    pub id: String,
    pub name: String,
    /// `"dfu"` for a bootloader, `"runtime"` for an application that can reboot into one.
    pub mode: &'static str,
}

#[derive(Serialize)]
pub struct DfuOpened {
    pub session: String,
    pub label: String,
    pub interface: u8,
}

fn dfu_interface(info: &DeviceInfo) -> Option<(u8, &'static str)> {
    info.interfaces().find_map(|i| {
        if i.class() != DFU_CLASS || i.subclass() != DFU_SUBCLASS {
            return None;
        }
        match i.protocol() {
            DFU_PROTOCOL_MODE => Some((i.interface_number(), "dfu")),
            DFU_PROTOCOL_RUNTIME => Some((i.interface_number(), "runtime")),
            _ => None,
        }
    })
}

fn device_id(info: &DeviceInfo) -> String {
    format!("{:?}", info.id())
}

fn label(info: &DeviceInfo) -> String {
    info.product_string()
        .map(str::to_owned)
        .unwrap_or_else(|| format!("USB {:04x}:{:04x}", info.vendor_id(), info.product_id()))
}

fn control_type(name: &str) -> Result<ControlType, String> {
    match name {
        "standard" => Ok(ControlType::Standard),
        "class" => Ok(ControlType::Class),
        _ => Err(format!("unknown control type {name}")),
    }
}

fn recipient(name: &str) -> Result<Recipient, String> {
    match name {
        "device" => Ok(Recipient::Device),
        "interface" => Ok(Recipient::Interface),
        _ => Err(format!("unknown recipient {name}")),
    }
}

/// DFU-capable devices — bootloaders and applications that can reboot into one
/// — by the interface class triple; cached descriptors only.
#[tauri::command]
pub async fn dfu_discover() -> Result<Vec<DfuDeviceInfo>, String> {
    let devices = nusb::list_devices().await.map_err(|e| e.to_string())?;
    Ok(devices
        .filter_map(|d| {
            dfu_interface(&d).map(|(_, mode)| DfuDeviceInfo { id: device_id(&d), name: label(&d), mode })
        })
        .collect())
}

#[tauri::command]
pub async fn dfu_open(id: String, sessions: State<'_, DfuSessions>) -> Result<DfuOpened, String> {
    let info = nusb::list_devices()
        .await
        .map_err(|e| e.to_string())?
        .find(|d| device_id(d) == id)
        .ok_or_else(|| format!("no DFU device {id}"))?;
    let (interface, _) = dfu_interface(&info).ok_or("device has no DFU interface")?;
    let device = info.open().await.map_err(|e| e.to_string())?;
    let claimed = device.detach_and_claim_interface(interface).await.map_err(|e| e.to_string())?;
    let session = Uuid::new_v4().to_string();
    sessions.lock().await.insert(session.clone(), DfuSession { device, interface: claimed });
    Ok(DfuOpened { session, label: label(&info), interface })
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn dfu_control_out(
    session: String,
    control_type: String,
    recipient: String,
    request: u8,
    value: u16,
    index: u16,
    data: Vec<u8>,
    sessions: State<'_, DfuSessions>,
) -> Result<(), String> {
    let sessions = sessions.lock().await;
    let s = sessions.get(&session).ok_or("no such DFU session")?;
    s.interface
        .control_out(
            ControlOut {
                control_type: self::control_type(&control_type)?,
                recipient: self::recipient(&recipient)?,
                request,
                value,
                index,
                data: &data,
            },
            TIMEOUT,
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn dfu_control_in(
    session: String,
    control_type: String,
    recipient: String,
    request: u8,
    value: u16,
    index: u16,
    length: u16,
    sessions: State<'_, DfuSessions>,
) -> Result<Vec<u8>, String> {
    let sessions = sessions.lock().await;
    let s = sessions.get(&session).ok_or("no such DFU session")?;
    s.interface
        .control_in(
            ControlIn {
                control_type: self::control_type(&control_type)?,
                recipient: self::recipient(&recipient)?,
                request,
                value,
                index,
                length,
            },
            TIMEOUT,
        )
        .await
        .map_err(|e| e.to_string())
}

/// Bus-reset the device so the bootloader restarts into the image it just
/// installed. Unsupported on Windows, where the bootloader restarts on the
/// next request instead — so a failure here is not one.
#[tauri::command]
pub async fn dfu_reset(session: String, sessions: State<'_, DfuSessions>) -> Result<(), String> {
    let sessions = sessions.lock().await;
    let s = sessions.get(&session).ok_or("no such DFU session")?;
    s.device.reset().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn dfu_close(session: String, sessions: State<'_, DfuSessions>) -> Result<(), String> {
    sessions.lock().await.remove(&session);
    Ok(())
}
