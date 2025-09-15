import { BufferGeometry, Mesh } from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import BimatterViewer from "../..";
export declare class BvhManager {
    readonly context: BimatterViewer;
    readonly computeBoundsTree: typeof computeBoundsTree;
    readonly disposeBoundsTree: typeof disposeBoundsTree;
    readonly acceleratedRaycast: typeof acceleratedRaycast;
    private _worker;
    maxDepth: number | undefined;
    constructor(context: BimatterViewer);
    set useWorker(worker: Worker | null);
    get useWorker(): Worker | null;
    applyThreeMeshBVH(geometry: BufferGeometry): Promise<void>;
    generate(geometry: BufferGeometry, options?: any): Promise<MeshBVH>;
    update(mesh?: Mesh): void;
    private updateByMesh;
    dispose(): void;
    setupThreeMeshBVH(): void;
}
