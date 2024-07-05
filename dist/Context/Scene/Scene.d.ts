import * as THREE from "three";
import { Context } from "../Context";
export declare class Scene {
    readonly context: Context;
    readonly threeScene: THREE.Scene;
    constructor(context: Context, useDefaultTexture?: boolean);
}
