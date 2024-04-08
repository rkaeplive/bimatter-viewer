import { BufferGeometry, Mesh, Vector3 } from "three";
import Selector from "../Selector";
export default class PreSelection {
    readonly context: Selector;
    private _active;
    private _usePreSelectBind;
    _preSelectMesh: Mesh;
    private _activeElement;
    private _activeFace;
    private _activePoint;
    private _intersectLength;
    private _intersectDistance;
    private _needUpdate;
    preselectModels: {
        [modelID: number]: BufferGeometry;
    };
    private deep;
    constructor(context: Selector);
    get preSelectElement(): {
        mesh: Mesh<BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap>;
        elementID: number;
        modelID: number;
        point: Vector3;
        distance: number;
    } | null;
    get setDeep(): number;
    private usePreSelect;
    readonly resetPreselect: () => void;
    get active(): boolean;
    set active(active: boolean);
}
