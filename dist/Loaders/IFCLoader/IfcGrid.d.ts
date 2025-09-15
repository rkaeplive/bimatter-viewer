import { IfcAPI } from "./IFCParser/web-ifc-api";
export interface GridData {
    loc: {
        x: number;
        y: number;
        z: number;
    };
    points: {
        u: {};
        v: {};
    };
}
export declare class Grid {
    parser: IfcAPI;
    grid: number;
    modelID: number;
    constructor(parser: IfcAPI, modelID: number, grid: number);
    getCurValue(prop: any): any;
    init(): Promise<GridData | undefined>;
}
