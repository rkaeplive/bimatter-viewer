import * as THREE from "three";
import Selection from "./Selection/Selection";
import PreSelection from "./PreSelection/PreSelection";
import BimatterViewer from "..";
import SelectionBox from "./SelectionBox";
export default class Selector {
    readonly context: BimatterViewer;
    readonly selMaterial: THREE.MeshLambertMaterial;
    readonly preSelMaterial: THREE.MeshStandardMaterial;
    selectedElements: {
        [modelID: number]: Set<number>;
    };
    isSelected: boolean;
    readonly selectorModels: THREE.Mesh[];
    private _usePreSelection;
    private _selection;
    private _preSelection;
    readonly selectionBox: SelectionBox;
    constructor(context: BimatterViewer);
    set usePreSelection(usePreSelection: boolean);
    set useSelection(useSelection: boolean);
    get usePreSelection(): boolean;
    get useSelection(): boolean;
    get preSelection(): PreSelection;
    get selection(): Selection;
}
