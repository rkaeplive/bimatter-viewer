import { Group, LineBasicMaterial, Vector3 } from "three";
import { GridData } from "../../Loaders/IFCLoader/IfcGrid";
import { Model } from "../Model";
export declare class ModelGrids {
    readonly context: Model;
    topTags: any[];
    botTags: any[];
    leftTags: any[];
    rightTags: any[];
    _active: boolean;
    grids: any[];
    color: string;
    material: LineBasicMaterial;
    mesh: Group;
    constructor(context: Model, grids: {
        [key: string]: GridData;
    });
    init(): Promise<void>;
    addGrid(gridGroup: Group, data: any, locCoordinates: Vector3, type: string, lowY: Vector3): void;
    viewTop(bool: boolean): void;
    viewBot(bool: boolean): void;
    viewLeft(bool: boolean): void;
    viewRight(bool: boolean): void;
    get active(): boolean;
    set active(active: boolean);
    hexToRgb(hex: any): {
        r: number;
        g: number;
        b: number;
    };
    hex2hsl(hex: any): number[];
    rgb2hsl(r: number, g: number, b: number): number[];
    changeColor(color: any): "#000000" | "#FFFFFF";
}
