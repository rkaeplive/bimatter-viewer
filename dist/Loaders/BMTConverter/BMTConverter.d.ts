import { Loaders } from "../Loaders";
export declare class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(data: ArrayBuffer, useMinVersion?: boolean): Promise<{
        data: Uint8Array[];
        props: string | undefined;
    } | undefined>;
    private jsonStringifySync;
    exportIfcModel(modelID: number, activeView?: boolean, minVersion?: boolean, fileName?: string, grids?: any): Promise<void>;
    private addPropertiesDataToBlob;
    private exportBMT;
}
