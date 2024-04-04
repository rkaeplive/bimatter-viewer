import * as THREE from "three";
import { DefaultState, State } from "./Model.types";
import BimatterViewer from "..";
import Properties from "./Properties/Properties";
export default class Model {
    readonly context: BimatterViewer;
    readonly modelID: number;
    readonly threeGeometry: THREE.Group;
    readonly boundingBox: THREE.Box3;
    readonly properties: Properties;
    readonly state: State;
    readonly defaultState: DefaultState;
    activeElements: Set<number>;
    constructor(context: BimatterViewer, modelID: number, fitToView: boolean | undefined, threeGeometry: THREE.Group, propsData: {}, indMap?: {
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
