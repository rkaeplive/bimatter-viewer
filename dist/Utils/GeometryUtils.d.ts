import { Utils } from "./Utils";
import { GeometryChunkConfig } from "./Utils.types";
export declare class GeometryUtils {
    readonly context: Utils;
    constructor(context: Utils);
    readonly hideSelectedElements: () => void;
    readonly isolateSelectedElements: () => void;
    readonly hideElementsByIds: (modelID: number, ids: number[]) => void;
    readonly isolateElementsByIds: (modelID: number, ids: number[]) => void;
    private update;
    readonly showAll: () => void;
    private resetModelVisibility;
    readonly createGeometryChunk: (config: GeometryChunkConfig) => Error | undefined;
    resetAllModelsChunks(): void;
    resetModelChunks(modelID: number): void;
}
