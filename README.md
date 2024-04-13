# Bimatter viewer core

This is new ifc viewer core

All about us you can see on our website [Bimatter](https://bimatter.ru/)

### Live [demo](https://rkaeplive.github.io/bimatter-viewer-demo/)

## Introduction demo

1. Create new project, using some IDE.
2. Open terminal inside your new project
3. Init new npm project with command
   `npm init` use flag `-y` to create project with default settings
4. Install bimatter-viewer library with command `npm i bimatter-viewer`
5. Create html file `index.html` (you can use `! + TAB` if you work with VS Code and dont forget to add `<script src="./build/bundle.js"></script>` inside body section)

```JavaScript
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>viewer show</title>
    </head>
    <body style="padding: 0; margin: 0">
        <script src="./build/bundle.js"></script>
    </body>
</html>
```

6. Create script file `index.js` where `"./model.ifc"` - is path to your ifc model

```JavaScript
import BimatterViewer from "bimatter-viewer";

document.addEventListener("DOMContentLoaded", () => {
    const viewer = new BimatterViewer();
    viewer.utils.useStats = true;
    viewer.loadModel("./model.ifc");
});

```

7. Create server. In this example we will use `webpack` with `webpack-dev-server`

    To use webpack-dev-server you need to install next libraries:

    7.1. install webpack with command `npm i webpack`

    7.2. install webpack-cli with command `npm i webpack-cli`

    7.3. install webpack-dev-server with command `npm i webpack-dev-server`

    (you can use flag `-D` to intall it as devDependencies)

8. Create webpack config file `webpack.config.js`

```JavaScript
const path = require("path");
const webpack = require("webpack");
module.exports = {
    entry: "./index.js",
    module: {
        rules: [
            { test: /\.css$/, use: ["style-loader", "css-loader"] },
            {
                test: /\.tsx?$/,
                use: "ts-loader",
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
        ],
        open: true,
        compress: true,
        hot: true,
        port: 8000,
    },
    output: {
        path: path.resolve(__dirname, "src"),
        filename: "build/bundle.js",
    },
};
```

9. Add running script to `package.json` file.

    `"start": "webpack serve --mode=development"`

10. Go to directory `node_modules/bimatter-viewer` and copy next files to root directory

    - file: `ifc-parser.wasm`
    - folder: `Resources`

11. Go to terminal and run script `npm start`

Ready!!!
