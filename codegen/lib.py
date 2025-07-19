from dataclasses import dataclass


@dataclass
class Key:
    code: int
    rmk: str
    symbol: tuple[str | None, str | None]


def gen_info(key: Key) -> str:
    t = "  0x0000: { code: 0x0000, rmk: 'rmk_', symbol: [symbol_1, symbol_2] },"
    t = t.replace("0x0000", f"0x{key.code:04X}")
    t = t.replace("rmk_", key.rmk)
    t = t.replace("symbol_1", f"'{key.symbol[0]}'" if key.symbol[0] else "null")
    t = t.replace("symbol_2", f"'{key.symbol[1]}'" if key.symbol[1] else "null")
    return t


ext_keys = [Key(code=0x0001, rmk="_", symbol=(None, "Trns"))]


class Prefix:
    LT = 0x4000
    MO = 0x5220
    DF = 0x5240
    TG = 0x5260
    TT = 0x52C0
    TO = 0x5200
    OSL = 0x5280
    PDF = 0x52E0
    LCtrl = 0x2100
    LShift = 0x2200
    LAlt = 0x2400
    LGui = 0x2800
    RCtrl = 0x3100
    RShift = 0x3200
    RAlt = 0x3400
    RGui = 0x3800
    Macro = 0x7700
    TapDance = 0x5700


# layer operations
ext_keys.extend(Key(code=Prefix.LT + (x << 8), rmk=f"LT({x}, kc)", symbol=(f"LT-{x}", None)) for x in range(16))
ext_keys.extend(Key(code=Prefix.MO + x, rmk=f"MO({x})", symbol=(None, f"MO-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.DF + x, rmk=f"DF({x})", symbol=(None, f"DF-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.TG + x, rmk=f"TG({x})", symbol=(None, f"TG-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.TT + x, rmk=f"TT({x})", symbol=(None, f"TT-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.TO + x, rmk=f"TO({x})", symbol=(None, f"TO-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.OSL + x, rmk=f"OSL({x})", symbol=(None, f"OSL-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.PDF + x, rmk=f"PDF({x})", symbol=(None, f"PDF-{x}")) for x in range(32))
# modifiers
ext_keys.append(Key(code=Prefix.LCtrl, rmk="MT(LCtrl, kc)", symbol=("LCtrl", None)))
ext_keys.append(Key(code=Prefix.RCtrl, rmk="MT(RCtrl, kc)", symbol=("RCtrl", None)))
ext_keys.append(Key(code=Prefix.LShift, rmk="MT(LShift, kc)", symbol=("LShift", None)))
ext_keys.append(Key(code=Prefix.RShift, rmk="MT(RShift, kc)", symbol=("RShift", None)))
ext_keys.append(Key(code=Prefix.LAlt, rmk="MT(LAlt, kc)", symbol=("LAlt", None)))
ext_keys.append(Key(code=Prefix.RAlt, rmk="MT(RAlt, kc)", symbol=("RAlt", None)))
ext_keys.append(Key(code=Prefix.LGui, rmk="MT(LGui, kc)", symbol=("LGui", None)))
ext_keys.append(Key(code=Prefix.RGui, rmk="MT(RGui, kc)", symbol=("RGui", None)))
# Macro & TapDance
ext_keys.extend(Key(code=Prefix.Macro + x, rmk=f"Macro{x}", symbol=(None, f"Macro-{x}")) for x in range(32))
ext_keys.extend(Key(code=Prefix.TapDance + x, rmk=f"TapDance{x}", symbol=(None, f"TapDance-{x}")) for x in range(32))

if __name__ == "__main__":
    [print(i) for i in ext_keys]
