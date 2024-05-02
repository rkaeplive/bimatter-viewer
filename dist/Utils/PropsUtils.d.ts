import { PropData } from "../Model/Model.types";
import Utils from "./Utils";
export default class PropsUtils {
    readonly context: Utils;
    propConteiner: HTMLElement | undefined;
    constructor(context: Utils);
    getPropertiesById(modelID: number, elementId: number): PropData | undefined;
    initPropConteiner(conteiner: HTMLElement): void;
    private generatePropsThree;
}
