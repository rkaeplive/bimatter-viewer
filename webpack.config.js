const path = require("path");
const webpack = require("webpack");
module.exports = {
    mode: "production",
    entry: "./src/Viewer/index.ts",
    module: {
        rules: [
            {
                test: /\.css/,
                use: ["style-loader", "css-loader"],
            },
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
    devServer: {
        historyApiFallback: true,
        static: [
            {
                directory: path.resolve(__dirname),
            },
            {
                directory: path.resolve(__dirname, "Models"),
            },
            {
                directory: path.resolve(__dirname, "Workers"),
            },
        ],
        open: true,
        compress: true,
        hot: true,
        port: 8000,
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        clean: true,
    },
};
