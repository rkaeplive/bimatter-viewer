import { Group } from "three";
import { PropsData, Structure } from "../../Model/Model.types";
import { Loaders } from "../Loaders";
import { GridData } from "../IFCLoader/IfcGrid";
interface ExportBmtProps {
    modelID?: number;
    propsData?: PropsData;
    structure?: Structure;
    group?: Group;
    fileName?: string;
    activeView?: boolean;
    minVersion?: boolean;
    start: number;
    grids?: {
        [key: string]: GridData;
    };
}
export declare class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(data: ArrayBuffer, useMinVersion?: boolean, wasmPath?: string): Promise<{
        data: Blob;
        props: string | undefined;
    } | undefined>;
    private jsonStringifySync;
    exportIfcModel(modelID: number, activeView?: boolean, minVersion?: boolean, fileName?: string, grids?: any): Promise<{
        data: Blob;
        props: string | undefined;
    }>;
    writeUint32(value: number): Uint8Array;
    writeChunk(type: number, data: Uint8Array): Uint8Array[];
    exportBMT(config: ExportBmtProps): Promise<{
        data: Blob;
        props: string | undefined;
    }>;
}
export {};
