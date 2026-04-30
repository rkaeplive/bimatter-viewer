import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/Viewer/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    splitting: true,
    sourcemap: false,
    clean: true,
    minify: false,
    treeshake: true,
    external: ["three", "camera-controls", "web-ifc"],
    target: "es2020",
});
