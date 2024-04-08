export = WebIFCWasm;
declare function WebIFCWasm(moduleArg?: {}): any;
declare namespace WebIFCWasm {
    export { pthread_self, malloc, __getTypeName, __errno_location, stackSave, stackAlloc };
}
declare function pthread_self(): number;
declare function malloc(a0: any): number;
declare function __getTypeName(a0: any): number;
declare function __errno_location(): number;
declare function stackSave(): number;
declare function stackAlloc(a0: any): number;
