use serde::{Deserialize, Serialize};
use std::ffi::CString;

#[derive(Debug, Serialize, Deserialize)]
pub struct VialDevice {
    pub product_string: String,
    pub path: CString,
}

impl VialDevice {
    pub fn new(product_string: String, path: CString) -> Self {
        VialDevice { product_string, path }
    }
}
