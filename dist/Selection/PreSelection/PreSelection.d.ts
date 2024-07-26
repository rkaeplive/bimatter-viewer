import { BufferGeometry, Group, Vector3 } from "three";
import { Selector } from "../Selector";
export interface PreselectState {
    [modelID: number]: {
        [matId: number]: BufferGeometry;
    };
}
export declare class PreSelection {
    readonly context: Selector;
    private _active;
    private _usePreSelectBind;
    _preSelectMesh: Group;
    private _activeElement;
    private _activeFace;
    private _activePoint;
    private _activeModelID;
    private _intersectLength;
    private _intersectDistance;
    private _needUpdate;
    private deep;
    state: PreselectState;
    constructor(context: Selector);
    get preSelectElement(): {
        mesh: Group<import("three").Object3DEventMap>;
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
