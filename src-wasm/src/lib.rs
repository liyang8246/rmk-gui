use lazy_static::lazy_static;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"

export function invoke<T>(_command: string, _args?: any): T;

"#;

pub mod cmds;
pub mod models;
pub mod utils;

use models::AppState;
use std::sync::{Arc, Mutex};

lazy_static! {
    static ref APP_STATE: AppState = Arc::new(Mutex::new(models::State::new()));
}

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(skip_typescript)]
pub async fn invoke(command: String, args: JsValue) -> Result<JsValue, JsValue> {
    web_sys::console::log_1(&JsValue::from_str(format!("Invoking command: {:#?}", command).as_str()));
    match command.as_str() {
        "get_vial_devices" => {
            let fut = cmds::get_vial_devices(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "get_gui_version" => {
            let version = cmds::get_gui_version();
            Ok(JsValue::from_str(&version))
        }
        "get_key_count" => {
            let fut = cmds::get_key_count(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "get_layer_count" => {
            let fut = cmds::get_layer_count(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "get_macro_count" => {
            let fut = cmds::get_macro_count(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "connect_vial_device" => Ok(js_sys::Promise::resolve(&JsValue::from_str("Connected")).into()),
        "update_keymap" => {
            let fut = cmds::update_keymap(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "get_layout_keymap" => {
            let fut = cmds::get_layout_keymap(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "get_keycode_list" => {
            let fut = cmds::get_keycode_list(&APP_STATE);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        "set_keycode" => {
            let fut = cmds::set_keycode(&APP_STATE, args);
            Ok(wasm_bindgen_futures::future_to_promise(fut).into())
        }
        _ => Err(JsValue::from_str(&format!("Unknown command: {}", command))),
    }
}
