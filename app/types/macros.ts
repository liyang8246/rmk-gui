import type { KeyInfo } from '~~/codegen/template'

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
  // /// 双字节扩展点击 (VIAL_MACRO_EXT_TAP)
  // ExtTap = 6,
  // /// 双字节扩展按下 (VIAL_MACRO_EXT_DOWN)
  // ExtDown = 7,
  // /// 双字节扩展释放 (VIAL_MACRO_EXT_UP)
  // ExtUp = 8,
  /// 文本输入 (VIAL_MACRO_TEXT)
  Text = 9,
}

export interface MacroAction {
  type: MacroCode
  name: string
  keyCodes?: KeyInfo[]
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
    case MacroCode.Prefix:
      return { type: MacroCode.Tap, name: MacroCode[MacroCode.Tap], keyCodes: [] }
    case MacroCode.Tap:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Down:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Up:
      return { type: value, name: MacroCode[value], keyCodes: [] }
    case MacroCode.Delay:
      return { type: value, name: MacroCode[value], delay: null }
    case MacroCode.Text:
      return { type: value, name: MacroCode[value], text: null }
    default:
      throw new Error('not support')
  }
}
export function readU16(data: Uint8Array<ArrayBufferLike>, offset: number): number {
  return (data[offset]! << 8) | data[offset + 1]!
}
export function splitArray(arr: number[], predicate: (value: number) => boolean): number[][] {
  const result: number[][] = []
  let current: number[] = []

  for (const item of arr) {
    if (predicate(item)) {
      if (current.length > 0) {
        result.push(current)
        current = []
      }
    }
    else {
      current.push(item)
    }
  }

  if (current.length > 0) {
    result.push(current)
  }

  return result
}
export function keyCodeFromBytes(bytes: number[]): KeyInfo {
  const value = bytes[1]
  if (value && keyCodeMap[value]) {
    return keyCodeMap[value]
  }
  return keyCodeMap[0]!
}
export function macroDeserializeV2(rawMacros: number[][], count: number): Array<Array<MacroAction>> {
  const macrosActions: Array<Array<MacroAction>> = []
  rawMacros.forEach((rawMacro, idx) => {
    const macroActions: Array<MacroAction> = []
    let action: MacroAction | null = null

    let prevCode: number | null = null

    while (rawMacro.length > 0) {
      let code = rawMacro[0]
      let macroCode = code as MacroCode

      // 处理前缀类型的动作
      if (macroCode === MacroCode.Prefix) {
        rawMacro.shift()

        if (rawMacro.length === 0) {
          throw new Error(`Macro format error: insufficient data after prefix, index: ${idx}`)
        }

        code = rawMacro.shift() as number
        macroCode = code as MacroCode

        const newAction = fromMacroCode(macroCode)

        if (action && code !== prevCode) {
          prevCode = code
          if (action) {
            macroActions.push(action)
          }
          action = newAction
        }
        if (!action) {
          action = fromMacroCode(macroCode)
        }
        if (!prevCode) {
          prevCode = code
        }

        if (action && (action.type === MacroCode.Down || action.type === MacroCode.Up || action.type === MacroCode.Tap)) {
          if (rawMacro.length === 0) {
            throw new Error(`Macro format error: missing keycode, index: ${idx}`)
          }

          const keyCodeData = [0, rawMacro.shift() as number]
          const key = keyCodeFromBytes(keyCodeData)

          if (action.type === MacroCode.Down && 'keyCodes' in action) {
            (action as { keyCodes: KeyInfo[] }).keyCodes.push(key)
          }
          else if (action.type === MacroCode.Up && 'keyCodes' in action) {
            (action as { keyCodes: KeyInfo[] }).keyCodes.push(key)
          }
          else if (action.type === MacroCode.Tap && 'keyCodes' in action) {
            (action as { keyCodes: KeyInfo[] }).keyCodes.push(key)
          }
        }
        else if (action && action.type === MacroCode.Delay) {
          if (rawMacro.length < 2) {
            throw new Error(`Macro format error: incomplete delay data, index: ${idx}`)
          }

          // 处理延迟动作
          const delay1 = rawMacro.shift() as number
          const delay2 = rawMacro.shift() as number
          const delay = (delay1 - 1) + (delay2 - 1) * 255;
          (action as { delay: number | null }).delay = delay
        }
      }
      else {
        // 处理文本动作
        if (!action) {
          action = { type: MacroCode.Text, name: MacroCode[MacroCode.Text], text: '' }
        }

        if (action && action.type !== MacroCode.Text) {
          if (action) {
            macroActions.push(action)
          }
          action = { type: MacroCode.Text, name: MacroCode[MacroCode.Text], text: '' }
        }

        if (action && action.type === MacroCode.Text) {
          action.text += String.fromCharCode(rawMacro.shift() as number)
        }
      }
    }

    if (action) {
      macroActions.push(action)
    }

    macrosActions.push(macroActions)
  })
  while (macrosActions.length < count) {
    macrosActions.push([])
  }

  return macrosActions
}
