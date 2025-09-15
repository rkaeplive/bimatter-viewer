export default CSS2DObject;
declare class CSS2DObject extends Object3D<import("three").Object3DEventMap> {
    constructor(element?: HTMLDivElement);
    element: HTMLDivElement;
    copy(source: any, recursive: any): this;
    isCSS2DObject: boolean;
}
import { Object3D } from "three";
