import {} from "@ijprest/kle-serial";
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

  private async readChunk(size: number, cmd: number): Promise<number[]> {
    let chunk: number[] = [];
    const blockNum = Math.ceil(size / VialConstants.MESSAGE_LENGTH);
    for (let block = 0; block < blockNum; block++) {
      const data = await this.device.writeRead([VialConstants.Command.VialPrefix, cmd, block]);
      chunk.push(...data);
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

  async vialJson(): Promise<VialJson> {
    const sizeData = await this.device.writeRead([VialConstants.Command.VialPrefix, VialConstants.Command.GetSize]);
    const size = this.readUint32LE(sizeData);
    const data = await this.readChunk(size, VialConstants.Command.GetDefinition);
    const rawText = await this.decompressToString(data);
    return JSON.parse(rawText) as VialJson;
  }

  kleDefinition(vialJson: VialJson): InstanceType<typeof Keyboard> {
    return KLESerial.parse(JSON.stringify(vialJson.layouts.keymap));
  }
}
