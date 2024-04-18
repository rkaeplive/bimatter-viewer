import Model from "../../Model/Model";
import { PropsData } from "../../Model/Model.types";
import Loaders from "../Loaders";
import { Group } from "three";
import { IfcAPI } from "./IFCParser/web-ifc-api-node";
export default class IFCLoader {
    readonly context: Loaders;
    private parser;
    private propertySerializer;
    private _wasmPath;
    constructor(context: Loaders);
    set wasmPath(path: string);
    get _parser(): IfcAPI;
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    getModelData(path: string): Promise<{
        propsData: PropsData;
        group: Group;
        modelID: number;
    }>;
}
