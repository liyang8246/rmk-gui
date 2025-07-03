use hidapi::{DeviceInfo, HidDevice};

use crate::models::{MSG_LEN, VIAL_SERIAL_NUMBER_MAGIC, VIAL_USAGE_MAGIC, VIAL_USAGE_PAGE_MAGIC};

pub fn is_rawhid(device_info: &DeviceInfo) -> bool {
    device_info.usage_page() == VIAL_USAGE_PAGE_MAGIC && device_info.usage() == VIAL_USAGE_MAGIC
}

pub fn is_vial_device(device_info: &DeviceInfo) -> bool {
    let serial_number = device_info.serial_number().unwrap_or("");
    serial_number.contains(VIAL_SERIAL_NUMBER_MAGIC) && is_rawhid(device_info) || device_info.usage_page() == 0xFF60
}

pub fn hid_write_read(device: &HidDevice, data: &[u8]) -> Result<[u8; 32], String> {
    if data.len() > MSG_LEN {
        return Err("Operation not supported: data length exceeds limit".to_string());
    }

    let mut write_buffer = [0u8; MSG_LEN + 1];
    write_buffer[1..data.len() + 1].copy_from_slice(data);

    device
        .write(&write_buffer)
        .map_err(|e| format!("Device write failed: {}", e))?;

    let mut read_buffer = [0u8; MSG_LEN];

    device
        .read(&mut read_buffer)
        .map_err(|e| format!("Device read failed: {}", e))?;

    Ok(read_buffer)
}
