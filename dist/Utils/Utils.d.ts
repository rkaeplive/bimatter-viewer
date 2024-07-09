/// <reference types="stats.js" />
import BimatterViewer from "..";
import { GeometryUtils } from "./GeometryUtils";
import { PropsUtils } from "./PropsUtils";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { ClippingUtils } from "./ClippingUtils/ClippingUtils";
import { ViewCubeContainer } from "./NavigationCube/NavigationCube";
import { TDecoder } from "./Utils.types";
import { DimensionsUtils } from "./DimentionsUtils/DimentionsUtils";
import { OsUtils } from "./OsUtils";
import { KeysUtils } from "./KeysUtils/KeysUtils";
export declare class Utils {
    readonly context: BimatterViewer;
    readonly propsUtils: PropsUtils;
    readonly geometryUtils: GeometryUtils;
    readonly clippingUtils: ClippingUtils;
    readonly dimentionsUtils: DimensionsUtils;
    readonly navigationCubeUtil: ViewCubeContainer;
    readonly decoder: TDecoder;
    readonly osUtils: OsUtils;
    readonly keysUtils: KeysUtils;
    stats: Stats | undefined;
    constructor(context: BimatterViewer);
    set useStats(useStats: boolean);
    disposeMeshRecursively(mesh: any): void;
}
