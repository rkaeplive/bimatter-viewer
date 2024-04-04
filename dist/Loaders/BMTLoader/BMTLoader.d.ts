import Model from "../../Model/Model";
import Loaders from "../Loaders";
import * as THREE from "three";
export default class BMTLoader {
    readonly context: Loaders;
    constructor(context: Loaders);
    streamToBlob(data: Blob, start: number): Promise<Blob>;
    streamToBlobByChunks(data: Blob, start: number, group: THREE.Group): Promise<any[]>;
    addMesh(curMatId: string, posInd: number, curPos: Uint8Array, curInd: Uint8Array, group: THREE.Group, idsState: any, indState: any): Promise<void>;
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    private parseBinaryFile;
    private parseModelData;
}
