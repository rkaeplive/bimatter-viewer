import Utils from "./Utils";
export default class PropsUtils {
    readonly context: Utils;
    propConteiner: HTMLElement | undefined;
    constructor(context: Utils);
    getPropertiesById(modelID: number, elementId: number): void;
    initPropConteiner(conteiner: HTMLElement): void;
    private generatePropsThree;
}
