import { DefaultState, PropsData, State, Structure } from "./Model.types";
import BimatterViewer from "..";
import { Properties } from "./Properties/Properties";
import { Box3, Group } from "three";
export declare class Model {
    readonly context: BimatterViewer;
    readonly modelID: number;
    readonly threeGeometry: Group;
    readonly boundingBox: Box3;
    readonly properties: Properties;
    readonly state: State;
    readonly defaultState: DefaultState;
    activeElements: Set<number>;
    constructor(context: BimatterViewer, modelID: number, fitToView: boolean | undefined, threeGeometry: Group, propsData: PropsData, structure: Structure, indMap?: {
        [matId: number]: number[];
    }, idsMap?: {
        [matId: number]: number[];
    }, start?: number);
    private getSelectionGeom;
    private getGeometryState;
    private getMaterialIndex;
    private updateBox;
    fitToView(): Promise<void>;
}
