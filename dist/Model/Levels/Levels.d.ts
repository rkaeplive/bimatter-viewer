import { Model } from "../Model";
import { PropsData, Structure } from "../Model.types";
export declare class Levels {
    readonly context: Model;
    levelIds: number[];
    constructor(context: Model);
    initLevelsIds(structure: Structure): void;
    buildLevels(props: PropsData): void;
}
