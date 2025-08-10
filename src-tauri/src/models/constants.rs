pub const VIAL_SERIAL_NUMBER_MAGIC: &str = "vial:f64c2b3c";
// 也许叫这个名字？
pub const VIAL_USAGE_PAGE_MAGIC: u16 = 0xFF60;
pub const VIAL_USAGE_MAGIC: u16 = 0x61;

pub const MSG_LEN: usize = 32;
// pub const BUFFER_FETCH_CHUNK: usize = 28;

// #[repr(u8)]
// pub enum VialCommand {
//     GetSize            = 0x01,
//     GetDefinition      = 0x02,
//     SetKeycode         = 0x05,
//     GetMacroCount      = 0x0C,
//     GetMacroBuffer     = 0x0E,
//     GetMacroBufferSize = 0x0D,
//     GetLayerCount      = 0x11,
//     GetKeymapBuffer    = 0x12,
//     VialPrefix         = 0xFE,
// }

// impl Into<u8> for VialCommand {
//     fn into(self) -> u8 {
//         self as u8
//     }
// }

// The list of commands that VIA uses
// #[repr(u8)]
// pub(crate) enum ViaCommand {
//     GetProtocolVersion = 0x01, // always 0x01
//     GetKeyboardValue = 0x02,
//     SetKeyboardValue = 0x03,
//     DynamicKeymapGetKeyCode = 0x04,
//     DynamicKeymapSetKeyCode = 0x05,
//     DynamicKeymapReset = 0x06,
//     CustomSetValue = 0x07,
//     CustomGetValue = 0x08,
//     CustomSave = 0x09,
//     EepromReset = 0x0A,
//     BootloaderJump = 0x0B,
//     DynamicKeymapMacroGetCount = 0x0C,
//     DynamicKeymapMacroGetBufferSize = 0x0D,
//     DynamicKeymapMacroGetBuffer = 0x0E,
//     DynamicKeymapMacroSetBuffer = 0x0F,
//     DynamicKeymapMacroReset = 0x10,
//     DynamicKeymapGetLayerCount = 0x11,
//     DynamicKeymapGetBuffer = 0x12,
//     DynamicKeymapSetBuffer = 0x13,
//     DynamicKeymapGetEncoder = 0x14,
//     DynamicKeymapSetEncoder = 0x15,
//     Vial = 0xFE,
//     #[num_enum(default)]
//     Unhandled = 0xFF,
// }

// The list of VIAL sub-commands
// #[repr(u8)]
// enum VialCommand {
//     GetKeyboardId = 0x00,
//     GetSize = 0x01,
//     GetKeyboardDef = 0x02,
//     GetEncoder = 0x03,
//     SetEncoder = 0x04,
//     GetUnlockStatus = 0x05,
//     UnlockStart = 0x06,
//     UnlockPoll = 0x07,
//     Lock = 0x08,
//     QmkSettingsQuery = 0x09,
//     QmkSettingsGet = 0x0A,
//     QmkSettingsSet = 0x0B,
//     QmkSettingsReset = 0x0C,
//     DynamicEntryOp = 0x0D, /* operate on tapdance, combos, etc */
//     #[num_enum(default)]
//     Unhandled = 0xFF,
// }
