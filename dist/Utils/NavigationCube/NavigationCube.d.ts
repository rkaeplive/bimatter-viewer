import { Sphere } from "three";
import Utils from "../Utils";
import "./navigationCube.css";
export default class ViewCubeContainer {
    readonly context: Utils;
    _active: boolean;
    boundingSphere: Sphere | null;
    cubeContainer: HTMLElement | undefined;
    constructor(context: Utils);
    get active(): boolean;
    set active(bool: boolean);
    private epsilon;
    private getCameraCSSMatrix;
    private animate;
    switchPick(name: string): void;
    private hoverFunc;
    private unHoverFunc;
    updateBoundingSphere(): void;
    private create;
}
