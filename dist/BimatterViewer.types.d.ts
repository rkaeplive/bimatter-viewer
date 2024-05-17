import Model from "./Model/Model";
export type TModels = {
    [modelID: number]: Model;
};
export interface ViewerSettings {
    useDefaultTexture?: boolean;
    container?: HTMLElement;
}
