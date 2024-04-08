import BimatterViewer from "..";
import BMTConverter from "./BMTConverter/BMTConverter";
import BMTLoader from "./BMTLoader/BMTLoader";
import IFCLoader from "./IFCLoader/IFCLoader";
export default class Loaders {
    readonly context: BimatterViewer;
    readonly bmtLoader: BMTLoader;
    readonly ifcLoader: IFCLoader;
    readonly bmtConverter: BMTConverter;
    constructor(context: BimatterViewer);
}
