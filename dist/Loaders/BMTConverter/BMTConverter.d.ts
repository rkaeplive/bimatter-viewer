import { Loaders } from "../Loaders";
export declare class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(data: ArrayBuffer, useMinVersion?: boolean): Promise<{
        data: Uint8Array[];
        props: string | undefined;
    }>;
    private jsonStringifySync;
    exportIfcModel(modelID: number, activeView?: boolean, minVersion?: boolean, fileName?: string): Promise<void>;
    private exportBMT;
}
