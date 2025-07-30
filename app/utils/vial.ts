export class VialDevice implements VialInterface {
  constructor(private device: HIDInterface) {}

  private readUint32LE(buffer: Uint8Array): number {
    if (buffer.length < 4) {
      throw new Error('Buffer must have at least 4 bytes')
    }
    return (buffer[0]! | (buffer[1]! << 8) | (buffer[2]! << 16) | (buffer[3]! << 24)) >>> 0
  }

  private async decompressToString(compressedData: number[]): Promise<string> {
    const compressedBytes = new Uint8Array(compressedData)
    const compressedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedBytes)
        controller.close()
      },
    })
    const decompressedStream = new XzReadableStream(compressedStream)
    const response = new Response(decompressedStream)
    return await response.text()
  }

  private async readChunk(cmd: number, size: number): Promise<number[]> {
    const chunk: number[] = []
    const blockNum = Math.ceil(size / VialConstants.BUFFER_CHUNK_SIZE)
    for (let block = 0; block < blockNum; block++) {
      const data = await this.device.writeRead([VialConstants.Command.VialPrefix, cmd, block])
      chunk.push(...data)
    }
    return chunk.slice(0, size)
  }

  private async readOffset(cmd: number, size: number, offset: number): Promise<number[]> {
    const chunk: number[] = []

    for (let x = 0; x < size; x += VialConstants.BUFFER_CHUNK_SIZE) {
      const currentReadOffset = offset + x
      const sz = Math.min(size - x, VialConstants.BUFFER_CHUNK_SIZE)

      const data = await this.device.writeRead([cmd, (currentReadOffset >> 8) & 0xFF, currentReadOffset & 0xFF, sz])
      chunk.push(...data.slice(VialConstants.HEADER_SIZE, VialConstants.HEADER_SIZE + sz))
    }
    return chunk.slice(0, size)
  }

  private readU16(data: Uint8Array<ArrayBufferLike>, offset: number): number {
    return (data[offset]! << 8) | data[offset + 1]!
  }

  private splitArray(arr: number[], predicate: (value: number) => boolean): number[][] {
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

  private keyCodeFromBytes(bytes: number[]): [string | null, string | null] {
    const value = bytes[1]
    if (value && keyCodeMap[value]) {
      return keyCodeMap[value].symbol
    }
    return keyCodeMap[0]!.symbol
  }

  private macroDeserializeV2(rawMacros: number[][], count: number): Array<Array<MacroAction>> {
    const macrosActions: Array<Array<MacroAction>> = []
    rawMacros.forEach((rawMacro, idx) => {
      const macroActions: Array<MacroAction> = []
      let action: MacroAction | null = null

      let prevCode: MacroCode | null = null

      while (rawMacro.length > 0) {
        let code = rawMacro[0]
        let macroCode = code as MacroCode

        if (macroCode === MacroCode.Prefix) {
          rawMacro.shift()

          if (rawMacro.length === 0) {
            throw new Error(`Macro format error: insufficient data after prefix, index: ${idx}`)
          }

          code = rawMacro.shift() as number
          macroCode = code as MacroCode

          const newAction = fromMacroCode(macroCode)

          if (action && prevCode != null && fromMacroCode(macroCode).type !== fromMacroCode(prevCode).type) {
            prevCode = macroCode
            if (action) {
              macroActions.push(action)
            }
            action = newAction
          }
          if (!action) {
            action = fromMacroCode(macroCode)
          }
          if (!prevCode) {
            prevCode = macroCode
          }
          if (action && (macroCode === MacroCode.Tap || macroCode === MacroCode.Prefix || macroCode === MacroCode.Down || macroCode === MacroCode.Up)) {
            if (rawMacro.length === 0) {
              throw new Error(`Macro format error: missing keycode, index: ${idx}`)
            }
            const keyCodeData = [0, rawMacro.shift() as number]
            const key: [string | null, string | null] = this.keyCodeFromBytes(keyCodeData)

            if ('keyCodes' in action) {
              (action as { keyCodes: [string | null, string | null][] }).keyCodes.push(key)
            }
          }
          else if (action && (macroCode === MacroCode.ExtTap || macroCode === MacroCode.ExtDown || macroCode === MacroCode.ExtUp)) {
            if (rawMacro.length < 2) {
              throw new Error(`Macro format error: missing Ext keycode, index: ${idx}`)
            }
            let key: [string | null, string | null]
            const keyCodeData1 = [0, rawMacro.shift() as number]
            const keyCodeData2 = [0, rawMacro.shift() as number]
            if (keyCodeData2[1] === 255) {
              keyCodeData1[1] = keyCodeData1[1]! * 16 ** 2
              key = this.keyCodeFromBytes(keyCodeData1)
            }
            else {
              keyCodeData2[1] = keyCodeData2[1]! * 16 ** 2
              key = [this.keyCodeFromBytes(keyCodeData2)[0], this.keyCodeFromBytes(keyCodeData1)[1]]
            }
            if ('keyCodes' in action) {
              (action as { keyCodes: [string | null, string | null][] }).keyCodes.push(key)
            }
          }
          else if (action && macroCode === MacroCode.Delay) {
            if (rawMacro.length < 2) {
              throw new Error(`Macro format error: incomplete delay data, index: ${idx}`)
            }

            const delay1 = rawMacro.shift() as number
            const delay2 = rawMacro.shift() as number
            const delay = (delay1 - 1) + (delay2 - 1) * 255;
            (action as { delay: number | null }).delay = delay
          }
        }
        else {
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

  async productName(): Promise<string> {
    return await this.device.productName()
  }

  async layerCount(): Promise<number> {
    const data = await this.device.writeRead([VialConstants.Command.GetLayerCount])
    return data[1]!
  }

  async marcoCount(): Promise<number> {
    const data = await this.device.writeRead([VialConstants.Command.GetMacroCount])
    return data[1]!
  }

  async keymap(layerCount: number, rowCount: number, colCount: number): Promise<Map<string, number>> {
    const size = layerCount * rowCount * colCount * 2
    const rawData = await this.readOffset(VialConstants.Command.GetKeymapBuffer, size, 0)

    const keymapResult = new Map<string, number>()

    for (let layer = 0; layer < layerCount; layer++) {
      for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
          const offset = (layer * rowCount * colCount + row * colCount + col) * 2
          if (offset + 1 < rawData.length) {
            const keycode = 256 * rawData[offset]! + rawData[offset + 1]!
            keymapResult.set([layer, row, col].toString(), keycode)
          }
          else {
            console.warn(
              `Keymap data out of bounds for layer ${layer}, row ${row}, col ${col}. Raw data length: ${rawData.length}`,
            )
          }
        }
      }
    }
    return keymapResult
  }

  async vialJson(): Promise<VialJson> {
    const sizeData = await this.device.writeRead([VialConstants.Command.VialPrefix, VialConstants.Command.GetSize])
    const size = this.readUint32LE(sizeData)
    const data = await this.readChunk(VialConstants.Command.GetDefinition, size)
    const rawText = await this.decompressToString(data)
    return JSON.parse(rawText) as VialJson
  }

  layoutKeymap(
    layout: InstanceType<typeof KleBoard>,
    keymap: Map<string, number>,
    layerCount: number,
  ): Map<string, number> {
    const layoutKeymap = new Map<string, number>()
    for (const key of layout.keys) {
      const [row, col] = key.labels[0]!.split(',').map(n => Number.parseInt(n, 10))
      for (let layer = 0; layer < layerCount; layer++) {
        const keycode = keymap.get([layer, row!, col!].toString())
        if (keycode !== undefined) {
          layoutKeymap.set([layer, row!, col!].toString(), keycode)
        }
      }
    }
    return layoutKeymap
  }

  kleDefinition(vialJson: VialJson): InstanceType<typeof KleBoard> {
    return deserialize(vialJson.layouts.keymap)
  }

  async macros(macroCount: number): Promise<Array<Array<MacroAction>>> {
    const sizeData = await this.device.writeRead([VialConstants.Command.GetMacroBufferSize])
    const macroSize = this.readU16(sizeData, 1)

    const macroMemory: number[] = []

    for (let i = 0; i < Math.ceil(macroSize / VialConstants.BUFFER_CHUNK_SIZE); i++) {
      const readSize = Math.min(VialConstants.BUFFER_CHUNK_SIZE, macroSize - i * VialConstants.BUFFER_CHUNK_SIZE)

      const msg = new Uint8Array(32)
      msg[0] = VialConstants.Command.GetMacroBuffer
      msg[1] = (i * VialConstants.BUFFER_CHUNK_SIZE) >> 8
      msg[2] = (i * VialConstants.BUFFER_CHUNK_SIZE) & 0xFF
      msg[3] = readSize

      const data = await this.device.writeRead(Array.from(msg))
      for (let j = 0; j < readSize; j++) {
        macroMemory.push(data[4 + j]!)
      }
      const zeroCount = macroMemory.filter(x => x === 0).length
      if (zeroCount > macroCount) {
        break
      }
    }
    let macros = this.splitArray(macroMemory, x => x === 0)
    macros = macros.slice(0, macroCount)
    const deserializedMacros = this.macroDeserializeV2(macros, macroCount)
    return deserializedMacros
  };
}
