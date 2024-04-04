import * as THREE from "three";
import ClippingUtils from "./ClippingUtils";
export default class ClippingEdges extends THREE.Object3D {
    readonly context: ClippingUtils;
    active: boolean;
    readonly edges: THREE.LineSegments[];
    constructor(context: ClippingUtils);
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    update(mesh: THREE.Mesh, clippingPlane: THREE.Plane, name: string, edgesMesh: THREE.Mesh): void;
    getClippingEdges(obj: THREE.Mesh, clippingPlane: THREE.Plane, name: string): THREE.LineSegments<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.LineBasicMaterial>;
}
