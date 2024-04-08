import { Group } from "three";
import Loaders from "../Loaders";
import { PropsData } from "../../Model/Model.types";
export default class BMTConverter {
    readonly context: Loaders;
    constructor(context: Loaders);
    convertIfcToBmt(arg1: string | File): Promise<void>;
    private jsonStringifySync;
    exportBMT(propsData: PropsData, group: Group, fileName: string, start: number): Promise<void>;
}
