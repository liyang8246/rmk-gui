pub mod ble;
pub mod serial;
pub mod tcp;

use std::collections::HashMap;
use std::sync::Arc;

use serde::Serialize;
use tauri::State;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::{mpsc, Mutex, oneshot};
use uuid::Uuid;

// ── Device info ────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct SerialDeviceInfo {
    pub path: String,
    pub name: Option<String>,
}

#[derive(Serialize)]
pub struct BleDeviceInfo {
    pub id: String,
    pub name: Option<String>,
}

// ── Session model ───────────────────────────────────────────────────────────────

pub enum SessionCmd {
    Send(Vec<u8>, oneshot::Sender<()>),
    Close,
}

pub struct Session {
    cmd_tx: mpsc::Sender<SessionCmd>,
    data_rx: Arc<Mutex<mpsc::Receiver<Vec<u8>>>>,
}

pub type Sessions = Mutex<HashMap<String, Session>>;

pub async fn insert_session(sessions: &State<'_, Sessions>, cmd_tx: mpsc::Sender<SessionCmd>, data_rx: mpsc::Receiver<Vec<u8>>) -> String {
    let id = Uuid::new_v4().to_string();
    sessions.lock().await.insert(id.clone(), Session { cmd_tx, data_rx: Arc::new(Mutex::new(data_rx)) });
    id
}

/// Spawn a reader/writer task for tokio AsyncRead+AsyncWrite halves (serial/TCP).
/// Returns the session id.
pub async fn spawn_tokio_io<R, W>(sessions: State<'_, Sessions>, read: R, write: W) -> String
where
    R: tokio::io::AsyncRead + Unpin + Send + 'static,
    W: tokio::io::AsyncWrite + Unpin + Send + 'static,
{
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<SessionCmd>(64);
    let (data_tx, data_rx) = mpsc::channel::<Vec<u8>>(64);
    let mut reader = read;
    let mut writer = write;
    tokio::spawn(async move {
        let mut buf = [0u8; 4096];
        loop {
            tokio::select! {
                biased;
                cmd = cmd_rx.recv() => match cmd {
                    Some(SessionCmd::Send(data, ack)) => { let _ = writer.write_all(&data).await; let _ = ack.send(()); }
                    Some(SessionCmd::Close) | None => break,
                },
                result = reader.read(&mut buf) => match result {
                    Ok(0) | Err(_) => { let _ = data_tx.send(Vec::new()).await; break; }
                    Ok(n) => { if data_tx.send(buf[..n].to_vec()).await.is_err() { break; } }
                },
            }
        }
    });
    insert_session(&sessions, cmd_tx, data_rx).await
}

// ── Byte pipe ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn rynk_send(session: String, data: Vec<u8>, sessions: State<'_, Sessions>) -> Result<(), String> {
    let cmd_tx = { sessions.lock().await.get(&session).map(|s| s.cmd_tx.clone()) };
    match cmd_tx {
        Some(tx) => {
            let (ack, rx) = oneshot::channel();
            tx.send(SessionCmd::Send(data, ack)).await.map_err(|e| e.to_string())?;
            rx.await.map_err(|_| "session task died".to_string())
        }
        None => Ok(()),
    }
}

#[tauri::command]
pub async fn rynk_recv(session: String, sessions: State<'_, Sessions>) -> Result<Vec<u8>, String> {
    let data_rx = { sessions.lock().await.get(&session).map(|s| s.data_rx.clone()) };
    match data_rx {
        Some(rx) => { let mut rx = rx.lock().await; Ok(rx.recv().await.unwrap_or_default()) }
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
pub async fn rynk_close(session: String, sessions: State<'_, Sessions>) -> Result<(), String> {
    if let Some(s) = sessions.lock().await.remove(&session) {
        let _ = s.cmd_tx.send(SessionCmd::Close).await;
    }
    Ok(())
}
