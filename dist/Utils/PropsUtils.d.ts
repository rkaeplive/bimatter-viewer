import { Utils } from "./Utils";
export declare class PropsUtils {
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
