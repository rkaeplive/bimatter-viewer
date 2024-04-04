import * as THREE from "three";
import Context from "../Context";
export default class Environment {
    readonly context: Context;
    lights: Lights;
    constructor(context: Context);
}
declare class Lights {
    readonly context: Environment;
    ambientLight: THREE.AmbientLight;
    directionalLight1: THREE.DirectionalLight;
    directionalLight2: THREE.DirectionalLight;
    constructor(context: Environment);
    updateLightPosition(box: THREE.Box3): void;
}
export {};
