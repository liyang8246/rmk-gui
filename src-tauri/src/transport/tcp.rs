use tauri::State;

use super::{Sessions, spawn_tokio_io};

#[tauri::command]
pub async fn rynk_connect_tcp(addr: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    let stream = tokio::net::TcpStream::connect(&addr).await.map_err(|e| e.to_string())?;
    let (read, write) = tokio::io::split(stream);
    let id = spawn_tokio_io(sessions, read, write).await;
    Ok(id)
}
