import * as THREE from "three";
import ClippingUtils from "./ClippingUtils";
import { DragControls } from "../../Context/Controls/DragControls";
export default class PlaneHelper extends THREE.Object3D {
    readonly context: ClippingUtils;
    readonly plane: THREE.Plane;
    private location;
    helper: THREE.Group;
    active: boolean;
    dragControl: DragControls;
    constructor(context: ClippingUtils, plane: THREE.Plane, location: THREE.Vector3);
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
    private getPlaneGeometry;
}
