import { IfcAPI } from "./IFCParser/web-ifc-api-node";
import { IFCLoader } from "./IFCLoader";
import { onLoadCallbackT } from "../Loaders.types";
export declare class PropertySerializer {
    readonly context: IFCLoader | {
        _parser: IfcAPI;
        context: undefined;
    };
    private PropsNames;
    constructor(context: IFCLoader | {
        _parser: IfcAPI;
        context: undefined;
    });
    serializeAllProperties(modelID: number, ids: Set<number>, onLoadCallback?: onLoadCallbackT): Promise<any>;
    getPropertiesAsBlobs(modelID: number, ids: Set<number>, onLoadCallback?: onLoadCallbackT): Promise<any>;
    getItemProperty(modelID: number, id: number, flatten?: boolean): Promise<any>;
    getElementsAssembly(modelID: number): Promise<{
        dict: any;
        ids: number[];
    }>;
    private formatItemProperties;
    private getAllRelDefinesByProps;
    getSpatialStructure(modelID: number, includeProperties?: boolean): Promise<{
        id: number;
        type: string;
        children: never[];
    }>;
    getRelatedProperties(modelID: number, elementID: number, propsName: any, recursive?: boolean): Promise<any[]>;
    getChunks(modelID: number, chunks: any, propNames: any): Promise<void>;
    newIfcProject(id: number): {
        id: number;
        type: string;
        children: never[];
    };
    getSpatialNode(modelID: number, node: any, treeChunks: any, includeProperties: boolean): Promise<void>;
    getChildren(modelID: number, node: any, treeChunks: any, propNames: any, includeProperties: boolean): Promise<void>;
    newNode(id: number, type: any): {
        id: number;
        type: string;
        children: never[];
    };
    getSpatialTreeChunks(modelID: number): Promise<{}>;
    saveChunk(chunks: any, propNames: any, rel: any): void;
}
