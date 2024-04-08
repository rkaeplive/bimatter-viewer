import { BufferGeometry, LineBasicMaterial, LineSegments, Mesh, Object3D, Plane } from "three";
import ClippingUtils from "./ClippingUtils";
export default class ClippingEdges extends Object3D {
    readonly context: ClippingUtils;
    active: boolean;
    readonly edges: LineSegments[];
    constructor(context: ClippingUtils);
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    update(mesh: Mesh, clippingPlane: Plane, name: string, edgesMesh: Mesh): void;
    getClippingEdges(obj: Mesh, clippingPlane: Plane, name: string): LineSegments<BufferGeometry<import("three").NormalBufferAttributes>, LineBasicMaterial, import("three").Object3DEventMap>;
}
