import Context from "../Context";
export default class Postproduction {
    readonly context: Context;
    private _castShadow;
    constructor(context: Context);
    set castShadow(castShadow: boolean);
}
