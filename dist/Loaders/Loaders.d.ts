import { Matrix4 } from "three";
import BimatterViewer, { BimatterConverter } from "..";
import { BMTConverter } from "./BMTConverter/BMTConverter";
import { BMTLoader } from "./BMTLoader/BMTLoader";
import { IFCLoader } from "./IFCLoader/IFCLoader";
import { LoadingProgressUtils } from "./LoadingProgressUtils/LoadingProgressUtils";
export declare class Loaders {
    readonly context: BimatterViewer | BimatterConverter;
    readonly bmtLoader: BMTLoader;
    readonly ifcLoader: IFCLoader;
    readonly bmtConverter: BMTConverter;
    readonly loadingProgressUtils: LoadingProgressUtils;
    coordinationMatrix: Matrix4 | undefined;
    constructor(context: BimatterViewer | BimatterConverter);
}
