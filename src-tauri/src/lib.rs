use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use rynk_ble::BleDevice;
use rynk_serial::SerialDevice;
use serde::Serialize;
use tauri::State;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::{mpsc, Mutex, oneshot};
use uuid::Uuid;

// ── Device info ────────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct SerialDeviceInfo {
    path: String,
    name: Option<String>,
}

#[derive(Serialize)]
struct BleDeviceInfo {
    id: String,
    name: Option<String>,
}

// ── Session model ───────────────────────────────────────────────────────────────

enum SessionCmd {
    Send(Vec<u8>, oneshot::Sender<()>),
    Close,
}

struct Session {
    cmd_tx: mpsc::Sender<SessionCmd>,
    data_rx: Arc<Mutex<mpsc::Receiver<Vec<u8>>>>,
}

type Sessions = Mutex<HashMap<String, Session>>;

async fn insert_session(sessions: &State<'_, Sessions>, cmd_tx: mpsc::Sender<SessionCmd>, data_rx: mpsc::Receiver<Vec<u8>>) -> String {
    let id = Uuid::new_v4().to_string();
    sessions.lock().await.insert(id.clone(), Session { cmd_tx, data_rx: Arc::new(Mutex::new(data_rx)) });
    id
}

// ── Discovery ──────────────────────────────────────────────────────────────────

#[tauri::command]
async fn rynk_discover_serial() -> Result<Vec<SerialDeviceInfo>, String> {
    Ok(SerialDevice::discover().await.map_err(|e| e.to_string())?
        .into_iter().map(|d| SerialDeviceInfo { path: d.path, name: d.name }).collect())
}

#[tauri::command]
async fn rynk_discover_ble() -> Result<Vec<BleDeviceInfo>, String> {
    let devices = tokio::time::timeout(Duration::from_secs(5), BleDevice::discover())
        .await.map_err(|_| "BLE discover timed out".to_string())?.map_err(|e| e.to_string())?;
    Ok(devices.into_iter().map(|d| BleDeviceInfo { id: format!("{:?}", d.id()), name: d.name }).collect())
}

// ── Connect: serial ────────────────────────────────────────────────────────────

#[tauri::command]
async fn rynk_connect_serial(path: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    use tokio_serial::{ClearBuffer, SerialPort, SerialPortBuilderExt};
    let stream = tokio_serial::new(&path, 115_200).open_native_async().map_err(|e| e.to_string())?;
    let _ = stream.clear(ClearBuffer::Input);
    let (read, write) = tokio::io::split(stream);
    let id = spawn_tokio_io(sessions, read, write).await;
    Ok(id)
}

// ── Connect: TCP ───────────────────────────────────────────────────────────────

#[tauri::command]
async fn rynk_connect_tcp(addr: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    let stream = tokio::net::TcpStream::connect(&addr).await.map_err(|e| e.to_string())?;
    let (read, write) = tokio::io::split(stream);
    let id = spawn_tokio_io(sessions, read, write).await;
    Ok(id)
}

// Spawn a reader/writer task for tokio AsyncRead+AsyncWrite halves.
async fn spawn_tokio_io<R, W>(sessions: State<'_, Sessions>, read: R, write: W) -> String
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
                    Some(SessionCmd::Send(data, ack)) => {
                        let _ = writer.write_all(&data).await;
                        let _ = ack.send(());
                    }
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

// ── Connect: BLE ───────────────────────────────────────────────────────────────

#[tauri::command]
async fn rynk_connect_ble(id: String, sessions: State<'_, Sessions>) -> Result<String, String> {
    let (cmd_tx, mut cmd_rx) = mpsc::channel::<SessionCmd>(64);
    let (data_tx, data_rx) = mpsc::channel::<Vec<u8>>(64);
    let (setup_tx, setup_rx) = oneshot::channel::<Result<(), String>>();

    let id_clone = id.clone();
    std::thread::Builder::new().name("ble-session".into()).spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
        let local = tokio::task::LocalSet::new();
        local.block_on(&rt, async move {
            let setup = async {
                use rynk::RynkDevice;
                let devices = BleDevice::discover().await.map_err(|e| e.to_string())?;
                let device = devices.into_iter()
                    .find(|d| format!("{:?}", d.id()) == id_clone)
                    .ok_or("device not found")?;
                let transport = device.open().await.map_err(|e| e.to_string())?;
                Ok::<_, String>(transport)
            };
            match setup.await {
                Ok(mut transport) => {
                    let _ = setup_tx.send(Ok(()));
                    use embedded_io_async::{Read, Write};
                    let mut buf = [0u8; 4096];
                    loop {
                        tokio::select! {
                            biased;
                            cmd = cmd_rx.recv() => match cmd {
                                Some(SessionCmd::Send(data, ack)) => {
                                    let _ = transport.write_all(&data).await;
                                    let _ = ack.send(());
                                }
                                Some(SessionCmd::Close) | None => break,
                            },
                            result = transport.read(&mut buf) => match result {
                                Ok(0) | Err(_) => { let _ = data_tx.send(Vec::new()).await; break; }
                                Ok(n) => { if data_tx.send(buf[..n].to_vec()).await.is_err() { break; } }
                            },
                        }
                    }
                }
                Err(e) => { let _ = setup_tx.send(Err(e)); }
            }
        });
    }).map_err(|e| e.to_string())?;

    setup_rx.await.map_err(|_| "BLE thread died".to_string())??;
    let id = insert_session(&sessions, cmd_tx, data_rx).await;
    Ok(id)
}

// ── Byte pipe ──────────────────────────────────────────────────────────────────

#[tauri::command]
async fn rynk_send(session: String, data: Vec<u8>, sessions: State<'_, Sessions>) -> Result<(), String> {
    let cmd_tx = {
        let sessions = sessions.lock().await;
        sessions.get(&session).map(|s| s.cmd_tx.clone())
    };
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
async fn rynk_recv(session: String, sessions: State<'_, Sessions>) -> Result<Vec<u8>, String> {
    let data_rx = {
        let sessions = sessions.lock().await;
        sessions.get(&session).map(|s| s.data_rx.clone())
    };
    match data_rx {
        Some(rx) => {
            let mut rx = rx.lock().await;
            Ok(rx.recv().await.unwrap_or_default())
        }
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
async fn rynk_close(session: String, sessions: State<'_, Sessions>) -> Result<(), String> {
    if let Some(s) = sessions.lock().await.remove(&session) {
        let _ = s.cmd_tx.send(SessionCmd::Close).await;
    }
    Ok(())
}

// ── App entry ──────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(HashMap::<String, Session>::new()))
        .invoke_handler(tauri::generate_handler![
            rynk_discover_serial, rynk_discover_ble,
            rynk_connect_serial, rynk_connect_ble, rynk_connect_tcp,
            rynk_send, rynk_recv, rynk_close,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
