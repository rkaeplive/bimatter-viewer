import { Selector } from "../Selector";
import { BufferGeometry, Group } from "three";
export declare class Selection {
    readonly context: Selector;
    _active: boolean;
    _selectedMesh: Group;
    _useSelectBind: (e: MouseEvent) => void;
    _activeFace: number;
    _activeElement: number;
    state: {
        [modelID: number]: {
            [matId: number]: BufferGeometry;
        };
    };
    constructor(context: Selector);
    get selectedMesh(): Group<import("three").Object3DEventMap>;
    get active(): boolean;
    set active(active: boolean);
    private useSelect;
    readonly resetModelSelection: (modelID: number) => void;
    readonly resetSelect: (full?: boolean) => void;
    readonly selectAll: () => void;
    readonly selectByIds: (modelID: number, ids: number[], removePrevious?: boolean) => void;
    readonly removeSelectByIds: (modelID: number, ids: number[]) => void;
}
