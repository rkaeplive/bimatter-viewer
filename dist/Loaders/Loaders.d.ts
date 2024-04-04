import BimatterViewer from "..";
import BMTLoader from "./BMTLoader/BMTLoader";
import IFCLoader from "./IFCLoader/IFCLoader";
export default class Loaders {
    readonly context: BimatterViewer;
    readonly bmtLoader: BMTLoader;
    readonly ifcLoader: IFCLoader;
    constructor(context: BimatterViewer);
}
