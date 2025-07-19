import re
from collections import OrderedDict
from lib import Key, gen_info, ext_keys

pattern = re.compile(r"^\s*(?P<enum>\w+)\s*=\s*(?P<code>0x[0-9A-Fa-f]+),?")

keys: OrderedDict[int, Key] = OrderedDict()
with open("codegen/keycode.rs", "r") as file:
    keycodes = file.read()
for line in keycodes.split("\n"):
    line = line.strip()
    if line.startswith("///") or not line:
        continue

    match = pattern.search(line)
    if not match:
        continue

    enum = match.group("enum")
    code = match.group("code")
    key_code = int(code, 16)
    keys[key_code] = Key(key_code, enum, [None, enum])

for key in ext_keys:
    keys[key.code] = key

with open("codegen/template.ts", "r") as file:
    ts_template = file.read()

key_infos = []
for key in keys.values():
    key_infos.append(gen_info(key))

ts_file = ts_template.replace("  // replace me", "\n".join(key_infos))
with open("app/types/keycode.ts", "w") as file:
    file.write(ts_file)
