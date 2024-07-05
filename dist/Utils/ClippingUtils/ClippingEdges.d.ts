import { BufferGeometry, LineBasicMaterial, LineSegments, Material, Object3D, Plane } from "three";
import { ClippingUtils } from "./ClippingUtils";
export declare class ClippingEdges extends Object3D {
    readonly context: ClippingUtils;
    readonly plane: Plane;
    active: boolean;
    lines: LineSegments | undefined;
    private tempVector;
    private tempVector1;
    private tempVector2;
    private tempVector3;
    private tempLine;
    private localPlane;
    material: LineBasicMaterial;
    constructor(context: ClippingUtils, plane: Plane);
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    create(): LineSegments<BufferGeometry<import("three").NormalBufferAttributes>, Material | Material[], import("three").Object3DEventMap>;
    update(): void;
}
