import ClippingUtils from "./ClippingUtils";
import { DragControls } from "../../Context/Controls/DragControls";
import { Group, MeshBasicMaterial, Object3D, Plane, Vector3 } from "three";
export default class PlaneHelper extends Object3D {
    readonly context: ClippingUtils;
    readonly plane: Plane;
    private location;
    helper: Group;
    active: boolean;
    dragControl: DragControls;
    material: MeshBasicMaterial;
    thickness: number;
    constructor(context: ClippingUtils, plane: Plane, location: Vector3, normal: Vector3);
    addDragControlEvents(): void;
    removeDragControlEvents(): void;
    private dragStart;
    private drag;
    private dragEnd;
    private hoverOn;
    private hoverOff;
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    private getHelperGeometry;
    customArrow(): Group<import("three").Object3DEventMap>;
}
