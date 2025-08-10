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
