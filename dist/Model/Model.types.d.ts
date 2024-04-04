import { TypedArray } from "three";
import { IElementData, IFaceData, IMaterialData } from "../Loaders/BMTLoader/BMTLoader.types";
export type TfitToViewFunc = () => void;
export interface IModelData {
    facesMap: {
        [faceId: number]: IFaceData;
    };
    elementsMap: {
        [elementId: number]: IElementData;
    };
    materialsMap: {
        [materialId: number]: IMaterialData;
    };
}
export type State = {
    indMap: {
        [matId: number]: TypedArray;
    };
    idsMap: {
        [elemId: number]: {
            [matId: number]: number[];
        };
    };
    needsUpdate: Set<number>;
};
export type DefaultState = {
    indMap: {
        [matId: number]: TypedArray;
    };
    idsMap: {
        [elemId: number]: {
            [matId: number]: number[];
        };
    };
    selMap: {
        [elemId: number]: number[];
    };
};
export type PropsData = {
    [element: number]: any;
};
