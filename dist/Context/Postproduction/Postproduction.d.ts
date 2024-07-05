import { Context } from "../Context";
export declare class Postproduction {
    readonly context: Context;
    private _castShadow;
    constructor(context: Context);
    set castShadow(castShadow: boolean);
}
