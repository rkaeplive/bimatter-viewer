import { Utils } from "./Utils";
import { OSType } from "./Utils.types";
export declare class OsUtils {
    readonly context: Utils;
    OS: OSType;
    constructor(context: Utils);
    getOS(): OSType;
    private setMobileSettings;
}
