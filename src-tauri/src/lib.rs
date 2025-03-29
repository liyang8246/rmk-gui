use std::sync::Arc;

use tauri::{AppHandle, Manager, async_runtime::Mutex, generate_handler};

mod cmds;
mod models;
mod utils;

use models::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state: AppState = Arc::new(Mutex::new(State::new()));
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_window(app);
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle()
                    .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?;
            }
            Ok(())
        })
        .manage(state)
        .invoke_handler(generate_handler![
            cmds::connect_vial_device,
            cmds::get_gui_version,
            cmds::get_vial_devices,
            cmds::get_layer_count,
            cmds::get_macro_count,
            cmds::get_layout,
            cmds::get_key_count,
            cmds::update_keymap,
            cmds::get_layout_keymap,
            cmds::get_keycode_list,
            cmds::set_keycode,
        ]);
    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_window(app: &AppHandle) {
    app.webview_windows()
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}
