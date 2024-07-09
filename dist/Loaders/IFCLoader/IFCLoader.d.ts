import { Model } from "../../Model/Model";
import { PropsData, Structure } from "../../Model/Model.types";
import { Loaders } from "../Loaders";
import { Group } from "three";
import { IfcAPI } from "./IFCParser/web-ifc-api-node";
import { onLoadCallbackT } from "../Loaders.types";
export declare class IFCLoader {
    readonly context: Loaders;
    private parser;
    private propertySerializer;
    private _wasmPath;
    private curModelId;
    constructor(context: Loaders);
    getPath(path: string, dir: string): string;
    set wasmPath(path: string);
    get _parser(): IfcAPI;
    loadModel(path: string, fitToView?: boolean, onLoadCallback?: onLoadCallbackT): Promise<Model | undefined>;
    getModelData(path: string): Promise<{
        structure: Structure;
        propsData: PropsData;
        group: Group;
        modelID: number;
    }>;
}
