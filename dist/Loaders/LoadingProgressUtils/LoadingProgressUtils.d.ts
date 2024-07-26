import { Loaders } from "../Loaders";
import { onLoadCallbackT } from "../Loaders.types";
export declare class LoadingProgressUtils {
    readonly context: Loaders;
    onLoadCallback: onLoadCallbackT | undefined;
    progressStep: number;
    htmlElement: HTMLElement | undefined;
    private loadingState;
    constructor(context: Loaders);
    setContainer(htmlElement: HTMLElement): void;
    setOnLoadCallback(onLoadCallback?: onLoadCallbackT): void;
    initializeLoadingState(type: string, total: number): void;
    updateLoadingState(type: string): Promise<void>;
    endLoading(type: string): void;
}
