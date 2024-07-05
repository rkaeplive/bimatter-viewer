import { Clock, OrthographicCamera, PerspectiveCamera, WebGLRenderer } from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { Context } from "../Context";
export declare class Renderer {
    readonly context: Context;
    threeRenderer2D: CSS2DRenderer;
    threeRenderer3D: CSS3DRenderer;
    threeRenderer: WebGLRenderer;
    tempRenderer: WebGLRenderer | undefined;
    private animationCallbackList;
    clock: Clock;
    needUpdate: boolean;
    constructor(context: Context);
    newScreenshot(camera?: OrthographicCamera | PerspectiveCamera): string;
    resize(): void;
    private animation;
    addCallback(callback: () => any): void;
    removeCallback(callback: () => any): void;
    render(): void;
}
