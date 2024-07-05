import { Model } from "../Model";
import { PropsData, Structure } from "../Model.types";
export declare class Properties {
    readonly context: Model;
    data: PropsData;
    structure: Structure;
    hasProperties: boolean;
    constructor(context: Model, data: PropsData, structure: Structure);
    loadStructure(path: string): void;
    setStructure(structure: Structure): void;
    loadProperties(path: string): void;
    setProperties(properties: PropsData): void;
}
