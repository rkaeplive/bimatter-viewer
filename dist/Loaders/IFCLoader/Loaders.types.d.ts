export type onLoadCallbackT = (arg: LoadingState) => void;
export interface LoadingState {
    type: string;
    total: number;
    current: number;
    step: number;
}
