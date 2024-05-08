/// <reference types="stats.js" />
import BimatterViewer from "..";
import GeometryUtils from "./GeometryUtils";
import PropsUtils from "./PropsUtils";
import Stats from "three/examples/jsm/libs/stats.module.js";
import ClippingUtils from "./ClippingUtils/ClippingUtils";
import NavigationCube from "./NavigationCube/NavigationCube";
import ExportUtils from "./ExportUtils";
import { TDecoder } from "./Utils.types";
import { DimensionsUtils } from "./DimentionsUtils/DimentionsUtils";
export default class Utils {
    readonly context: BimatterViewer;
    readonly propsUtils: PropsUtils;
    readonly geometryUtils: GeometryUtils;
    readonly clippingUtils: ClippingUtils;
    readonly dimentionsUtils: DimensionsUtils;
    readonly navigationCubeUtil: NavigationCube;
    readonly exportUtils: ExportUtils;
    readonly decoder: TDecoder;
    stats: Stats | undefined;
    constructor(context: BimatterViewer);
    set useStats(useStats: boolean);
    disposeMeshRecursively(mesh: any): void;
}
