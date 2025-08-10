export interface KeyInfo {
  code: number
  rmk: string
  symbol: [string | null, string | null]
}

export const keyCodeMap: Record<number, KeyInfo> = {
  // replace me
}

export function keyToInfo(key: number): KeyInfo | undefined {
  if (keyCodeMap[key])
    return keyCodeMap[key]

  const baseInfo = keyCodeMap[key & 0xFF00]
  if (!baseInfo)
    return

  if (!baseInfo.symbol[0] || !baseInfo.rmk.includes('kc'))
    return baseInfo

  const subKeyInfo = keyCodeMap[key & 0x00FF]
  if (!subKeyInfo)
    return baseInfo

  return {
    ...baseInfo,
    symbol: [
      baseInfo.symbol[0],
      subKeyInfo.symbol[1],
    ],
  }
}

export function keyToLable(key: number): [string | null, string | null] {
  const info = keyToInfo(key)
  if (!info)
    return [null, null]
  return info.symbol
}

export function keyToRmk(key: number): string {
  const info = keyToInfo(key)
  if (!info)
    return 'No'
  return info.rmk
}
