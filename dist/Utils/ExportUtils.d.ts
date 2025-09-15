import { Utils } from "./Utils";
export declare class ExportUtils {
    readonly context: Utils;
    constructor(context: Utils);
    private jsonStringifySync;
    exportBMT(modelID: number, activeView?: boolean, minVersion?: boolean): Promise<void>;
}
