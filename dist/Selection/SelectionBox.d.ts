import * as THREE from "three";
import Selector from "./Selector";
import "./SelectionHelper.css";
type ToolMode = "lasso" | "box";
type SelectionMode = "intersection" | "centroid-visible" | "centroid";
interface SelectionBoxParam {
    toolMode: ToolMode;
    selectionMode: SelectionMode;
    liveUpdate: boolean;
    resetPrevous: boolean;
}
export default class SelectionBox {
    readonly context: Selector;
    params: SelectionBoxParam;
    isMouseDown: boolean;
    isAdd: boolean;
    isFullElementInside: boolean;
    selectionShape: THREE.Line;
    selectionPoints: number[];
    dragging: boolean;
    selectionShapeNeedsUpdate: boolean;
    selectionNeedsUpdate: boolean;
    invWorldMatrix: THREE.Matrix4;
    camLocalPosition: THREE.Vector3;
    tempRay: THREE.Ray;
    centroid: THREE.Vector3;
    screenCentroid: THREE.Vector3;
    faceNormal: THREE.Vector3;
    usePreselectionState: boolean;
    toScreenSpaceMatrix: THREE.Matrix4;
    helper: HTMLElement;
    boxPoints: THREE.Vector3[];
    boxLines: THREE.Line3[];
    lassoSegments: THREE.Line3[];
    perBoundsSegments: any[];
    renderSelectionBind: () => void;
    constructor(context: Selector, cssClassName?: string);
    private reset;
    private isPlus;
    private renderSelection;
    private updateSelection;
    private getConvexHull;
    private pointRayCrossesLine;
    private pointRayCrossesSegments;
    private lineCrossesLine;
}
export {};
