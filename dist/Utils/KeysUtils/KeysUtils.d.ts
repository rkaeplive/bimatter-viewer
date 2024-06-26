import Utils from "../Utils";
export declare class KeysUtils {
    readonly context: Utils;
    constructor(context: Utils);
    isRemoveSelectionKey(e: KeyboardEvent | MouseEvent): boolean;
    isMultySelect(e: KeyboardEvent | MouseEvent): boolean;
    isBoxSelect(e: KeyboardEvent | MouseEvent): boolean;
}
