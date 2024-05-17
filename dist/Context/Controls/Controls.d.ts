import * as THREE from "three";
import Context from "../Context";
import CameraControls from "camera-controls";
import { DragControls } from "./DragControls.js";
export default class Controls {
    readonly context: Context;
    readonly cameraControl: CameraControls;
    readonly raycaster: THREE.Raycaster;
    private _moving;
    private _position;
    constructor(context: Context);
    get moving(): boolean;
    set moving(moving: boolean);
    readonly createDragControl: (objects: THREE.Object3D[]) => DragControls;
    private getIntersect;
    readonly getIntersects: (objects?: THREE.Object3D[]) => THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[];
    private checkIntersect;
    private addEvents;
    private onControl;
    private _onControl;
    setOrbitByClick(): void;
    setOrbitByTarget(target: THREE.Vector3): void;
}
