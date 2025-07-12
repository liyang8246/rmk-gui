export class VialDevice implements VialInterface {
  constructor(private device: HIDInterface) {}

  private readUint32LE(buffer: Uint8Array): number {
    if (buffer.length < 4) {
      throw new Error("Buffer must have at least 4 bytes");
    }
    return (buffer[0]! | (buffer[1]! << 8) | (buffer[2]! << 16) | (buffer[3]! << 24)) >>> 0;
  }

  private async decompressToString(compressedData: number[]): Promise<string> {
    const compressedBytes = new Uint8Array(compressedData);
    const compressedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(compressedBytes);
        controller.close();
      },
    });
    const decompressedStream = new XzReadableStream(compressedStream);
    const response = new Response(decompressedStream);
    return await response.text();
  }

  private async readChunk(cmd: number, size: number): Promise<number[]> {
    let chunk: number[] = [];
    const blockNum = Math.ceil(size / VialConstants.BUFFER_CHUNK_SIZE);
    for (let block = 0; block < blockNum; block++) {
      const data = await this.device.writeRead([VialConstants.Command.VialPrefix, cmd, block]);
      chunk.push(...data);
    }
    return chunk.slice(0, size);
  }

  private async readOffset(cmd: number, size: number, offset: number): Promise<number[]> {
    let chunk: number[] = [];

    for (let x = 0; x < size; x += VialConstants.BUFFER_CHUNK_SIZE) {
      const currentReadOffset = offset + x;
      const sz = Math.min(size - x, VialConstants.BUFFER_CHUNK_SIZE);

      const data = await this.device.writeRead([cmd, (currentReadOffset >> 8) & 0xff, currentReadOffset & 0xff, sz]);
      chunk.push(...data.slice(VialConstants.HEADER_SIZE, VialConstants.HEADER_SIZE + sz));
    }
    return chunk.slice(0, size);
  }

  async productName(): Promise<string> {
    return await this.device.productName();
  }

  async layerCount(): Promise<number> {
    const data = await this.device.writeRead([VialConstants.Command.GetLayerCount]);
    return data[1]!;
  }

  async marcoCount(): Promise<number> {
    const data = await this.device.writeRead([VialConstants.Command.GetMacroCount]);
    return data[1]!;
  }

  async keymap(layerCount: number, rowCount: number, colCount: number): Promise<Map<string, number>> {
    const size = layerCount * rowCount * colCount * 2;
    const rawData = await this.readOffset(VialConstants.Command.GetKeymapBuffer, size, 0);

    const keymapResult = new Map<string, number>();

    for (let layer = 0; layer < layerCount; layer++) {
      for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
          const offset = (layer * rowCount * colCount + row * colCount + col) * 2;
          if (offset + 1 < rawData.length) {
            const keycode = 256 * rawData[offset]! + rawData[offset + 1]!;
            keymapResult.set([layer, row, col].toString(), keycode);
          } else {
            console.warn(
              `Keymap data out of bounds for layer ${layer}, row ${row}, col ${col}. Raw data length: ${rawData.length}`
            );
          }
        }
      }
    }
    return keymapResult;
  }

  async vialJson(): Promise<VialJson> {
    const sizeData = await this.device.writeRead([VialConstants.Command.VialPrefix, VialConstants.Command.GetSize]);
    const size = this.readUint32LE(sizeData);
    const data = await this.readChunk(VialConstants.Command.GetDefinition, size);
    const rawText = await this.decompressToString(data);
    return JSON.parse(rawText) as VialJson;
  }

  layoutKeymap(
    layout: InstanceType<typeof Keyboard>,
    keymap: Map<string, number>,
    layerCount: number
  ): Map<string, number> {
    let layoutKeymap = new Map<string, number>();
    for (const key of layout.keys) {
      const [row, col] = key.labels[0]!.split(",").map(n => parseInt(n, 10));
      for (let layer = 0; layer < layerCount; layer++) {
        const keycode = keymap.get([layer, row!, col!].toString());
        if (keycode !== undefined) {
          layoutKeymap.set([row!, col!, layer].toString(), keycode);
        }
      }
    }
    return layoutKeymap;
  }

  kleDefinition(vialJson: VialJson): InstanceType<typeof Keyboard> {
    return deserialize(vialJson.layouts.keymap);
  }
}
