import Model from "../../Model/Model";
import Loaders from "../Loaders";
export default class BMTLoader {
    readonly context: Loaders;
    constructor(context: Loaders);
    loadModel(path: string, fitToView?: boolean): Promise<Model>;
    private parseBinaryCompressedFile;
    private parseBinaryFile;
    private parseCompressedVertexData;
    private parseVertexData;
}
