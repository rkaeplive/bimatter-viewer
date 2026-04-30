import * as three from 'three';
import { BufferGeometry, Mesh, TypedArray, LineBasicMaterial, Group, Vector3, Box3, PerspectiveCamera, OrthographicCamera, EventDispatcher, AmbientLight, DirectionalLight, WebGLRenderer, Clock, TextureLoader, Vector2, Matrix4, Line, Ray, Line3, MeshLambertMaterial, Object3D, Object3DEventMap, Material, Color, Plane, MeshBasicMaterial, Sphere, LineDashedMaterial, ConeGeometry, BoxGeometry } from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';
import CameraControls from 'camera-controls';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { IfcAPI } from 'web-ifc';
import * as pako from 'pako';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import GUI from 'lil-gui';

declare class BvhManager {
    readonly context: BimatterViewer;
    readonly computeBoundsTree: typeof computeBoundsTree;
    readonly disposeBoundsTree: typeof disposeBoundsTree;
    readonly acceleratedRaycast: typeof acceleratedRaycast;
    private _worker;
    maxDepth: number | undefined;
    constructor(context: BimatterViewer);
    set useWorker(worker: Worker | null);
    get useWorker(): Worker | null;
    applyThreeMeshBVH(geometry: BufferGeometry): Promise<void>;
    generate(geometry: BufferGeometry, options?: any): Promise<MeshBVH>;
    update(mesh?: Mesh): void;
    private updateByMesh;
    dispose(): void;
    setupThreeMeshBVH(): void;
}

interface IFaceData {
    vert: number[];
    mat: TMaterialId;
    par: number;
}
interface IElementData {
    guid: string;
}
interface IMaterialData {
    col: TMaterialColor;
    a: number;
    face: number[];
    name: string;
}
type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;
type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
type TMaterialColor = IntRange<0, 255>[];
type TMaterialId = number;

type TfitToViewFunc = () => void;
interface IModelData {
    facesMap: {
        [faceId: number]: IFaceData;
    };
    elementsMap: {
        [elementId: number]: IElementData;
    };
    materialsMap: {
        [materialId: number]: IMaterialData;
    };
}
type State = {
    idsMap: {
        [elemId: number]: {
            [matId: number]: number[];
        };
    };
    needsUpdate: Set<number>;
};
type DefaultState = {
    indMap: {
        [matId: number]: TypedArray;
    };
    idsMap: {
        [elemId: number]: {
            [matId: number]: number[];
        };
    };
};
type PropsData = {
    [element: number]: PropData;
};
type Structure = {
    id: number;
    type: string;
    children: Structure[];
};
type PropData = {
    id: number;
    guid: string;
    props: IfcProps;
    tprops?: IfcTypeProps;
    sets: PropSet[];
};
interface IfcProps {
    [paramName: string]: any;
}
interface IfcTypeProps {
    [paramName: string]: any;
}
interface PropSet {
    name: string;
    props: any;
}
type PosData = {
    posData: Float32Array;
    idsData: Uint32Array;
    indDAta: Uint32Array;
};

declare class Properties {
    readonly context: Model;
    data: PropsData;
    structure: Structure;
    hasProperties: boolean;
    constructor(context: Model, data: PropsData, structure: Structure);
    loadStructure(path: string): void;
    setStructure(structure: Structure): void;
    loadProperties(path: string): void;
    setProperties(properties: PropsData): void;
}

interface GridData {
    loc: {
        x: number;
        y: number;
        z: number;
    };
    points: {
        u: {};
        v: {};
    };
}

declare class ModelGrids {
    readonly context: Model;
    topTags: any[];
    botTags: any[];
    leftTags: any[];
    rightTags: any[];
    _active: boolean;
    grids: any[];
    color: string;
    material: LineBasicMaterial;
    mesh: Group;
    constructor(context: Model, grids: {
        [key: string]: GridData;
    });
    init(): Promise<void>;
    addGrid(gridGroup: Group, data: any, locCoordinates: Vector3, type: string, lowY: Vector3): void;
    viewTop(bool: boolean): void;
    viewBot(bool: boolean): void;
    viewLeft(bool: boolean): void;
    viewRight(bool: boolean): void;
    get active(): boolean;
    set active(active: boolean);
    hexToRgb(hex: any): {
        r: number;
        g: number;
        b: number;
    };
    hex2hsl(hex: any): number[];
    rgb2hsl(r: number, g: number, b: number): number[];
    changeColor(color: any): "#000000" | "#FFFFFF";
}

