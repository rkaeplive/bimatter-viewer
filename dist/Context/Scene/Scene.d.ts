import * as THREE from "three";
import Context from "../Context";
export default class Scene {
    readonly context: Context;
    readonly threeScene: THREE.Scene;
    constructor(context: Context);
}
