import Model from "../Model";
import { PropsData, Structure } from "../Model.types";
export default class Properties {
    readonly context: Model;
    readonly data: PropsData;
    readonly structure: Structure;
    constructor(context: Model, data: PropsData, structure: Structure);
}
