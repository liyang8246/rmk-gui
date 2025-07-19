interface KeyInfo {
  code: number
  enum: string
  symbol: [string | null, string | null]
}

const keyCodeMap: Record<number, KeyInfo> = {
  // replace me
}

export function keyToInfo(key: number): KeyInfo | undefined {
  let info = keyCodeMap[key]
  if (info) return info
  info = keyCodeMap[key & 0xFF00]
  if (!info) return
  if (!info.symbol[0]) return info
  if (info.symbol[0].includes('kc')) {
    const k1 = keyCodeMap[key & 0x00FF]
    if (!k1) return info
    info.symbol[1] = k1.symbol[1]
  }
  return info
}
