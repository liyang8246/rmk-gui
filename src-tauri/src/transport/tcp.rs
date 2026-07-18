use serde::Serialize;
use std::time::Duration;
use tauri::State;

use super::{ConnectResponse, Sessions, spawn_tokio_io};

#[derive(Serialize)]
pub struct TcpDeviceInfo {
    pub addr: String,
    pub name: String,
}

const QEMU_ADDR: &str = "127.0.0.1:7965";

#[tauri::command]
pub async fn rynk_discover_tcp() -> Vec<TcpDeviceInfo> {
    #[cfg(debug_assertions)]
    {
        match tokio::time::timeout(Duration::from_millis(300), tokio::net::TcpStream::connect(QEMU_ADDR)).await {
            Ok(Ok(_)) => vec![TcpDeviceInfo { addr: QEMU_ADDR.into(), name: "QEMU".into() }],
            _ => vec![],
        }
    }
    #[cfg(not(debug_assertions))]
    { vec![] }
}

#[tauri::command]
pub async fn rynk_connect_tcp(addr: String, sessions: State<'_, Sessions>) -> Result<ConnectResponse, String> {
    let stream = tokio::net::TcpStream::connect(&addr).await.map_err(|e| e.to_string())?;
    let (read, write) = tokio::io::split(stream);
    let session = spawn_tokio_io(sessions, read, write).await;
    Ok(ConnectResponse { session, descriptor: Default::default() })
}
