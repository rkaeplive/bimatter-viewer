import Utils from "../Utils";
import PlaneHelper from "./PlaneHelper";
import ClippingEdges from "./ClippingEdges";
import { Plane } from "three";
export default class ClippingUtils {
    readonly context: Utils;
    planes: Plane[];
    active: boolean;
    _edgesActive: boolean;
    _helpersActive: boolean;
    edges: ClippingEdges[];
    heplers: PlaneHelper[];
    constructor(context: Utils);
    createPlane(): Plane | undefined;
    private createPlaneHelper;
    deleteAllPlanes(): void;
    toggle(): void;
    updateEdges(): void;
    get helpersActive(): boolean;
    set helpersActive(helpersActive: boolean);
    get edgesActive(): boolean;
    set edgesActive(edgesActive: boolean);
}
