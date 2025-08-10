SPECIAL_SYMBOL = {
    "LeftBracket": "[ {",
    "RightBracket": "] }",
    "Backslash": "\\\\ |",  # 转义反斜杠
    "Semicolon": "; :",
    "Quote": "\\' \"",
    "Grave": "~ `",
    "Comma": ", <",
    "Dot": ". >",
    "Slash": "/ ?",
    "KpSlash": "/",
    "KpAsterisk": "*",
    "KpMinus": "-",
    "KpPlus": "+",
    "KpEnter": "Enter",
    "Kp1": "1",
    "Kp2": "2",
    "Kp3": "3",
    "Kp4": "4",
    "Kp5": "5",
    "Kp6": "6",
    "Kp7": "7",
    "Kp8": "8",
    "Kp9": "9",
    "Kp0": "0",
    "KpDot": ".",
    "KpEqual": "=",
    "KpComma": ",",
}


def special_symbol(symbol: tuple[str | None, str | None]) -> tuple[str | None, str | None]:
    if symbol[1] in SPECIAL_SYMBOL:
        return symbol[0], SPECIAL_SYMBOL[symbol[1]]
    return symbol