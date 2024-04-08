const path = require("path");
const webpack = require("webpack");
module.exports = {
    mode: "production",
    entry: "./src/Viewer/index.ts",
    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                use: ["ts-loader"],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    stats: "errors-only",
    watchOptions: {
        poll: true,
        ignored: "**/node_modules",
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        clean: false,
    },
};
