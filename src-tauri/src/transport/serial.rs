use serde::Serialize;
use tauri::State;

use super::{ConnectResponse, DeviceDescriptor, Sessions, spawn_tokio_io};

#[derive(Serialize)]
pub struct SerialDeviceInfo {
    pub path: String,
    pub name: Option<String>,
}

const RYNK_SERIAL_MAGIC: &str = "rynk:";

#[tauri::command]
pub async fn rynk_discover_serial() -> Result<Vec<SerialDeviceInfo>, String> {
    use tokio_serial::{SerialPortType, available_ports};
    let ports = available_ports().map_err(|e| e.to_string())?;
    let mut ports: Vec<_> = ports.into_iter().filter(|p| {
        matches!(&p.port_type, SerialPortType::UsbPort(info)
            if info.serial_number.as_deref().is_some_and(|s| s.to_ascii_lowercase().contains(RYNK_SERIAL_MAGIC)))
    }).collect();
    // macOS exposes one USB CDC device as both /dev/cu.* and /dev/tty.* — keep cu.* only.
    let cu_nodes: std::collections::HashSet<String> = ports.iter()
        .map(|p| p.port_name.clone()).filter(|p| p.starts_with("/dev/cu.")).collect();
    ports.retain(|p| match p.port_name.strip_prefix("/dev/tty.") {
        Some(suffix) => !cu_nodes.contains(&format!("/dev/cu.{suffix}")),
        None => true,
    });
    Ok(ports.into_iter().map(|p| {
        let name = match p.port_type { SerialPortType::UsbPort(info) => info.product, _ => None };
        SerialDeviceInfo { path: p.port_name, name }
    }).collect())
}

#[tauri::command]
pub async fn rynk_connect_serial(path: String, sessions: State<'_, Sessions>) -> Result<ConnectResponse, String> {
    use tokio_serial::{ClearBuffer, SerialPort, SerialPortBuilderExt, SerialPortType, available_ports};
    let stream = tokio_serial::new(&path, 115_200).open_native_async().map_err(|e| e.to_string())?;
    let _ = stream.clear(ClearBuffer::Input);
    let (read, write) = tokio::io::split(stream);
    let session = spawn_tokio_io(sessions, read, write).await;

    // Re-query the port's USB descriptor for identity (vid/pid/manufacturer/serial).
    let descriptor = available_ports().map_err(|e| e.to_string())?
        .into_iter().find(|p| p.port_name == path)
        .and_then(|p| match p.port_type {
            SerialPortType::UsbPort(info) => Some(DeviceDescriptor {
                vendor_id: info.vid,
                product_id: info.pid,
                manufacturer: info.manufacturer.unwrap_or_default(),
                product_name: info.product.unwrap_or_default(),
                serial_number: info.serial_number.unwrap_or_default(),
            }),
            _ => None,
        })
        .unwrap_or_default();

    Ok(ConnectResponse { session, descriptor })
}
