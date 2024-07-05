import { Loaders } from "../Loaders";
import { onLoadCallbackT } from "../Loaders.types";
export declare class LoadingProgressUtils {
    readonly context: Loaders;
    onLoadCallback: onLoadCallbackT | undefined;
    progressStep: number;
    private loadingState;
    constructor(context: Loaders);
    setOnLoadCallback(onLoadCallback?: onLoadCallbackT): void;
    initializeLoadingState(type: string, total: number): void;
    updateLoadingState(type: string): void;
    endLoading(type: string): void;
}
