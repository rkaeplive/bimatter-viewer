import Utils from "./Utils";
export default class ExportUtils {
    readonly context: Utils;
    constructor(context: Utils);
    private jsonStringifySync;
    exportBMT(modelID: number, activeView?: boolean, minVersion?: boolean): Promise<void>;
}
