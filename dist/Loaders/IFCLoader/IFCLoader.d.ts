import Loaders from "../Loaders";
import { IfcAPI } from "web-ifc";
export default class IFCLoader {
    readonly context: Loaders;
    private parser;
    private propertySerializer;
    constructor(context: Loaders);
    get _parser(): IfcAPI;
    loadModel(path: string, fitToView?: boolean): Promise<unknown>;
}
