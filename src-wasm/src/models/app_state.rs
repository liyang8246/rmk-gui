use std::sync::{Arc, Mutex};

use super::KeyboardParams;

pub type AppState = Arc<Mutex<State>>;
pub struct State {
    pub kbd_params: KeyboardParams,
}

impl State {
    pub fn new() -> Self {
        Self {
            kbd_params: KeyboardParams::new(),
        }
    }
}
