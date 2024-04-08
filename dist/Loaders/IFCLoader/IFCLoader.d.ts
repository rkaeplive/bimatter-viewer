import Model from "../../Model/Model";
import { PropsData } from "../../Model/Model.types";
import Loaders from "../Loaders";
import { IfcAPI } from "web-ifc";
import { Group } from "three";
export default class IFCLoader {
    readonly context: Loaders;
    private parser;
    private propertySerializer;
    constructor(context: Loaders);
    get _parser(): IfcAPI;
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    getModelData(path: string): Promise<{
        propsData: PropsData;
        group: Group;
        modelID: number;
    }>;
}
