import { Clock, WebGLRenderer } from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import Context from "../Context";
export default class Renderer {
    readonly context: Context;
    threeRenderer2D: CSS2DRenderer;
    threeRenderer3D: CSS3DRenderer;
    threeRenderer: WebGLRenderer;
    private animationCallbackList;
    clock: Clock;
    needUpdate: boolean;
    constructor(context: Context);
    resize(): void;
    private animation;
    addCallback(callback: () => any): void;
    removeCallback(callback: () => any): void;
    render(): void;
}
