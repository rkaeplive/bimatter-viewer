export class BooleanController extends Controller {
    constructor(parent: any, object: any, property: any);
    $input: HTMLInputElement;
    $disable: HTMLInputElement;
    updateDisplay(): this;
}
export class ColorController extends Controller {
    constructor(parent: any, object: any, property: any, rgbScale: any);
    $input: HTMLInputElement;
    $text: HTMLInputElement;
    $display: HTMLDivElement;
    _format: {
        isPrimitive: boolean;
        match: (v: any) => boolean;
        fromHexString: typeof normalizeColorString;
        toHexString: typeof normalizeColorString;
    } | {
        isPrimitive: boolean;
        match: (v: any) => boolean;
        fromHexString(string: any, target: any, rgbScale?: number): void;
        toHexString([r, g, b]: [any, any, any], rgbScale?: number): string;
    } | {
        isPrimitive: boolean;
        match: (v: any) => boolean;
        fromHexString(string: any, target: any, rgbScale?: number): void;
        toHexString({ r, g, b }: {
            r: any;
            g: any;
            b: any;
        }, rgbScale?: number): string;
    } | undefined;
    _rgbScale: any;
    _initialValueHexString: string | boolean;
    _textFocused: boolean;
    $disable: HTMLInputElement;
    reset(): this;
    _setValueFromHexString(value: any): void;
    save(): string | false;
    load(value: any): this;
    updateDisplay(): this;
}
export class Controller {
    constructor(parent: any, object: any, property: any, className: any, elementType?: string);
    parent: GUI;
    object: object;
    property: string;
    _disabled: boolean;
    _hidden: boolean;
    initialValue: any;
    domElement: HTMLElement;
    $name: HTMLElement;
    $widget: HTMLElement;
    $disable: HTMLElement;
    _listenCallback(): void;
    name(name: string): this;
    _name: string | undefined;
    onChange(callback: Function): this;
    _onChange: Function | undefined;
    protected _callOnChange(): void;
    _changed: boolean | undefined;
    onFinishChange(callback: Function): this;
    _onFinishChange: Function | undefined;
    protected _callOnFinishChange(): void;
    reset(): this;
    enable(enabled?: boolean): this;
    disable(disabled?: boolean): this;
    show(show?: boolean): this;
    hide(): this;
    options(options: object | any[]): Controller;
    min(min: number): this;
    max(max: number): this;
    step(step: number): this;
    decimals(decimals: number): this;
    listen(listen?: boolean): this;
    _listening: boolean | undefined;
    _listenCallbackID: number | undefined;
    _listenPrevValue: any;
    getValue(): any;
    setValue(value: any): this;
    updateDisplay(): this;
    load(value: any): this;
    save(): any;
    destroy(): void;
}
export class FunctionController extends Controller {
    constructor(parent: any, object: any, property: any);
    $button: HTMLButtonElement;
    $disable: HTMLButtonElement;
}
export class GUI {
    constructor({ parent, autoPlace, container, width, title, closeFolders, injectStyles, touchStyles }?: {
        autoPlace?: boolean | undefined;
        container?: HTMLElement | undefined;
        width?: number | undefined;
        title?: string | undefined;
        closeFolders?: boolean | undefined;
        injectStyles?: boolean | undefined;
        touchStyles?: number | undefined;
        parent?: GUI | undefined;
    } | undefined);
    parent: GUI;
    root: GUI;
    children: Array<GUI | Controller>;
    controllers: Array<Controller>;
    folders: Array<GUI>;
    _closed: boolean;
    _hidden: boolean;
    domElement: HTMLElement;
    $title: HTMLElement;
    $children: HTMLElement;
    _closeFolders: boolean | undefined;
    add(object: object, property: string, $1?: number | object | any[] | undefined, max?: number | undefined, step?: number | undefined): Controller;
    addColor(object: object, property: string, rgbScale?: number): Controller;
    addFolder(title: string): GUI;
    load(obj: object, recursive?: boolean): this;
    save(recursive?: boolean): object;
    open(open?: boolean): this;
    close(): this;
    _setClosed(closed: any): void;
    show(show?: boolean): this;
    hide(): this;
    openAnimated(open?: boolean): this;
    title(title: string): this;
    _title: string | undefined;
    reset(recursive?: boolean): this;
    onChange(callback: (arg0: {
        object: object;
        property: string;
        value: any;
        controller: Controller;
    }) => any): this;
    _onChange: Function | undefined;
    _callOnChange(controller: any): void;
    onFinishChange(callback: (arg0: {
        object: object;
        property: string;
        value: any;
        controller: Controller;
    }) => any): this;
    _onFinishChange: Function | undefined;
    _callOnFinishChange(controller: any): void;
    onOpenClose(callback: (arg0: GUI) => any): this;
    _onOpenClose: ((arg0: GUI) => any) | undefined;
    _callOnOpenClose(changedGUI: any): void;
    destroy(): void;
    controllersRecursive(): Controller[];
    foldersRecursive(): GUI[];
}
export class NumberController extends Controller {
    constructor(parent: any, object: any, property: any, min: any, max: any, step: any);
    decimals(decimals: any): this;
    _decimals: any;
    min(min: any): this;
    _min: any;
    max(max: any): this;
    _max: any;
    step(step: any, explicit?: boolean): this;
    _step: any;
    _stepExplicit: boolean | undefined;
    updateDisplay(): this;
    _initInput(): void;
    $input: HTMLInputElement | undefined;
    _inputFocused: boolean | undefined;
    _initSlider(): void;
    _hasSlider: boolean | undefined;
    $slider: HTMLDivElement | undefined;
    $fill: HTMLDivElement | undefined;
    _setDraggingStyle(active: any, axis?: string): void;
    _getImplicitStep(): number;
    _onUpdateMinMax(): void;
    _normalizeMouseWheel(e: any): any;
    _arrowKeyMultiplier(e: any): number;
    _snap(value: any): any;
    _clamp(value: any): any;
    _snapClampSetValue(value: any): void;
    get _hasScrollBar(): boolean;
    get _hasMin(): boolean;
    get _hasMax(): boolean;
}
export class OptionController extends Controller {
    constructor(parent: any, object: any, property: any, options: any);
    $select: HTMLSelectElement;
    $display: HTMLDivElement;
    $disable: HTMLSelectElement;
    options(options: any): this;
    _values: any[] | undefined;
    _names: any[] | undefined;
    updateDisplay(): this;
}
export class StringController extends Controller {
    constructor(parent: any, object: any, property: any);
    $input: HTMLInputElement;
    $disable: HTMLInputElement;
    updateDisplay(): this;
}
declare function normalizeColorString(string: any): string | false;
export { GUI as default };
