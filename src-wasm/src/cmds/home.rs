use crate::models::{AppState, VIAL_USAGE_MAGIC, VIAL_USAGE_PAGE_MAGIC, VialDevice};
use wasm_bindgen::prelude::*;
use web_sys::{HidDevice, HidInputReportEvent};

use crate::models::*;
use crate::utils::*;
use lazy_static::lazy_static;
use std::sync::Mutex;

lazy_static! {
    pub static ref READ_PIPE: (
        futures::channel::mpsc::UnboundedSender<u8>,
        Mutex<futures::channel::mpsc::UnboundedReceiver<u8>>
    ) = {
        let (a, b) = futures::channel::mpsc::unbounded();
        (a, Mutex::new(b))
    };
}

pub async fn current_device() -> HidDevice {
    js_sys::Reflect::get(&web_sys::window().unwrap(), &"connectedDevice".into())
        .unwrap()
        .into()
}

pub fn read_callback(e: HidInputReportEvent) {
    let data = e.data();
    let mut buf = [0u8; MSG_LEN];
    for (i, byte) in buf.iter_mut().enumerate() {
        *byte = data.get_uint8(i);
    }
    for i in 0..MSG_LEN {
        READ_PIPE.0.unbounded_send(buf[i]).unwrap();
    }
}

#[derive(serde::Serialize)]
struct HidFilter {
    #[serde(rename = "usagePage")]
    usage_page: Option<u16>,
    usage: Option<u16>,
}

// WebHID select the device by the browser due to the security reasons, so extra switch is unnecessary
pub async fn get_vial_devices(state: &AppState) -> Result<JsValue, JsValue> {
    let win = web_sys::window().expect("Failed to get window");
    let hid = win.navigator().hid();
    let devices = wasm_bindgen_futures::JsFuture::from(
        hid.request_device(&web_sys::HidDeviceRequestOptions::new(
            &serde_wasm_bindgen::to_value(&[HidFilter {
                usage_page: Some(VIAL_USAGE_PAGE_MAGIC),
                usage: Some(VIAL_USAGE_MAGIC),
            }])
            .unwrap(),
        )),
    )
    .await
    .unwrap();
    let devices = devices.dyn_ref::<js_sys::Array>().expect("Failed to get devices");
    let mut ret = Vec::<VialDevice>::new();

    web_sys::console::log_1(&JsValue::from("Required devices"));

    if devices.length() == 0 {
        return Err(JsValue::from("No devices found"));
    }

    let dev: HidDevice = devices.get(0).dyn_into().expect("Not a HidDevice?");
    ret.push(VialDevice {
        product_string: dev.product_name(),
        path: "Placeholder".to_string(),
    });

    let mut state = state.lock().expect("Failed to get state");
    wasm_bindgen_futures::JsFuture::from(dev.open())
        .await
        .expect("Failed to open device");
    let cb = Closure::<dyn FnMut(HidInputReportEvent)>::new(|e| read_callback(e));
    dev.set_oninputreport(Some(cb.as_ref().unchecked_ref()));
    cb.forget();

    js_sys::Reflect::set(&win, &"connectedDevice".into(), &dev).expect("Failed to set connectedDevice");

    web_sys::console::log_1(&JsValue::from("Opened devices"));

    state.kbd_params.layers = layer_count(&dev).await;
    state.kbd_params.macros = macro_count(&dev).await;
    state.kbd_params.payload = get_vial_payload(&dev).await;
    state.kbd_params.rows = state.kbd_params.payload["matrix"]["rows"].as_u64().unwrap() as u8;
    state.kbd_params.cols = state.kbd_params.payload["matrix"]["cols"].as_u64().unwrap() as u8;
    state.kbd_params.keys = key_count(&state.kbd_params.payload);

    web_sys::console::log_1(&JsValue::from("Initialized state"));

    Ok(serde_wasm_bindgen::to_value(&ret).expect("Failed to serialize"))
}

pub fn get_gui_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub async fn get_layer_count(state: &AppState) -> Result<JsValue, JsValue> {
    let state = state.lock().expect("Failed to get lock");
    Ok(state.kbd_params.layers.into())
}

pub async fn get_macro_count(state: &AppState) -> Result<JsValue, JsValue> {
    let state = state.lock().expect("Failed to get lock");
    Ok(state.kbd_params.macros.into())
}

pub async fn get_key_count(state: &AppState) -> Result<JsValue, JsValue> {
    let state = state.lock().expect("Failed to get lock");
    Ok(state.kbd_params.keys.into())
}
