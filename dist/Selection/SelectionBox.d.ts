import { Selector } from "./Selector";
import "./SelectionHelper.css";
import { Line, Line3, Matrix4, Ray, Vector3 } from "three";
type ToolMode = "lasso" | "box";
type SelectionMode = "intersection" | "centroid-visible" | "centroid";
interface SelectionBoxParam {
    toolMode: ToolMode;
    selectionMode: SelectionMode;
    liveUpdate: boolean;
    resetPrevous: boolean;
}
export declare class SelectionBox {
    readonly context: Selector;
    params: SelectionBoxParam;
    isMouseDown: boolean;
    isAdd: boolean;
    isFullElementInside: boolean;
    selectionShape: Line;
    selectionPoints: number[];
    dragging: boolean;
    selectionShapeNeedsUpdate: boolean;
    selectionNeedsUpdate: boolean;
    invWorldMatrix: Matrix4;
    camLocalPosition: Vector3;
    tempRay: Ray;
    centroid: Vector3;
    screenCentroid: Vector3;
    faceNormal: Vector3;
    usePreselectionState: boolean;
    toScreenSpaceMatrix: Matrix4;
    helper: HTMLElement;
    boxPoints: Vector3[];
    boxLines: Line3[];
    lassoSegments: Line3[];
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
