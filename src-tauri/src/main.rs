// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod transport;

use std::collections::HashMap;

use tauri::Builder;
use tokio::sync::Mutex;
use transport::{Session, ble, serial, tcp};

fn main() {
    Builder::default()
        .manage(Mutex::new(HashMap::<String, Session>::new()))
        .invoke_handler(tauri::generate_handler![
            serial::rynk_discover_serial, ble::rynk_discover_ble, tcp::rynk_discover_tcp,
            serial::rynk_connect_serial, ble::rynk_connect_ble, tcp::rynk_connect_tcp,
            transport::rynk_send, transport::rynk_recv, transport::rynk_close,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
