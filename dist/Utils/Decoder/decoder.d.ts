export default pako;
export const __esModule: boolean;
declare namespace pako {
    export { Deflate_1 as Deflate };
    export { deflate_1 as deflate };
    export { deflateRaw_1 as deflateRaw };
    export { gzip_1 as gzip };
    export { Inflate_1 as Inflate };
    export { inflate_1 as inflate };
    export { inflateRaw_1 as inflateRaw };
    export { ungzip_1 as ungzip };
    export { constants_1 as constants };
}
declare var Deflate_1: {
    new (options: any): {
        options: any;
        err: number;
        msg: string;
        ended: boolean;
        chunks: any[];
        strm: {
            input: any;
            next_in: number;
            avail_in: number;
            total_in: number;
            output: any;
            next_out: number;
            avail_out: number;
            total_out: number;
            msg: string;
            state: any;
            data_type: number;
            adler: number;
        };
        _dict_set: boolean | undefined;
        push(data: any, flush_mode: any): boolean;
        onData(chunk: any): void;
        onEnd(status: any): void;
        result: Uint8Array | undefined;
    };
};
declare function deflate_1(input: any, options: any): Uint8Array | undefined;
declare function deflateRaw_1(input: any, options: any): Uint8Array | undefined;
declare function gzip_1(input: any, options: any): Uint8Array | undefined;
declare var Inflate_1: {
    new (options: any): {
        options: any;
        err: number;
        msg: string;
        ended: boolean;
        chunks: any[];
        strm: {
            input: any;
            next_in: number;
            avail_in: number;
            total_in: number;
            output: any;
            next_out: number;
            avail_out: number;
            total_out: number;
            msg: string;
            state: any;
            data_type: number;
            adler: number;
        };
        header: {
            text: number;
            time: number;
            xflags: number;
            os: number;
            extra: any;
            extra_len: number;
            name: string;
            comment: string;
            hcrc: number;
            done: boolean;
        };
        push(data: any, flush_mode: any): boolean;
        onData(chunk: any): void;
        onEnd(status: any): void;
        result: string | Uint8Array | undefined;
    };
};
declare function inflate_1(input: any, options: any): string | Uint8Array | undefined;
declare function inflateRaw_1(input: any, options: any): string | Uint8Array | undefined;
declare function ungzip_1(input: any, options: any): string | Uint8Array | undefined;
declare namespace constants_1 {
    let Z_NO_FLUSH: number;
    let Z_PARTIAL_FLUSH: number;
    let Z_SYNC_FLUSH: number;
    let Z_FULL_FLUSH: number;
    let Z_FINISH: number;
    let Z_BLOCK: number;
    let Z_TREES: number;
    let Z_OK: number;
    let Z_STREAM_END: number;
    let Z_NEED_DICT: number;
    let Z_ERRNO: number;
    let Z_STREAM_ERROR: number;
    let Z_DATA_ERROR: number;
    let Z_MEM_ERROR: number;
    let Z_BUF_ERROR: number;
    let Z_NO_COMPRESSION: number;
    let Z_BEST_SPEED: number;
    let Z_BEST_COMPRESSION: number;
    let Z_DEFAULT_COMPRESSION: number;
    let Z_FILTERED: number;
    let Z_HUFFMAN_ONLY: number;
    let Z_RLE: number;
    let Z_FIXED: number;
    let Z_DEFAULT_STRATEGY: number;
    let Z_BINARY: number;
    let Z_TEXT: number;
    let Z_UNKNOWN: number;
    let Z_DEFLATED: number;
}