declare class Model {
    readonly context: BimatterViewer;
    readonly modelID: number;
    readonly threeGeometry: Group;
    grids: ModelGrids | undefined;
    boundingBox: Box3;
    properties: Properties;
    state: State;
    defaultState: DefaultState;
    activeElements: Set<number>;
    _showGrids: boolean;
    get showGrids(): boolean;
    set showGrids(bool: boolean);
    constructor(context: BimatterViewer, modelID: number, fitToView: boolean | undefined, threeGeometry: Group, propsData: PropsData, structure: Structure, indMap?: {
        [matId: number]: number[];
    }, idsMap?: {
        [matId: number]: number[];
    }, defIndMap?: {
        [matId: number]: number[];
    }, defIdsMap?: {
        [matId: number]: number[];
    }, start?: number);
    private getBoundingBox;
    private cloneGeometry;
    private getSelectionGeom;
    setState(state: State, defaultState: DefaultState, activeElements?: Set<number>): void;
    private getGeometryState;
    private updateBox;
    fitToView(enableTransition?: boolean): Promise<void>;
    addMeshToModel(mesh: Mesh, selectGroup: Group, preselectGroup: Group, fitToView?: boolean): void;
    setupGrids(gridsData: {
        [id: string]: GridData;
    }): void;
}

type TModels = {
    [modelID: number]: Model;
};
interface ViewerSettings {
    useDefaultTexture?: boolean;
    container?: HTMLElement;
}

type TLookAt = (target: Vector3) => void;
type TSetPosition = (position: Vector3) => void;

declare class Camera {
    readonly context: Context;
    readonly threeCamera: PerspectiveCamera | OrthographicCamera;
    constructor(context: Context, fov: number, near: number, far: number);
    lookAt: TLookAt;
    setPosition: TSetPosition;
}

declare class DragControls extends EventDispatcher<any> {
    constructor(_objects: any, _camera: any, _domElement: any);
    defaultActive: boolean;
    enabled: boolean;
    transformGroup: boolean;
    activate: () => void;
    deactivate: () => void;
    dispose: () => void;
    getObjects: () => any;
    getRaycaster: () => Raycaster;
}

declare const modeEnum: {
    Orthographic: number;
    Perspective: number;
    "1stPerson": number;
    "3rdPerson": number;
};
declare class Controls {
    readonly context: Context;
    readonly cameraControl: CameraControls;
    readonly raycaster: three.Raycaster;
    private _moving;
    private _position;
    private _activeMode;
    private _activeModeKeyUpEvents;
    private _activeModeKeyDownEvents;
    private _activeModeRendererEvent;
    settings: {
        speed: number;
        rotateSpeed: number;
        upSpeed: number;
        polarRotateSpeed: number;
        azimuthRotateSpeed: number;
    };
    get activeMode(): keyof typeof modeEnum;
    set activeMode(mode: keyof typeof modeEnum);
    constructor(context: Context);
    get moving(): boolean;
    set moving(moving: boolean);
    readonly createDragControl: (objects: three.Object3D[]) => DragControls;
    private getIntersect;
    readonly getIntersects: (objects?: three.Object3D[]) => three.Intersection<three.Object3D<three.Object3DEventMap>>[];
    private checkIntersect;
    private addEvents;
    private onControl;
    private _onControl;
    setOrbitByClick(): void;
    setOrbitByTarget(target: three.Vector3): void;
}

declare class Sizes {
    readonly context: Context;
    width: number;
    height: number;
    modelSize: Box3;
    constructor(context: Context);
    resize(): void;
}

