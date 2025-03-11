use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"

export function invoke<T>(_command: string, _args?: any): Promise<T>;

"#;

pub mod commands;
pub mod models;

use models::AppState;
use std::sync::{Arc, Mutex};

#[wasm_bindgen(skip_typescript)]
pub async fn invoke(command: String, _args: JsValue) -> Result<JsValue, JsValue> {
    web_sys::console::log_1(&JsValue::from_str(format!("Invoking command: {:#?}", command).as_str()));
    console_error_panic_hook::set_once();
    let promise = match command.as_str() {
        "get_vial_devices" => {
            let ret = commands::get_vial_devices().await.expect("Failed to get Vial devices");
            Ok(js_sys::Promise::resolve(&serde_wasm_bindgen::to_value(&ret).unwrap()))
        }
        "get_gui_version" => {
            let version = commands::get_gui_version();
            Ok(js_sys::Promise::resolve(&serde_wasm_bindgen::to_value(&version).unwrap()))
        }
        _ => Err(JsValue::from_str("Unknown command")),
    }?;
    let result = wasm_bindgen_futures::JsFuture::from(promise).await?;
    Ok(result)
}
