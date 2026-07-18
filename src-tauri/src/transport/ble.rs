// Keep in sync with rmk-types::protocol::rynk
use std::time::Duration;

use btleplug::api::{Central, Manager as _, Peripheral as _, ScanFilter, WriteType};
use btleplug::platform::{Adapter, Manager};
use serde::Serialize;
use tauri::State;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;
use uuid::Uuid;

use super::{ConnectResponse, DeviceDescriptor, SessionCmd, Sessions, insert_session};

#[derive(Serialize)]
pub struct BleDeviceInfo {
    pub id: String,
    pub name: Option<String>,
}

const RYNK_SERVICE_UUID: Uuid = Uuid::from_u128(0x10900067_537f_4f0a_9b55_929e271f61ab);
const RYNK_INPUT_CHAR_UUID: Uuid = Uuid::from_u128(0x80f9319b_0c74_43a5_9738_c59d6dda3db9);
const RYNK_OUTPUT_CHAR_UUID: Uuid = Uuid::from_u128(0x19802524_6f90_4346_93c2_63dbc509ab55);
const BLE_SAFE_WRITE: usize = 20;
const RYNK_BLE_CHUNK_SIZE: usize = 244;

// GATT Device Information Service characteristics (standard BLE UUIDs).
const DIS_PNP_ID_UUID: Uuid = Uuid::from_u128(0x00002a50_0000_1000_8000_00805f9b34fb);
const DIS_SERIAL_UUID: Uuid = Uuid::from_u128(0x00002a25_0000_1000_8000_00805f9b34fb);
const DIS_MANUFACTURER_UUID: Uuid = Uuid::from_u128(0x00002a29_0000_1000_8000_00805f9b34fb);

async fn get_adapter() -> Result<Adapter, String> {
    let manager = Manager::new().await.map_err(|e| e.to_string())?;
    manager.adapters().await.map_err(|e| e.to_string())?
        .into_iter().next().ok_or("no BLE adapter".into())
}

// ── Discovery ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn rynk_discover_ble() -> Result<Vec<BleDeviceInfo>, String> {
    let adapter = get_adapter().await?;
    adapter.start_scan(ScanFilter { services: vec![RYNK_SERVICE_UUID] }).await.map_err(|e| e.to_string())?;
    tokio::time::sleep(Duration::from_secs(2)).await;
    let peripherals = adapter.peripherals().await.map_err(|e| e.to_string())?;
    let _ = adapter.stop_scan().await;

    let mut out = Vec::new();
    for p in peripherals {
        let props = p.properties().await.ok().flatten();
        let name = props.and_then(|p| p.local_name);
        out.push(BleDeviceInfo {
            id: p.id().to_string(),
            name,
        });
    }
    Ok(out)
}

// ── Connect ────────────────────────────────────────────────────────────────────

async fn read_dis_descriptor(
    peripheral: &btleplug::platform::Peripheral,
    product_name: String,
) -> DeviceDescriptor {
    let chars = peripheral.characteristics();
    let mut desc = DeviceDescriptor { product_name, ..Default::default() };

    // PnP ID (0x2A50): 7 bytes = vid_source(1) + vendor_id(2 LE) + product_id(2 LE) + version(2 LE)
    if let Some(c) = chars.iter().find(|c| c.uuid == DIS_PNP_ID_UUID) {
        if let Ok(data) = peripheral.read(c).await {
            if data.len() >= 7 {
                desc.vendor_id = u16::from_le_bytes([data[1], data[2]]);
                desc.product_id = u16::from_le_bytes([data[3], data[4]]);
            }
        }
    }
    // Serial Number (0x2A25)
    if let Some(c) = chars.iter().find(|c| c.uuid == DIS_SERIAL_UUID) {
        if let Ok(data) = peripheral.read(c).await {
            desc.serial_number = String::from_utf8_lossy(&data).into_owned();
        }
    }
    // Manufacturer Name (0x2A29)
    if let Some(c) = chars.iter().find(|c| c.uuid == DIS_MANUFACTURER_UUID) {
        if let Ok(data) = peripheral.read(c).await {
            desc.manufacturer = String::from_utf8_lossy(&data).into_owned();
        }
    }
    desc
}

#[tauri::command]
pub async fn rynk_connect_ble(id: String, sessions: State<'_, Sessions>) -> Result<ConnectResponse, String> {
    let adapter = get_adapter().await?;
    let peripherals = adapter.peripherals().await.map_err(|e| e.to_string())?;
    let peripheral = peripherals.into_iter()
        .find(|p| p.id().to_string() == id)
        .ok_or("device not found")?;

    peripheral.connect().await.map_err(|e| e.to_string())?;
    peripheral.discover_services().await.map_err(|e| e.to_string())?;

    // Read GATT Device Information Service for vid/pid/manufacturer/serial.
    let product_name = peripheral.properties().await.ok().flatten()
        .and_then(|p| p.local_name).unwrap_or_default();
    let descriptor = read_dis_descriptor(&peripheral, product_name).await;

    let chars = peripheral.characteristics();
    let input = chars.iter().find(|c| c.uuid == RYNK_INPUT_CHAR_UUID)
        .ok_or("input characteristic not found")?.clone();
    let output = chars.iter().find(|c| c.uuid == RYNK_OUTPUT_CHAR_UUID)
        .ok_or("output characteristic not found")?.clone();

    peripheral.subscribe(&input).await.map_err(|e| e.to_string())?;
    let notifications = peripheral.notifications().await.map_err(|e| e.to_string())?;

    let mtu = peripheral.mtu() as usize;
    let write_chunk = mtu.saturating_sub(3).clamp(BLE_SAFE_WRITE, RYNK_BLE_CHUNK_SIZE);

    let (cmd_tx, mut cmd_rx) = mpsc::channel::<SessionCmd>(64);
    let (data_tx, data_rx) = mpsc::channel::<Vec<u8>>(64);

    tokio::spawn(async move {
        let mut notifications = notifications;
        loop {
            tokio::select! {
                biased;
                cmd = cmd_rx.recv() => match cmd {
                    Some(SessionCmd::Send(data, ack)) => {
                        let mut off = 0;
                        while off < data.len() {
                            let n = (data.len() - off).min(write_chunk);
                            let _ = peripheral.write(&output, &data[off..off + n], WriteType::WithResponse).await;
                            off += n;
                        }
                        let _ = ack.send(());
                    }
                    Some(SessionCmd::Close) | None => {
                        let _ = peripheral.unsubscribe(&input).await;
                        let _ = peripheral.disconnect().await;
                        break;
                    }
                },
                notif = notifications.next() => match notif {
                    Some(n) => { if data_tx.send(n.value).await.is_err() { break; } }
                    None => { let _ = data_tx.send(Vec::new()).await; break; }
                },
            }
        }
    });

    let session = insert_session(&sessions, cmd_tx, data_rx).await;
    Ok(ConnectResponse { session, descriptor })
}
