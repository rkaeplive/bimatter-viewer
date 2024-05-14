import Utils from "./Utils";
export default class PropsUtils {
    readonly context: Utils;
    propConteiner: HTMLElement | undefined;
    constructor(context: Utils);
    private _getPropertiesByIdFunction;
    private _getPropertiesById;
    get getPropertiesById(): typeof this._getPropertiesById;
    set getPropertiesById(func: typeof this._getPropertiesById);
    initPropConteiner(conteiner: HTMLElement): void;
    private generatePropsThree;
}
