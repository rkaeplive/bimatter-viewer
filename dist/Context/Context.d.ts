import { TextureLoader, Vector2 } from "three";
import BimatterViewer from "..";
import Camera from "./Camera/Camera";
import Controls from "./Controls/Controls";
import Sizes from "./Controls/Sizes";
import Environment from "./Environment/Environment";
import Postproduction from "./Postproduction/Postproduction";
import Renderer from "./Renderer/Renderer";
import Scene from "./Scene/Scene";
export default class Context {
    readonly context: BimatterViewer;
    readonly scene: Scene;
    readonly camera: Camera;
    readonly renderer: Renderer;
    readonly controls: Controls;
    readonly environment: Environment;
    sizes: Sizes;
    readonly domElement: HTMLCanvasElement;
    readonly postproduction: Postproduction;
    readonly textureLoader: TextureLoader;
    readonly mouse: {
        position: Vector2;
        cords: Vector2;
    };
    readonly mouseMoveHandleBind: (event: MouseEvent) => void;
    constructor(context: BimatterViewer);
    private mouseMoveHandle;
    resizeViewer(width?: string, height?: string): void;
}
