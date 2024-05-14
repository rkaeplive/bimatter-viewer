import { PropData } from "../Model/Model.types";
import Utils from "./Utils";
export default class PropsUtils {
    readonly context: Utils;
    propConteiner: HTMLElement | undefined;
    useDefaultGetPropertiesById: boolean;
    constructor(context: Utils);
    private _getPropertiesByIdOveride;
    getPropertiesById(modelID: number, elementId: number): PropData | undefined;
    setGetParamsByIdOverride(func: ((modelID: number, elementId: number, ...args: any) => any) | undefined): void;
    initPropConteiner(conteiner: HTMLElement): void;
    private generatePropsThree;
}
