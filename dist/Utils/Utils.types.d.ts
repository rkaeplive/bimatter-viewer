import { Color } from "three";
import pako from "./Decoder/decoder";
export type GeometryChunkConfig = {
    modelID: number;
    material?: THREE.Material;
    color?: Color | string;
    ids: number[];
    removePrevious?: boolean;
    chunkID?: string;
};
export type TDecoder = typeof pako;
