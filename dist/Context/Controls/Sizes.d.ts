import { Box3 } from "three";
import { Context } from "../Context";
export declare class Sizes {
    readonly context: Context;
    width: number;
    height: number;
    modelSize: Box3;
    constructor(context: Context);
    resize(): void;
}
