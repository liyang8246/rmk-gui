use byteorder::{ByteOrder, LittleEndian};
use futures::StreamExt;
use liblzma::read::XzDecoder;
use serde_json::Value;
use std::io::Read;
use wasm_bindgen::prelude::*;
use web_sys::HidDevice;

use crate::models::*;

pub async fn write_read(device: &HidDevice, data: &mut [u8]) -> Result<[u8; 32], ()> {
    if data.len() > MSG_LEN {
        return Err(());
    }
    // let mut write_buffer = [0u8; MSG_LEN + 1];
    // write_buffer[1..data.len() + 1].copy_from_slice(data);
    wasm_bindgen_futures::JsFuture::from(device.send_report_with_u8_slice(0, data).unwrap())
        .await
        .expect("Failed to send report");

    let mut read_buffer = [0u8; MSG_LEN];

    for i in 0..MSG_LEN {
        read_buffer[i] = if let Some(r) = crate::cmds::READ_PIPE
            .1
            .lock()
            .expect("Failed to lock read pipe")
            .next()
            .await
        {
            r
        } else {
            panic!("Failed to read report");
        };
    }
    Ok(read_buffer)
}

pub async fn layer_count(device: &HidDevice) -> u8 {
    write_read(device, &mut [VialCommand::GetLayerCount.into()]).await.unwrap()[1]
}

pub async fn macro_count(device: &HidDevice) -> u8 {
    write_read(device, &mut [VialCommand::GetMacroCount.into()]).await.unwrap()[1]
}

pub fn key_count(payload: &Value) -> usize {
    let layout = &payload["layouts"]["keymap"];
    count_strings(&layout)
}

pub async fn get_vial_payload(device: &HidDevice) -> Value {
    //get size
    let size = write_read(device, &mut [VialCommand::VialPrefix.into(), VialCommand::GetSize.into()])
        .await
        .unwrap();
    let size = LittleEndian::read_u32(&size) as usize;
    //get payload
    let mut payload = Vec::with_capacity(size);
    for block in 0..size.div_ceil(MSG_LEN) {
        let data = write_read(
            device,
            &mut [
                VialCommand::VialPrefix.into(),
                VialCommand::GetDefinition.into(),
                (block as u8).into(),
            ],
        )
        .await
        .unwrap();
        payload.extend_from_slice(&data[0..MSG_LEN.min(size - block * MSG_LEN)]);
    }
    //decompress
    let mut decompressor = XzDecoder::new(&payload[..]);
    let mut payload = String::new();
    decompressor.read_to_string(&mut payload).unwrap();
    serde_json::from_str(&payload).unwrap()
}

pub fn count_strings(value: &Value) -> usize {
    match value {
        serde_json::Value::String(_) => 1,
        serde_json::Value::Array(arr) => arr.iter().map(count_strings).sum(),
        serde_json::Value::Object(obj) => obj.values().map(count_strings).sum(),
        _ => 0,
    }
}
