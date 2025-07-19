# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

from dataclasses import dataclass
import re

@dataclass
class Key:
    code: int
    enum: str
    symbol: tuple[str | None, str | None]

def gen_info(key: Key) -> str:
    t = "  0x0000: { code: 0x0000, enum: 'enum_', symbol: ['symbol_1', 'symbol_2'] },"
    t = t.replace("0x0000", f"0x{key.code:04X}")
    t = t.replace("enum_", key.enum)
    t = t.replace("symbol_1", key.symbol[0] if key.symbol[0] else "null")
    t = t.replace("symbol_2", key.symbol[1] if key.symbol[1] else "null")
    return t

pattern = re.compile(r'^\s*(?P<enum>\w+)\s*=\s*(?P<code>0x[0-9A-Fa-f]+),?')

keys: list[Key] = []
with open('keycode.rs', 'r') as file:
    keycodes = file.read()
for line in keycodes.split('\n'):
    line = line.strip()
    if line.startswith('///') or not line:
        continue

    match = pattern.search(line)
    if not match:
        continue

    enum = match.group('enum')
    code = match.group('code')
    keys.append(Key(int(code, 16), enum, [None, enum]))

with open('template.ts', 'r') as file:
    ts_template = file.read()

key_infos = []
for key in keys:
    key_infos.append(gen_info(key))

ts_file = ts_template.replace('  // replace me', '\n'.join(key_infos))
with open('keycode.ts', 'w') as file:
    file.write(ts_file)