declare class Environment {
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

declare class Postproduction {
    readonly context: Context;
    private _castShadow;
    constructor(context: Context);
    set castShadow(castShadow: boolean);
}

declare class Renderer {
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

declare class Scene {
    readonly context: Context;
    readonly threeScene: three.Scene;
    constructor(context: Context, useDefaultTexture?: boolean);
}

declare class Context {
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
    readonly clock: Clock;
    readonly mouseMoveHandleBind: (event: MouseEvent) => void;
    constructor(context: BimatterViewer, settings: ViewerSettings);
    private mouseMoveHandle;
    resizeViewer(width?: string, height?: string): void;
}

type onLoadCallbackT = (arg: LoadingState) => Promise<void>;
interface LoadingState {
    type: string;
    total: number;
    current: number;
    step: number;
}

declare class LoadingProgressUtils {
    readonly context: Loaders;
    onLoadCallback: onLoadCallbackT | undefined;
    progressStep: number;
    htmlElement: HTMLElement | undefined;
    private loadingState;
    constructor(context: Loaders);
    setContainer(htmlElement: HTMLElement): void;
    setOnLoadCallback(onLoadCallback?: onLoadCallbackT): void;
    initializeLoadingState(type: string, total: number): void;
    updateLoadingState(type: string): Promise<void>;
    endLoading(type: string): void;
}

declare class IFCLoader {
    readonly context: Loaders;
    useIfcElemetAssembly: boolean;
    useIfcColors: boolean;
    private parser;
    private propertySerializer;
    private _wasmPath;
    chunk: number;
    private curModelId;
    constructor(context: Loaders);
    getPath(path: string, dir: string): string;
    initParser(func?: any): Promise<void>;
    set wasmPath(path: string);
    get _parser(): IfcAPI;
    set _parser(parser: IfcAPI);
    loadModel(path: string, fitToView?: boolean, onLoadCallback?: onLoadCallbackT): Promise<Model | undefined>;
    getModelData(path: string): Promise<{
        structure: Structure;
        propsData: PropsData;
        group: Group;
        modelID: number;
        grids: {
            [key: string]: GridData;
        };
    }>;
    getModelDataFromBuffer(file: ArrayBuffer): Promise<false | {
        structure: {
            id: any;
            type: string;
            name: any;
            children: never[];
        };
        propsData: PropsData;
        group: Group<three.Object3DEventMap>;
        modelID: number;
        grids: {
            [key: number]: GridData;
        };
    }>;
}

declare class BMTLoader {
    readonly context: Loaders;
    curMatrix: Matrix4;
    textDecoder: TextDecoder;
    constructor(context: Loaders);
    streamToBlob(data: Blob, start: number): Promise<Blob>;
    loadModel(path: string, fitToView?: boolean): Promise<Model | undefined>;
    private decodeBuffer;
    private parseMesh;
    private parseBinaryFile;
}

interface ExportBmtProps {
    modelID?: number;
    propsData?: PropsData;
    structure?: Structure;
    group?: Group;
    fileName?: string;
    activeView?: boolean;
    minVersion?: boolean;
    start: number;
    grids?: {
        [key: string]: GridData;
    };
}
declare class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(data: ArrayBuffer, useMinVersion?: boolean, wasmPath?: string): Promise<{
        data: Blob;
        props: string | undefined;
    } | undefined>;
    private jsonStringifySync;
    exportIfcModel(modelID: number, activeView?: boolean, minVersion?: boolean, fileName?: string, grids?: any): Promise<{
        data: Blob;
        props: string | undefined;
    }>;
    writeUint32(value: number): Uint8Array;
    writeChunk(type: number, data: Uint8Array): Uint8Array[];
    exportBMT(config: ExportBmtProps): Promise<{
        data: Blob;
        props: string | undefined;
    }>;
}

declare class Loaders {
    readonly context: BimatterViewer | BimatterConverter;
    readonly bmtLoader: BMTLoader;
    readonly ifcLoader: IFCLoader;
    readonly bmtConverter: BMTConverter;
    readonly loadingProgressUtils: LoadingProgressUtils;
    coordinationMatrix: Matrix4 | undefined;
    constructor(context: BimatterViewer | BimatterConverter);
}

declare class Selection {
    readonly context: Selector;
    _active: boolean;
    _selectedMesh: Group;
    _useSelectBind: (e: MouseEvent) => void;
    _activeFace: number;
    _activeElement: number;
    _selectionCallback: ((arg?: any) => any) | null;
    state: {
        [modelID: number]: {
            [matId: number]: BufferGeometry;
        };
    };
    constructor(context: Selector);
    get selectionCallback(): (() => any) | null;
    set selectionCallback(func: (() => any) | null);
    get selectedMesh(): Group<three.Object3DEventMap>;
    get active(): boolean;
    set active(active: boolean);
    private useSelect;
    readonly resetModelSelection: (modelID: number) => void;
    readonly resetSelect: (full?: boolean) => void;
    readonly selectAll: () => void;
    readonly selectByIds: (modelID: number, ids: number[], removePrevious?: boolean) => void;
    readonly removeSelectByIds: (modelID: number, ids: number[]) => void;
}

interface PreselectState {
    [modelID: number]: {
        [matId: number]: BufferGeometry;
    };
}
declare class PreSelection {
    readonly context: Selector;
    private _active;
    private _usePreSelectBind;
    _preSelectMesh: Group;
    private _activeElement;
    private _activeFace;
    private _activePoint;
    private _activeModelID;
    private _intersectLength;
    private _intersectDistance;
    private _needUpdate;
    private deep;
    state: PreselectState;
    constructor(context: Selector);
    get preSelectElement(): {
        mesh: Group<three.Object3DEventMap>;
        elementID: number;
        modelID: number;
        point: Vector3;
        distance: number;
    } | null;
    get setDeep(): number;
    private usePreSelect;
    readonly resetPreselect: () => void;
    get active(): boolean;
    set active(active: boolean);
}

type ToolMode = "lasso" | "box";
type SelectionMode = "intersection" | "centroid-visible" | "centroid";
interface SelectionBoxParam {
    toolMode: ToolMode;
    selectionMode: SelectionMode;
    liveUpdate: boolean;
    resetPrevous: boolean;
}
declare class SelectionBox {
    readonly context: Selector;
    params: SelectionBoxParam;
    isMouseDown: boolean;
    isAdd: boolean;
    isFullElementInside: boolean;
    selectionShape: Line;
    selectionPoints: number[];
    dragging: boolean;
    selectionShapeNeedsUpdate: boolean;
    selectionNeedsUpdate: boolean;
    invWorldMatrix: Matrix4;
    camLocalPosition: Vector3;
    tempRay: Ray;
    centroid: Vector3;
    screenCentroid: Vector3;
    faceNormal: Vector3;
    usePreselectionState: boolean;
    toScreenSpaceMatrix: Matrix4;
    helper: HTMLElement;
    boxPoints: Vector3[];
    boxLines: Line3[];
    lassoSegments: Line3[];
    perBoundsSegments: any[];
    renderSelectionBind: () => void;
    constructor(context: Selector, cssClassName?: string);
    private reset;
    private isPlus;
    private renderSelection;
    private updateSelection;
    private getConvexHull;
    private pointRayCrossesLine;
    private pointRayCrossesSegments;
    private lineCrossesLine;
}

declare class Selector {
    readonly context: BimatterViewer;
    readonly selMaterial: MeshLambertMaterial;
    readonly preSelMaterial: MeshLambertMaterial;
    selectedElements: {
        [modelID: number]: Set<number>;
    };
    isSelected: boolean;
    readonly selectorModels: {
        [modelID: number]: Object3D<Object3DEventMap>[];
    };
    private _usePreSelection;
    private _selection;
    private _preSelection;
    readonly selectionBox: SelectionBox;
    constructor(context: BimatterViewer);
    get useDoubleSideMaterial(): boolean;
    set useDoubleSideMaterial(bool: boolean);
    set usePreSelection(usePreSelection: boolean);
    set useSelection(useSelection: boolean);
    get usePreSelection(): boolean;
    get useSelection(): boolean;
    get preSelection(): PreSelection;
    get selection(): Selection;
}

type GeometryChunkConfig = {
    modelID: number;
    material?: Material;
    color?: Color | string;
    ids: number[];
    removePrevious?: boolean;
    chunkID?: string;
};
type TDecoder = typeof pako;
type OSType = "Mac" | "IOS" | "Windows" | "Linux" | "Android" | "unknown";

declare class GeometryUtils {
    readonly context: Utils;
    constructor(context: Utils);
    readonly hideSelectedElements: () => void;
    readonly isolateSelectedElements: () => void;
    readonly hideElementsByIds: (modelID: number, ids: number[]) => void;
    readonly isolateElementsByIds: (modelID: number, ids: number[]) => void;
    private update;
    readonly showAll: () => void;
    private resetModelVisibility;
    readonly createGeometryChunk: (config: GeometryChunkConfig) => Error | undefined;
    resetAllModelsChunks(): void;
    resetModelChunks(modelID: number): void;
}

declare class PropsUtils {
    readonly context: Utils;
    propConteiner: HTMLElement | undefined;
    useDefaultGetPropertiesById: boolean;
    constructor(context: Utils);
    private _getPropertiesByIdOveride;
    getPropertiesById(modelID?: number, elementId?: number): any;
    setGetParamsByIdOverride(func: ((modelID?: number, elementId?: number, ...args: any) => any) | undefined, returnExSelection?: boolean): void;
    initPropConteiner(conteiner: HTMLElement): void;
    private generatePropsThree;
}

declare class PlaneHelper extends Object3D {
    readonly context: ClippingUtils;
    readonly plane: Plane;
    private location;
    helper: Group;
    active: boolean;
    dragControl: DragControls;
    material: MeshBasicMaterial;
    thickness: number;
    private _deltaVector;
    constructor(context: ClippingUtils, plane: Plane, location: Vector3, normal: Vector3);
    addDragControlEvents(): void;
    removeDragControlEvents(): void;
    private dragStart;
    private drag;
    private dragEnd;
    private hoverOn;
    private hoverOff;
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    private getHelperGeometry;
    customArrow(): void;
}

declare class ClippingEdges extends Object3D {
    readonly context: ClippingUtils;
    readonly plane: Plane;
    active: boolean;
    private lines;
    private tempVector;
    private tempVector1;
    private tempVector2;
    private tempVector3;
    private tempLine;
    private localPlane;
    material: LineBasicMaterial;
    constructor(context: ClippingUtils, plane: Plane);
    dispose(): void;
    toggle(): void;
    private removeFromView;
    private addToView;
    create(): Group<three.Object3DEventMap>;
    createByModel(modelID: number, res?: Group): void;
    update(): void;
}

declare class ClippingUtils {
    readonly context: Utils;
    planes: Plane[];
    active: boolean;
    _edgesActive: boolean;
    _helpersActive: boolean;
    edges: ClippingEdges[];
    heplers: PlaneHelper[];
    constructor(context: Utils);
    updateMaterials(modelID?: number): void;
    private updateMaterial;
    createPlane(): Plane | undefined;
    private createPlaneHelper;
    deleteAllPlanes(): void;
    toggle(): void;
    updateEdges(): void;
    get helpersActive(): boolean;
    set helpersActive(helpersActive: boolean);
    get edgesActive(): boolean;
    set edgesActive(edgesActive: boolean);
}

declare class ViewCubeContainer {
    readonly context: Utils;
    _active: boolean;
    boundingSphere: Sphere | null;
    cubeContainer: HTMLElement | undefined;
    htmlCube: HTMLElement | null;
    constructor(context: Utils);
    get active(): boolean;
    set active(bool: boolean);
    private epsilon;
    private getCameraCSSMatrix;
    private animate;
    switchPick(name: string): void;
    private hoverFunc;
    private unHoverFunc;
    updateBoundingSphere(): void;
    private create;
}

declare class DimensionLine {
    readonly context: DimensionsUtils;
    static scaleFactor: number;
    static scale: number;
    static units: string;
    root: Group | null;
    endpointMeshes: Mesh[];
    scale: Vector3;
    boundingSize: number;
    labelClassName: string;
    length: number;
    center: Vector3;
    axis: BufferGeometry | null;
    line: Line | null;
    textLabel: CSS2DObject | null;
    boundingMesh: Mesh | null;
    start: Vector3;
    end: Vector3;
    lineMaterial: LineDashedMaterial | null;
    endpointMaterial: MeshBasicMaterial | null;
    endpoint: ConeGeometry | null;
    className: string;
    constructor(context: DimensionsUtils, start: Vector3, end: Vector3, lineMaterial: LineDashedMaterial, endpointMaterial: MeshBasicMaterial, endpoint: ConeGeometry, className: string, endpointScale: Vector3);
    dispose(): void;
    get boundingBox(): Mesh<BufferGeometry<three.NormalBufferAttributes>, three.Material | three.Material[], three.Object3DEventMap> | null;
    get text(): any;
    set dimensionColor(dimensionColor: Color);
    set visibility(visible: boolean);
    set endpointGeometry(geometry: ConeGeometry);
    set endpointScale(scale: Vector3);
    set endPoint(point: Vector3);
    removeFromScene(): void;
    createBoundingBox(): void;
    rescaleObjectsToCameraPosition(): void;
    rescaleMesh(mesh: Mesh, scalefactor?: number, x?: boolean, y?: boolean, z?: boolean): void;
    addEndpointMeshes(): void;
    newEndpointMesh(position: Vector3, direction: Vector3): void;
    newText(): any;
    getTextContent(): string;
    newBoundingBox(): Mesh<BoxGeometry, three.Material | three.Material[], three.Object3DEventMap>;
    setupBoundingBox(end: Vector3): void;
    getLength(): number;
    getCenter(): Vector3;
}

declare class DimensionsUtils {
    readonly context: Utils;
    dimensions: DimensionLine[];
    labelClassName: string;
    previewClassName: string;
    enabled: boolean;
    preview: boolean;
    dragging: boolean;
    snapDistance: number;
    baseScale: Vector3;
    lineMaterial: LineDashedMaterial;
    endpointsMaterial: MeshBasicMaterial;
    startPoint: Vector3;
    endPoint: Vector3;
    endpoint: ConeGeometry | null;
    previewElement: CSS2DObject | null;
    currentDimension: DimensionLine | null;
    found: Vector3 | undefined;
    curAxis: string | null;
    measureInPros: boolean;
    measureStart: boolean;
    measureObject: CSS2DObject;
    private _selectionState;
    drawInProcessEvent_binded: (e: MouseEvent) => void;
    dimensionsClickEventHandle_binded: () => void;
    constructor(context: Utils);
    private dispose;
    private update;
    private setPreviewElement;
    get active(): boolean;
    get previewActive(): boolean;
    get previewObject(): any;
    set previewActive(state: boolean);
    set active(state: boolean);
    set dimensionsColor(color: Color);
    set dimensionsWidth(width: number);
    set endpointGeometry(geometry: ConeGeometry);
    set endpointScaleFactor(factor: number);
    set endpointScale(scale: Vector3);
    create(): void;
    createInPlane(plane: Plane): void;
    delete(): void;
    deleteAll(): void;
    cancelDrawing(): void;
    setDimensionUnit(units: typeof DimensionLine.units): void;
    private drawStart;
    private drawStartInPlane;
    private drawInProcess;
    private drawEnd;
    get getDimensionsLines(): DimensionLine[];
    drawDimension(): DimensionLine;
    getBoundingBoxes(): (Mesh<BufferGeometry<three.NormalBufferAttributes>, three.Material | three.Material[], three.Object3DEventMap> | null)[];
    static getDefaultEndpointGeometry(height?: number, radius?: number): ConeGeometry;
    private getClosestVertex;
    private getVertices;
    private getVertex;
    changeAxes(): void;
    drawInProcessEvent(e: MouseEvent): void;
    setDimentionVisibility(bool: boolean): void;
    dimentionsClickEventHandle(): void;
    toggleDimentionsActive(): void;
}

declare class OsUtils {
    readonly context: Utils;
    OS: OSType;
    constructor(context: Utils);
    getOS(): OSType;
    private setMobileSettings;
}

declare class KeysUtils {
    readonly context: Utils;
    constructor(context: Utils);
    isRemoveSelectionKey(e: KeyboardEvent | MouseEvent): boolean;
    isMultySelect(e: KeyboardEvent | MouseEvent): boolean;
    isBoxSelect(e: KeyboardEvent | MouseEvent): boolean;
}

declare class Utils {
    readonly context: BimatterViewer;
    readonly propsUtils: PropsUtils;
    readonly geometryUtils: GeometryUtils;
    readonly clippingUtils: ClippingUtils;
    readonly dimentionsUtils: DimensionsUtils;
    readonly navigationCubeUtil: ViewCubeContainer;
    readonly decoder: TDecoder;
    readonly osUtils: OsUtils;
    readonly keysUtils: KeysUtils;
    readonly gui: GUI;
    stats: Stats | undefined;
    constructor(context: BimatterViewer);
    set useStats(useStats: boolean);
    disposeMeshRecursively(mesh: any): void;
}

declare class BimatterViewer {
    readonly loaders: Loaders;
    readonly models: TModels;
    readonly context: Context;
    readonly bvhManager: BvhManager;
    readonly selector: Selector;
    readonly utils: Utils;
    readonly container: HTMLElement;
    settings: ViewerSettings;
    constructor(settings?: ViewerSettings);
    addEmptyModel(modelID: number): Model;
    loadModel(arg1: string | File, fitToView?: boolean, onLoadCallback?: onLoadCallbackT): Promise<Model | undefined>;
    removeModel(modelID: number): void;
    dispose(): void;
}
declare class BimatterConverter {
    readonly loaders: Loaders;
    readonly utils: any;
    readonly models: any;
    constructor();
}

export { BimatterConverter, type DefaultState, type GeometryChunkConfig, type IModelData, type LoadingState, type OSType, type PosData, type PropData, type PropsData, type State, type Structure, type TDecoder, type TModels, type TfitToViewFunc, type ViewerSettings, BimatterViewer as default, type onLoadCallbackT };
