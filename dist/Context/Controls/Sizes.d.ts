import Context from "../Context";
export default class Sizes {
    readonly context: Context;
    width: number;
    height: number;
    modelSize: THREE.Box3;
    constructor(context: Context);
}
