import Context from "../Context";
import { TLookAt, TSetPosition } from "./Camera.types";
import * as THREE from "three";
export default class Camera {
    readonly context: Context;
    readonly threeCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    constructor(context: Context, fov: number, near: number, far: number);
    lookAt: TLookAt;
    setPosition: TSetPosition;
}
