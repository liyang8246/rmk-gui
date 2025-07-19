interface KeyInfo {
  code: number
  rmk: string
  symbol: [string | null, string | null]
}

const keyCodeMap: Record<number, KeyInfo> = {
  // replace me
}

export function keyToInfo(key: number): KeyInfo | undefined {
  let info = keyCodeMap[key]
  if (info)
    return info

  info = keyCodeMap[key & 0xFF00]
  if (!info)
    return
  if (!info.symbol[0])
    return info

  if (info.rmk.includes('kc')) {
    const k1 = keyCodeMap[key & 0x00FF]
    if (!k1)
      return info

    info.symbol[1] = k1.symbol[1]
  }
  return info
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
