import { AmbientLight, DirectionalLight, Box3 } from "three";
import Context from "../Context";
export default class Environment {
    readonly context: Context;
    lights: Lights;
    constructor(context: Context);
}
declare class Lights {
    readonly context: Environment;
    ambientLight: AmbientLight;
    directionalLight1: DirectionalLight;
    directionalLight2: DirectionalLight;
    constructor(context: Environment);
    updateLightPosition(box: Box3): void;
}
export {};
