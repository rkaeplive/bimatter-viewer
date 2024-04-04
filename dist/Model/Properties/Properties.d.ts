import Model from "../Model";
import { PropsData } from "../Model.types";
export default class Properties {
    readonly context: Model;
    readonly data: PropsData;
    constructor(context: Model, data: PropsData);
}
