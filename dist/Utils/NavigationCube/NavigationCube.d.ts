import * as THREE from "three";
import Utils from "../Utils";
import "./navigationCube.css";
export default class ViewCubeContainer {
    readonly context: Utils;
    active: boolean;
    boundingSphere: THREE.Sphere | null;
    constructor(context: Utils);
    private epsilon;
    private getCameraCSSMatrix;
    private animate;
    switchPick(name: string): void;
    private hoverFunc;
    private unHoverFunc;
    updateBoundingSphere(): void;
    private create;
}
