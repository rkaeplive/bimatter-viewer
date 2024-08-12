import { Model } from "../../Model/Model";
import { PropsData, Structure } from "../../Model/Model.types";
import { Loaders } from "../Loaders";
import { Group } from "three";
import { IfcAPI } from "./IFCParser/web-ifc-api-node";
import { onLoadCallbackT } from "../Loaders.types";
import { LoadingProgressUtils } from "../LoadingProgressUtils/LoadingProgressUtils";
export declare class IFCLoader {
    readonly context: Loaders;
    private parser;
    private propertySerializer;
    private _wasmPath;
    chunk: number;
    private curModelId;
    constructor(context: Loaders);
    getPath(path: string, dir: string): string;
    initParser(func?: any): Promise<void>;
    set wasmPath(path: string);
    get _parser(): IfcAPI;
    set _parser(parser: IfcAPI);
    loadModel(path: string, fitToView?: boolean, onLoadCallback?: onLoadCallbackT): Promise<Model | undefined>;
    getModelData(path: string): Promise<{
        structure: Structure;
        propsData: PropsData;
        group: Group;
        modelID: number;
    }>;
    getModelDataFromBuffer(file: ArrayBuffer): Promise<{
        structure: {
            id: number;
            type: string;
            children: never[];
        };
        propsData: PropsData;
        group: Group<import("three").Object3DEventMap>;
        modelID: number;
    }>;
}
export declare class IfcParser {
    private parser;
    private ifcModelID;
    readonly progressUtils: LoadingProgressUtils | undefined;
    private materials;
    constructor(parser: IfcAPI, ifcModelID: number, progressUtils: LoadingProgressUtils | undefined);
    parseData(allIds: Set<number>): Group<import("three").Object3DEventMap>;
    private getPlacedGeometry;
    private getBufferGeometry;
    private getMeshMaterial;
    private getMeshMatrix;
    private ifcGeometryToBuffer;
}
