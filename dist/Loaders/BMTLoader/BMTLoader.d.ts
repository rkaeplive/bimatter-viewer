import { Matrix4 } from "three";
import { Model } from "../../Model/Model";
import { Loaders } from "../Loaders";
export declare class BMTLoader {
    readonly context: Loaders;
    curMatrix: Matrix4;
    constructor(context: Loaders);
    streamToBlob(data: Blob, start: number): Promise<Blob>;
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    private parseBinaryFile;
    private parseModelData;
}
