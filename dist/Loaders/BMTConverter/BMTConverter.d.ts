import { Loaders } from "../Loaders";
export declare class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(arg1: string | File): Promise<void>;
    private jsonStringifySync;
    exportIfcModel(modelID: number, activeView?: boolean, minVersion?: boolean, fileName?: string): Promise<void>;
    private exportBMT;
}
