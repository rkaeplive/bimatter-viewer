export default CSS3DObject;
declare class CSS3DObject extends Object3D<import("three").Object3DEventMap> {
    constructor(element?: HTMLDivElement);
    isCSS3DObject: boolean;
    element: HTMLDivElement;
    copy(source: any, recursive: any): this;
}
import { Object3D } from "three";
