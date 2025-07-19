from dataclasses import dataclass


@dataclass
class Key:
    code: int
    enum: str
    symbol: tuple[str | None, str | None]


def gen_info(key: Key) -> str:
    t = "  0x0000: { code: 0x0000, enum: 'enum_', symbol: [symbol_1, symbol_2] },"
    t = t.replace("0x0000", f"0x{key.code:04X}")
    t = t.replace("enum_", key.enum)
    t = t.replace("symbol_1", f"'{key.symbol[0]}'" if key.symbol[0] else "null")
    t = t.replace("symbol_2", f"'{key.symbol[1]}'" if key.symbol[1] else "null")
    return t


ext_keys = [Key(code=0x0001, enum="_", symbol=(None, "Trns"))]


class Actions:
    LT = 0x4000
    MO = 0x5220
    DF = 0x5240
    TG = 0x5260
    TT = 0x52C0
    TO = 0x5200
    OSL = 0x5280
    PDF = 0x52E0


ext_keys.extend(
    Key(
        code=Actions.LT + x,
        enum=f"LT({x}, kc)",
        symbol=(f"LT-{x}", None),
    )
    for x in range(16)
)
ext_keys.extend(
    Key(code=Actions.MO + x, enum=f"MO({x})", symbol=(None, f"MO-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.DF + x, enum=f"DF({x})", symbol=(None, f"DF-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.TG + x, enum=f"TG({x})", symbol=(None, f"TG-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.TT + x, enum=f"TT({x})", symbol=(None, f"TT-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.TO + x, enum=f"TO({x})", symbol=(None, f"TO-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.OSL + x, enum=f"OSL({x})", symbol=(None, f"OSL-{x}"))
    for x in range(32)
)
ext_keys.extend(
    Key(code=Actions.PDF + x, enum=f"PDF({x})", symbol=(None, f"PDF-{x}"))
    for x in range(32)
)


class Modifiers:
    LCtrl = 0x2100
    LShift = 0x2200
    LAlt = 0x2400
    LGui = 0x2800
    RCtrl = 0x3100
    RShift = 0x3200
    RAlt = 0x3400
    RGui = 0x3800


ext_keys.append(Key(code=Modifiers.LCtrl, enum="MT(LCtrl, kc)", symbol=("LCtrl", None)))
ext_keys.append(Key(code=Modifiers.RCtrl, enum="MT(RCtrl, kc)", symbol=("RCtrl", None)))

ext_keys.append(
    Key(code=Modifiers.LShift, enum="MT(LShift, kc)", symbol=("LShift", None))
)
ext_keys.append(
    Key(code=Modifiers.RShift, enum="MT(RShift, kc)", symbol=("RShift", None))
)

ext_keys.append(Key(code=Modifiers.LAlt, enum="MT(LAlt, kc)", symbol=("LAlt", None)))
ext_keys.append(Key(code=Modifiers.RAlt, enum="MT(RAlt, kc)", symbol=("RAlt", None)))

ext_keys.append(Key(code=Modifiers.LGui, enum="MT(LGui, kc)", symbol=("LGui", None)))
ext_keys.append(Key(code=Modifiers.RGui, enum="MT(RGui, kc)", symbol=("RGui", None)))


if __name__ == "__main__":
    [print(i) for i in ext_keys]
