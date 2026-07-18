use serde::Serialize;
use tauri::State;

use super::{DeviceDescriptor, Sessions, spawn_tokio_io};

#[derive(Serialize)]
pub struct SerialDeviceInfo {
    pub path: String,
    pub name: Option<String>,
    pub descriptor: DeviceDescriptor,
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
        let (name, descriptor) = match p.port_type {
            SerialPortType::UsbPort(info) => (
                info.product.clone(),
                DeviceDescriptor {
                    vendor_id: info.vid,
                    product_id: info.pid,
                    manufacturer: info.manufacturer.unwrap_or_default(),
                    product_name: info.product.unwrap_or_default(),
                    serial_number: info.serial_number.unwrap_or_default(),
                },
            ),
            _ => (None, DeviceDescriptor::default()),
        };
        SerialDeviceInfo { path: p.port_name, name, descriptor }
    }).collect())
}

#[tauri::command]
pub async fn rynk_connect_serial(path: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    use tokio_serial::{ClearBuffer, SerialPort, SerialPortBuilderExt};
    let stream = tokio_serial::new(&path, 115_200).open_native_async().map_err(|e| e.to_string())?;
    let _ = stream.clear(ClearBuffer::Input);
    let (read, write) = tokio::io::split(stream);
    let id = spawn_tokio_io(sessions, read, write).await;
    Ok(id)
}
