import { DefaultState, PropsData, State, Structure } from "./Model.types";
import BimatterViewer from "..";
import { Properties } from "./Properties/Properties";
import { Box3, Group, Mesh } from "three";
import { GridData } from "../Loaders/IFCLoader/IfcGrid";
import { ModelGrids } from "./ModelGrids/ModelGrids";
export declare class Model {
    readonly context: BimatterViewer;
    readonly modelID: number;
    readonly threeGeometry: Group;
    grids: ModelGrids | undefined;
    boundingBox: Box3;
    properties: Properties;
    state: State;
    defaultState: DefaultState;
    activeElements: Set<number>;
    _showGrids: boolean;
    get showGrids(): boolean;
    set showGrids(bool: boolean);
    constructor(context: BimatterViewer, modelID: number, fitToView: boolean | undefined, threeGeometry: Group, propsData: PropsData, structure: Structure, indMap?: {
        [matId: number]: number[];
    }, idsMap?: {
        [matId: number]: number[];
    }, defIndMap?: {
        [matId: number]: number[];
    }, defIdsMap?: {
        [matId: number]: number[];
    }, start?: number);
    private getBoundingBox;
    private cloneGeometry;
    private getSelectionGeom;
    setState(state: State, defaultState: State, activeElements?: Set<number>): void;
    private getGeometryState;
    private updateBox;
    fitToView(enableTransition?: boolean): Promise<void>;
    addMeshToModel(mesh: Mesh, selectGroup: Group, preselectGroup: Group, fitToView?: boolean): void;
    setupGrids(gridsData: {
        [id: string]: GridData;
    }): void;
}
