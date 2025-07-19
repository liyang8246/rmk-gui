interface KeyInfo {
  code: number
  enum: string
  symbol: string
}

const keyCodeMap: Record<number, KeyInfo> = {
  // replace me
}

export function keyToInfo(key: number): KeyInfo | undefined {
  return keyCodeMap[key]
}
