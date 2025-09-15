import { Selection } from "./Selection/Selection";
import { PreSelection } from "./PreSelection/PreSelection";
import BimatterViewer from "..";
import { SelectionBox } from "./SelectionBox";
import { MeshLambertMaterial, Object3D, Object3DEventMap } from "three";
export declare class Selector {
    readonly context: BimatterViewer;
    readonly selMaterial: MeshLambertMaterial;
    readonly preSelMaterial: MeshLambertMaterial;
    selectedElements: {
        [modelID: number]: Set<number>;
    };
    isSelected: boolean;
    readonly selectorModels: {
        [modelID: number]: Object3D<Object3DEventMap>[];
    };
    private _usePreSelection;
    private _selection;
    private _preSelection;
    readonly selectionBox: SelectionBox;
    constructor(context: BimatterViewer);
    get useDoubleSideMaterial(): boolean;
    set useDoubleSideMaterial(bool: boolean);
    set usePreSelection(usePreSelection: boolean);
    set useSelection(useSelection: boolean);
    get usePreSelection(): boolean;
    get useSelection(): boolean;
    get preSelection(): PreSelection;
    get selection(): Selection;
}
