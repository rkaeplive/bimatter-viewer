export class DragControls extends EventDispatcher<import("three").Event> {
    constructor(_objects: any, _camera: any, _domElement: any);
    defaultActive: boolean;
    enabled: boolean;
    transformGroup: boolean;
    activate: () => void;
    deactivate: () => void;
    dispose: () => void;
    getObjects: () => any;
    getRaycaster: () => Raycaster;
}
import { EventDispatcher } from "three";
import { Raycaster } from "three";
