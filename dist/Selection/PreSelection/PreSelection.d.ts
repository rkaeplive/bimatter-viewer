import Selector from "../Selector";
import * as THREE from "three";
export default class PreSelection {
    readonly context: Selector;
    private _active;
    private _usePreSelectBind;
    _preSelectMesh: THREE.Mesh;
    private _activeElement;
    private _activeFace;
    private _activePoint;
    private _intersectLength;
    private _intersectDistance;
    private _needUpdate;
    preselectModels: {
        [modelID: number]: THREE.BufferGeometry;
    };
    private deep;
    constructor(context: Selector);
    get preSelectElement(): {
        mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[]>;
        elementID: number;
        modelID: number;
        point: THREE.Vector3;
        distance: number;
    } | null;
    get setDeep(): number;
    private usePreSelect;
    readonly resetPreselect: () => void;
    get active(): boolean;
    set active(active: boolean);
}
