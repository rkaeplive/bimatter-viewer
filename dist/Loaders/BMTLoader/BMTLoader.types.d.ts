import Model from "../../Model/Model";
export type TLoadModelFunction = (path: string, fitToView?: boolean) => Promise<Model>;
export interface Imaterial {
    color: Array<number>;
    opacity: TOpacity;
}
export interface IFaceData {
    vert: number[];
    mat: TMaterialId;
    par: number;
}
export interface IElementData {
    guid: string;
}
export interface IMaterialData {
    col: TMaterialColor;
    a: number;
    face: number[];
    name: string;
}
type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;
type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
type TMaterialColor = IntRange<0, 255>[];
type TMaterialId = number;
type TOpacity = number;
export {};
