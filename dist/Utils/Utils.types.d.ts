import { Color, Material } from "three";
import pako from "./Decoder/decoder";
export type GeometryChunkConfig = {
    modelID: number;
    material?: Material;
    color?: Color | string;
    ids: number[];
    removePrevious?: boolean;
    chunkID?: string;
};
export type TDecoder = typeof pako;
export type OSType = "Mac" | "IOS" | "Windows" | "Linux" | "Android" | "unknown";
