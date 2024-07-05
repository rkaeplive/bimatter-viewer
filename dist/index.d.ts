import { BvhManager } from "./Utils/bvhUtils/BvhUtils";
import { TModels, ViewerSettings } from "./BimatterViewer.types";
import { Context } from "./Context/Context";
import { Loaders } from "./Loaders/Loaders";
import { Selector } from "./Selection/Selector";
import { Utils } from "./Utils/Utils";
import { onLoadCallbackT } from "./Loaders/Loaders.types";
export default class BimatterViewer {
    readonly loaders: Loaders;
    readonly models: TModels;
    readonly context: Context;
    readonly bvhManager: BvhManager;
    readonly selector: Selector;
    readonly utils: Utils;
    readonly container: HTMLElement;
    settings: ViewerSettings;
    constructor(settings?: ViewerSettings);
    loadModel(arg1: string | File, fitToView?: boolean, onLoadCallback?: onLoadCallbackT): Promise<import("./Model/Model").Model>;
    removeModel(modelID: number): void;
    dispose(): void;
}
