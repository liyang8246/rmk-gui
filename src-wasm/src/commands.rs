use crate::models::{AppState, VIAL_USAGE_MAGIC, VIAL_USAGE_PAGE_MAGIC, VialDevice};
use wasm_bindgen::{JsCast, JsValue};
use web_sys::{Hid, HidDevice, HidDeviceFilter};

#[derive(serde::Serialize)]
struct HidFilter {
    usage_page: Option<u16>,
    usage:      Option<u16>,
}

pub async fn get_vial_devices() -> Result<Vec<VialDevice>, ()> {
    let win = web_sys::window().expect("Failed to get window");
    let hid = win.navigator().hid();
    let devices = wasm_bindgen_futures::JsFuture::from(
        hid.request_device(&web_sys::HidDeviceRequestOptions::new(
            &serde_wasm_bindgen::to_value(&[HidFilter {
                usage_page: Some(VIAL_USAGE_PAGE_MAGIC),
                usage:      Some(VIAL_USAGE_MAGIC),
            }])
            .unwrap(),
        )),
    )
    .await
    .unwrap();
    let devices = devices.dyn_ref::<js_sys::Array>().expect("Failed to get devices");
    let mut ret = Vec::<VialDevice>::new();
    for d in devices.iter() {
        let dev = d.dyn_ref::<HidDevice>().expect("Not a HidDevice?");
        ret.push(VialDevice {
            product_string: dev.product_name(),
            path:           "".to_string(),
        });
    }

    Ok(ret)
}

pub fn get_gui_version() -> String {
    let version = env!("CARGO_PKG_VERSION");
    version.to_string()
}
/*
pub async fn connect_vial_device(state: tauri::State<'_, AppState>, path: CString) -> Result<(), ()> {}


pub async fn get_layer_count(state: tauri::State<'_, AppState>) -> Result<u8, ()> {}

pub async fn get_macro_count(state: tauri::State<'_, AppState>) -> Result<u8, ()> {}

pub async fn get_key_count(state: tauri::State<'_, AppState>) -> Result<usize, ()> {}

pub async fn get_layout(state: tauri::State<'_, AppState>) -> Result<Value, ()> {}

pub async fn update_keymap(state: tauri::State<'_, AppState>) -> Result<(), ()> {}

pub async fn get_layout_keymap(state: tauri::State<'_, AppState>) -> Result<Vec<Key>, ()> {}

pub async fn get_keycode_list(_state: tauri::State<'_, AppState>) -> Result<Vec<Key>, ()> {}

pub async fn set_keycode(state: tauri::State<'_, AppState>, lyr_row_col: (u8, u8, u8), keycode: u16) -> Result<(), ()> {}

*/
