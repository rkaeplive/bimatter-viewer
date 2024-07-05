import { OrthographicCamera, PerspectiveCamera } from "three";
import { Context } from "../Context";
import { TLookAt, TSetPosition } from "./Camera.types";
export declare class Camera {
    readonly context: Context;
    readonly threeCamera: PerspectiveCamera | OrthographicCamera;
    constructor(context: Context, fov: number, near: number, far: number);
    lookAt: TLookAt;
    setPosition: TSetPosition;
}
