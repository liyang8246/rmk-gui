export enum MacroCode {
  /// 特殊动作前缀，所有控制序列必须以该字节开头
  Prefix = 1,
  /// 单字节按键点击 (SS_TAP_CODE)
  Tap = 0,
  /// 单字节按键按下 (SS_DOWN_CODE)
  Down = 2,
  /// 单字节按键释放 (SS_UP_CODE)
  Up = 3,
  /// 延迟控制码 (SS_DELAY_CODE)
  Delay = 4,
  /// 双字节扩展点击 (VIAL_MACRO_EXT_TAP)
  ExtTap = 5,
  /// 双字节扩展按下 (VIAL_MACRO_EXT_DOWN)
  ExtDown = 6,
  /// 双字节扩展释放 (VIAL_MACRO_EXT_UP)
  ExtUp = 7,
  /// 文本输入 (VIAL_MACRO_TEXT)
  Text = 9,
}

export interface MacroAction {
  type: MacroCode
  name: string
  keyCodes?: [string | null, string | null][]
  delay?: number | null
  text?: string | null
}

export function fromU8(value: number): MacroCode {
  switch (value) {
    case 0:
      return MacroCode.Tap
    case 1:
      return MacroCode.Prefix
    case 2:
      return MacroCode.Down
    case 3:
      return MacroCode.Up
    case 4:
      return MacroCode.Delay
    // case 6:
    //   return MacroCode.ExtTap
    // case 7:
    //   return MacroCode.ExtDown
    // case 8:
    //   return MacroCode.ExtUp
    default:
      return MacroCode.Text
  }
}
export function fromMacroCode(value: MacroCode): MacroAction {
  switch (value) {
    case MacroCode.Tap:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Prefix:
      return { type: MacroCode.Tap, name: MacroCode[MacroCode.Tap], keyCodes: [] }
    case MacroCode.Down:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Up:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Delay:
      return { type: value, name: MacroCode[value], delay: null }
    case MacroCode.ExtTap:
      return { type: MacroCode.Tap, name: MacroCode[MacroCode.Tap], keyCodes: [] }
    case MacroCode.ExtDown:
      return { type: MacroCode.Down, name: MacroCode[MacroCode.Down], keyCodes: [] }
    case MacroCode.ExtUp:
      return { type: MacroCode.Up, name: MacroCode[MacroCode.Up], keyCodes: [] }
    case MacroCode.Text:
      return { type: value, name: MacroCode[value], text: null }
    default:
      throw new Error(`not support ${value}`)
  }
}
