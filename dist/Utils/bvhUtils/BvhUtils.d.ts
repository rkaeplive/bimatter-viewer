import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";
import * as THREE from "three";
export default class BvhManager {
    readonly computeBoundsTree: typeof computeBoundsTree;
    readonly disposeBoundsTree: typeof disposeBoundsTree;
    readonly acceleratedRaycast: typeof acceleratedRaycast;
    private worker;
    maxDepth: number | undefined;
    constructor();
    applyThreeMeshBVH(geometry: THREE.BufferGeometry): Promise<void>;
    generate(geometry: THREE.BufferGeometry, options?: any): Promise<unknown>;
    dispose(): void;
    setupThreeMeshBVH(): void;
}
