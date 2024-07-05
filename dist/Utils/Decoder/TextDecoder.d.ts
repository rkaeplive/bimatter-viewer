export declare class TextDecoder {
    createEncodingTree(frequencies: string): Node;
    encode(message: string, encodingTree: any): string;
    buildEncoding(node: Node, prefix: string, encoding: any): void;
    decode(encodedMessage: string, encodingTree: any): string;
}
declare class Node {
    readonly value: string | null;
    readonly frequency: string;
    left: Node | null;
    right: Node | null;
    constructor(value: string | null, frequency: string);
}
export {};
