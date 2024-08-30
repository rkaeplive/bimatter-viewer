import { BufferGeometry } from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";
export declare class BvhManager {
    readonly computeBoundsTree: typeof computeBoundsTree;
    readonly disposeBoundsTree: typeof disposeBoundsTree;
    readonly acceleratedRaycast: typeof acceleratedRaycast;
    private worker;
    private _workerPath;
    maxDepth: number | undefined;
    constructor();
    set workerPath(path: URL | undefined);
    get workerPath(): URL | undefined;
    set useWorker(bool: boolean);
    get useWorker(): boolean;
    applyThreeMeshBVH(geometry: BufferGeometry): Promise<void>;
    generate(geometry: BufferGeometry, options?: any): Promise<unknown>;
    dispose(): void;
    setupThreeMeshBVH(): void;
}
