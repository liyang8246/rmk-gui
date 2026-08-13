//! Native Vial transport: raw HID on the classic 0xFF60 vendor page, via
//! `hidapi`. Covers USB keyboards and OS-bonded Bluetooth ones alike — both
//! surface from the same enumeration.
//!
//! `HidDevice` is `Send` but not `Sync`, so one thread owns the handle and the
//! pump is shaped for Vial's lockstep instead of the tokio select the byte
//! transports use: idle means blocked on the command channel (a send wakes it
//! instantly, no poll latency), and a blocking `read` only ever runs right
//! after a request went out. A device that stays silent for the whole reply
//! window reads as a dead link — the per-exchange watchdog the protocol
//! itself doesn't have.

use hidapi::{BusType, HidApi, HidDevice};
use serde::Serialize;
use tauri::State;
use tokio::sync::mpsc;

use super::{insert_session, SessionCmd, Sessions};

const VIAL_USAGE_PAGE: u16 = 0xFF60;
const VIAL_USAGE: u16 = 0x61;
/// One request or response report; id 0 goes in front of writes.
const REPORT_SIZE: usize = 32;
/// Total silence budget after a request, sliced so a close stays responsive.
const REPLY_TIMEOUT_MS: i32 = 3_000;
const REPLY_SLICE_MS: i32 = 100;

#[derive(Serialize)]
pub struct VialHidDeviceInfo {
    pub id: String,
    pub name: String,
    pub bluetooth: bool,
}

fn label(info: &hidapi::DeviceInfo) -> String {
    match info.product_string() {
        Some(name) if !name.trim().is_empty() => name.to_string(),
        _ => format!("HID {:04x}:{:04x}", info.vendor_id(), info.product_id()),
    }
}

/// Enumerate Vial interfaces. The interface path is the id: unique per
/// interface and stable while the device stays attached, and `open_path` is
/// the one open that cannot grab a sibling interface by mistake.
#[tauri::command]
pub async fn vial_discover_hid() -> Result<Vec<VialHidDeviceInfo>, String> {
    tokio::task::spawn_blocking(|| {
        let api = HidApi::new().map_err(|e| e.to_string())?;
        Ok(api
            .device_list()
            .filter(|d| d.usage_page() == VIAL_USAGE_PAGE && d.usage() == VIAL_USAGE)
            .map(|d| VialHidDeviceInfo {
                id: d.path().to_string_lossy().into_owned(),
                name: label(d),
                bluetooth: matches!(d.bus_type(), BusType::Bluetooth),
            })
            .collect())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn vial_connect_hid(id: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    let device = tokio::task::spawn_blocking(move || {
        let api = HidApi::new().map_err(|e| e.to_string())?;
        let path = std::ffi::CString::new(id).map_err(|e| e.to_string())?;
        api.open_path(&path).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())??;

    let (cmd_tx, cmd_rx) = mpsc::channel::<SessionCmd>(64);
    let (data_tx, data_rx) = mpsc::channel::<Vec<u8>>(64);
    std::thread::spawn(move || pump(device, cmd_rx, data_tx));
    Ok(insert_session(&sessions, cmd_tx, data_rx).await)
}

/// Forward whatever already sits in the OS buffer — stale replies from a
/// desynced session the client's echo check will discard. `Ok(false)` when the
/// device errored (and EOF was sent).
fn forward_pending(device: &HidDevice, data_tx: &mpsc::Sender<Vec<u8>>) -> bool {
    let mut buf = [0u8; REPORT_SIZE];
    loop {
        match device.read_timeout(&mut buf, 0) {
            Ok(0) => return true,
            Ok(n) => {
                if data_tx.blocking_send(buf[..n].to_vec()).is_err() {
                    return false;
                }
            }
            Err(_) => {
                let _ = data_tx.blocking_send(Vec::new());
                return false;
            }
        }
    }
}

/// A close queued behind the reply wait; a stray send here cannot happen —
/// the protocol client is lockstep and only sends after the reply lands.
fn close_requested(cmd_rx: &mut mpsc::Receiver<SessionCmd>) -> bool {
    loop {
        match cmd_rx.try_recv() {
            Ok(SessionCmd::Close) | Err(mpsc::error::TryRecvError::Disconnected) => return true,
            Ok(SessionCmd::Send(_, _)) => continue,
            Err(mpsc::error::TryRecvError::Empty) => return false,
        }
    }
}

fn pump(device: HidDevice, mut cmd_rx: mpsc::Receiver<SessionCmd>, data_tx: mpsc::Sender<Vec<u8>>) {
    let mut buf = [0u8; REPORT_SIZE];
    loop {
        match cmd_rx.blocking_recv() {
            Some(SessionCmd::Send(data, ack)) => {
                if !forward_pending(&device, &data_tx) {
                    let _ = ack.send(());
                    return;
                }
                // hidapi wants the report id in front; the device's collection
                // uses id 0.
                let mut report = Vec::with_capacity(data.len() + 1);
                report.push(0);
                report.extend_from_slice(&data);
                if device.write(&report).is_err() {
                    let _ = ack.send(());
                    let _ = data_tx.blocking_send(Vec::new());
                    return;
                }
                let _ = ack.send(());
                let mut waited = 0;
                loop {
                    match device.read_timeout(&mut buf, REPLY_SLICE_MS) {
                        Ok(0) => {
                            waited += REPLY_SLICE_MS;
                            if close_requested(&mut cmd_rx) {
                                return;
                            }
                            if waited >= REPLY_TIMEOUT_MS {
                                let _ = data_tx.blocking_send(Vec::new());
                                return;
                            }
                        }
                        Ok(n) => {
                            let _ = data_tx.blocking_send(buf[..n].to_vec());
                            break;
                        }
                        Err(_) => {
                            let _ = data_tx.blocking_send(Vec::new());
                            return;
                        }
                    }
                }
                if !forward_pending(&device, &data_tx) {
                    return;
                }
            }
            Some(SessionCmd::Close) | None => return,
        }
    }
}
