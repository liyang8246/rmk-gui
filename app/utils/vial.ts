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

  async keymap(layer: number, rows: number, cols: number): Promise<number[]> {
    const size = layer * rows * cols * 2;
    const rawData = await this.readOffset(VialConstants.Command.GetKeymapBuffer, size, 0);
    return Array.from({ length: rawData.length / 2 }, (_, i) => {
      return 256 * rawData[i * 2]! + rawData[i * 2 + 1]!;
    });
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
    keymap: number[],
    layerCount: number
  ): Map<[number, number, number], number> {
    let layoutKeymap = new Map<[number, number, number], number>();
    for (const key of layout.keys) {
      const [row, col] = key.labels[0]!.split(",").map(n => parseInt(n, 10));
      for (let layer = 0; layer < layerCount; layer++) {
        const keycode = keymap[layer * row! * col!]!;
        layoutKeymap.set([row!, col!, layer], keycode);
      }
    }
    return layoutKeymap;
  }

  kleDefinition(vialJson: VialJson): InstanceType<typeof Keyboard> {
    return KLESerial.parse(JSON.stringify(vialJson.layouts.keymap));
  }
}
