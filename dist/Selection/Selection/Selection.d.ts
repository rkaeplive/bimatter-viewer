import Selector from "../Selector";
import * as THREE from "three";
export default class Selection {
    readonly context: Selector;
    _active: boolean;
    _selectedMesh: THREE.Group;
    _useSelectBind: (e: MouseEvent) => void;
    _activeFace: number;
    _activeElement: number;
    selectModels: {
        [modelID: number]: THREE.BufferGeometry;
    };
    constructor(context: Selector);
    _addToGroup: (geom: THREE.BufferGeometry) => void;
    private addToGroup;
    get selectedMesh(): THREE.Group;
    get active(): boolean;
    set active(active: boolean);
    private useSelect;
    readonly resetSelect: (full?: boolean) => void;
    readonly selectAll: () => void;
    readonly selectByIds: (modelID: number, ids: number[], removePrevious?: boolean) => void;
    readonly removeSelectByIds: (modelID: number, ids: number[]) => void;
}
