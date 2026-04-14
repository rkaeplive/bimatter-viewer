import { Matrix4 } from "three";
import BimatterViewer, { BimatterConverter } from "..";
import { IFCLoader } from "./IFCLoader/IFCLoader";
import { LoadingProgressUtils } from "./LoadingProgressUtils/LoadingProgressUtils";
import { BMTLoader } from "./BMTLoader/BMTLoader";
import { BMTConverter } from "./BMTConverter/BMTConverter";
export declare class Loaders {
    readonly context: BimatterViewer | BimatterConverter;
    readonly bmtLoader: BMTLoader;
    readonly ifcLoader: IFCLoader;
    readonly bmtConverter: BMTConverter;
    readonly loadingProgressUtils: LoadingProgressUtils;
    coordinationMatrix: Matrix4 | undefined;
    constructor(context: BimatterViewer | BimatterConverter);
}
