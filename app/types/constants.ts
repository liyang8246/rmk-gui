const VIAL_SERIAL_NUMBER_MAGIC = "vial:f64c2b3c";
const VIAL_USAGE_PAGE_MAGIC = 0xff60;
const VIAL_USAGE_MAGIC = 0x61;

const MSG_LENGTH = 32;
const BUFFER_FETCH_CHUNK_SIZE = 28;
const HEADER_SIZE = 4;

enum VialCommand {
  GetSize = 0x01,
  GetDefinition = 0x02,
  SetKeycode = 0x05,
  GetMacroCount = 0x0c,
  GetMacroBuffer = 0x0e,
  GetMacroBufferSize = 0x0d,
  GetLayerCount = 0x11,
  GetKeymapBuffer = 0x12,
  VialPrefix = 0xfe,
}

export const VialConstants = {
  SERIAL_NUMBER_MAGIC: VIAL_SERIAL_NUMBER_MAGIC,
  MESSAGE_LENGTH: MSG_LENGTH,
  BUFFER_CHUNK_SIZE: BUFFER_FETCH_CHUNK_SIZE,
  HEADER_SIZE: HEADER_SIZE,
  Command: VialCommand,
  HIDFilter: {
    usagePage: VIAL_USAGE_PAGE_MAGIC,
    usage: VIAL_USAGE_MAGIC,
  },
} as const;
