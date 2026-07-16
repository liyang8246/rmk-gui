use serde::Serialize;

#[derive(Serialize)]
pub struct TcpDeviceInfo {
    pub addr: String,
    pub name: String,
}

#[tauri::command]
pub async fn rynk_discover_tcp() -> Result<Vec<TcpDeviceInfo>, String> {
    // Probe the default QEMU port — connect succeeds if QEMU is running.
    let addr = "127.0.0.1:7965";
    match tokio::net::TcpStream::connect(addr).await {
        Ok(_) => Ok(vec![TcpDeviceInfo { addr: addr.into(), name: "QEMU".into() }]),
        Err(_) => Ok(vec![]),
    }
}

#[tauri::command]
pub async fn rynk_connect_tcp(addr: String, sessions: tauri::State<'_, super::Sessions>) -> Result<String, String> {
    let stream = tokio::net::TcpStream::connect(&addr).await.map_err(|e| e.to_string())?;
    let (read, write) = tokio::io::split(stream);
    let id = super::spawn_tokio_io(sessions, read, write).await;
    Ok(id)
}
