import * as THREE from "three";
import Context from "../Context";
export default class Renderer {
    readonly context: Context;
    threeRenderer: THREE.WebGLRenderer;
    private animationCallbackList;
    clock: THREE.Clock;
    needUpdate: boolean;
    constructor(context: Context);
    resize(): void;
    private animation;
    addCallback(callback: () => any): void;
    removeCallback(callback: () => any): void;
    render(): void;
}
