//

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct VialDevice {
    pub product_string: String,
    pub path:           String,
}

impl VialDevice {
    pub fn new(product_string: String, path: String) -> Self {
        VialDevice { product_string, path }
    }
}
