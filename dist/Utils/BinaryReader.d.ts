export default class BinaryReader {
    view: DataView;
    offset: number;
    constructor(buffer: ArrayBuffer);
    readUint8(): number;
    readUint32(): number;
    readBytes(length: number): Uint8Array;
    eof(): boolean;
}
