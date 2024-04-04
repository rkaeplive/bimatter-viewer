import IFCLoader from "./IFCLoader";
export default class PropertySerializer {
    readonly context: IFCLoader;
    constructor(context: IFCLoader);
    serializeAllProperties(modelID: number): Promise<any>;
    getPropertiesAsBlobs(modelID: number, maxSize?: number, event?: any): Promise<any>;
    getItemProperty(modelID: number, id: number, flatten?: boolean): Promise<any>;
    private formatItemProperties;
    private getAllRelDefinesByProps;
}
