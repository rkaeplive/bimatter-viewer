import Model from "../../Model/Model";
import Loaders from "../Loaders";
export default class BMTLoader {
    readonly context: Loaders;
    constructor(context: Loaders);
    streamToBlob(data: Blob, start: number): Promise<Blob>;
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    private parseBinaryFile;
    private parseModelData;
}
