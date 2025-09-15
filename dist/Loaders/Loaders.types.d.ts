export type onLoadCallbackT = (arg: LoadingState) => Promise<void>;
export interface LoadingState {
    type: string;
    total: number;
    current: number;
    step: number;
}
