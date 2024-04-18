import BvhManager from "./Utils/bvhUtils/BvhUtils";
import { TModels } from "./BimatterViewer.types";
import Context from "./Context/Context";
import Loaders from "./Loaders/Loaders";
import Selector from "./Selection/Selector";
import Utils from "./Utils/Utils";
export default class BimatterViewer {
    readonly container?: HTMLElement | undefined;
    readonly loaders: Loaders;
    readonly models: TModels;
    readonly context: Context;
    readonly bvhManager: BvhManager;
    readonly selector: Selector;
    readonly utils: Utils;
    constructor(container?: HTMLElement | undefined);
    loadModel(arg1: string | File, fitToView?: boolean): Promise<import("./Model/Model").default>;
}
