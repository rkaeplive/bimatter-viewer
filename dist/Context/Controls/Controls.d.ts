import * as THREE from "three";
import Context from "../Context";
import CameraControls from "camera-controls";
import { DragControls } from "./DragControls.js";
export default class Controls {
    readonly context: Context;
    readonly cameraControl: CameraControls;
    readonly raycaster: THREE.Raycaster;
    private _pointer;
    private _moving;
    private _position;
    constructor(context: Context);
    get pointer(): THREE.Vector2 | null;
    get moving(): boolean;
    set moving(moving: boolean);
    readonly createDragControl: (objects: THREE.Object3D[]) => DragControls;
    readonly getIntersecs: (objects: THREE.Object3D[]) => THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[];
    private checkIntersect;
    private addEvents;
    private onControl;
    private _onControl;
    readonly onPointerMove: (event: PointerEvent) => void;
    setOrbitByClick(): void;
    setOrbitByTarget(target: THREE.Vector3): void;
}
