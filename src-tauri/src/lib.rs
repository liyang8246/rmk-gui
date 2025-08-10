use std::sync::Arc;

use tauri::{async_runtime::Mutex, Manager, RunEvent};

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

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            list,
            connect,
            disconnect,
            product_name,
            write_read
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|ctx, event| {
        if let RunEvent::Exit = event {
            let state = ctx.state::<AppState>();
            state.blocking_lock().current_device.take();
        }
    });
}
