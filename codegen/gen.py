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
    symbol: str

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
    keys.append(Key(int(code, 16), enum, enum))

with open('template.ts', 'r') as file:
    ts_template = file.read()

key_infos = []
for key in keys:
    info = f"  0x{key.code:04X}: " + "{ code: " + f"0x{key.code:04X}, enum: " + f"'{key.enum}', symbol: " + f"'{key.symbol}'" + " },"
    key_infos.append(info)

ts_file = ts_template.replace('  // replace me', '\n'.join(key_infos))
with open('keycode.ts', 'w') as file:
    file.write(ts_file)