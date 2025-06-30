use std::sync::Arc;

use tauri::async_runtime::Mutex;

use crate::{
    cmds::*,
    models::{AppState, State},
};

mod cmds;
mod models;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state: AppState = Arc::new(Mutex::new(State::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            list,
            connect,
            product_name,
            write_read
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
