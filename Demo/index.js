import {
    BufferAttribute,
    BufferGeometry,
    Color,
    Group,
    Mesh,
    MeshLambertMaterial,
} from "three";
import BimatterViewer, { Model } from "../src/Viewer";
import { saveAs } from "file-saver";
// import * as THREE from "three";

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container");
    const viewer = new BimatterViewer({ container });
    viewer.utils.useStats = true;
    viewer.utils.propsUtils.initPropConteiner(document.getElementById("props"));
    window.addEventListener("keydown", onKeyDown);
    const input = document.getElementById("file-input");
    const inputConvert = document.getElementById("file-input-convert");
    const demoIfc = document.getElementById("demo-ifc");
    const demoBmt = document.getElementById("demo-bmt");
    const demoWorker = document.getElementById("demo-worker");
    const exportBmt = document.getElementById("export-bmt");
    const exportIsActiveView = document.getElementById("is-active-view");

    const progressWrap = document.getElementById("progress-wrap");
    const progress = document.getElementById("progress");
    viewer.loaders.loadingProgressUtils.setContainer(progress);
    const color = document.getElementById("color");
    const colorize = document.getElementById("colorize");
    const infoBut = document.getElementById("infoBut");
    const info = document.getElementById("info");

    infoBut.addEventListener("mouseenter", () => {
        info.style.display = "block";
    });
    infoBut.addEventListener("mouseleave", () => {
        info.style.display = "none";
    });
    var curColor = "#454545";
    colorize.addEventListener("click", () => {
        viewer.utils.geometryUtils.createGeometryChunk({
            modelID: 0,
            ids: Array.from(viewer.selector.selectedElements[0]),
            color: curColor,
        });
    });
    color.addEventListener("change", (e) => {
        curColor = e.target.value;
    });
    input.addEventListener(
        "change",
        (changed) => {
            const files = changed.target.files;

            console.log(viewer);
            for (const file of files) {
                viewer
                    .loadModel(file, true, (a) => {
                        console.log(a.type, (a.current * 100) / a.total);
                    })
                    .then((model) => {
                        console.log(model);
                    });
            }

            demoIfc.remove();
            demoBmt.remove();
            progressWrap.remove();
            exportBmt.style.display = "block";
            exportIsActiveView.parentElement.style.display = "block";
            // input.parentNode.remove();
            inputConvert.parentNode.remove();
        },
        false
    );
    inputConvert.addEventListener(
        "change",
        (changed) => {
            const file = changed.target.files[0];
            viewer.loaders.bmtConverter.convertIfcToBmt(file);
        },
        false
    );
    demoWorker.addEventListener("click", () => {
        const worker = new Worker(
            new URL("./Worker/bmtLoaderWorker.js", import.meta.url),
            {
                type: "module",
            }
        );
        const model = viewer.addEmptyModel(0);

        const selectGroup = new Group();
        const preselectGroup = new Group();
        worker.onmessage = (data) => {
            if (data.data.ready) {
                viewer.selector.selectorModels[model.modelID] =
                    model.threeGeometry.children;
                viewer.selector.selection._selectedMesh.add(selectGroup);
                viewer.selector.preSelection._preSelectMesh.add(preselectGroup);
                viewer.selector.selectedElements[model.modelID] = new Set();
                if (data.data.state && data.data.defaultState) {
                    model.setState(data.data.state, data.data.defaultState);
                }
                if (data.data.props) {
                    model.properties.setProperties(data.data.props);
                }
                if (data.data.structure) {
                    model.properties.setStructure(data.data.structure);
                }
                console.log(model);
                progressWrap.remove();
                worker.postMessage({
                    type: "state",
                    data: model.threeGeometry.children.map((child) => ({
                        index: child.geometry.index.array,
                        ids: child.geometry.attributes.ids.array,
                        matInd: child.name,
                    })),
                });
            } else if (data.data.state) {
                model.setState(
                    data.data.state,
                    data.data.defaultState,
                    data.data.activeElements
                );
                worker.terminate();
            } else if (data.data.process) {
                const process = data.data.process;
                const persent = Math.round(
                    (process.current * 100) / process.total
                );
                progress.innerHTML = !process.total
                    ? process.type
                    : `${process.type} ${persent}%`;
            } else {
                progressWrap.style.backgroundColor = "transparent";
                const geomData = data.data.geom;
                const geom = new BufferGeometry();
                geom.setAttribute(
                    "position",
                    new BufferAttribute(geomData.pos, 3)
                );
                geom.setAttribute("ids", new BufferAttribute(geomData.ids, 1));
                geom.setIndex(
                    new BufferAttribute(new Uint32Array(geomData.ind), 1)
                );
                const a = data.data.material.a;
                const color = data.data.material.color;
                const mesh = new Mesh(
                    geom,
                    new MeshLambertMaterial({
                        color: new Color(
                            ...(color instanceof Array ? color : [color])
                        ),
                        opacity: a,
                        transparent: a !== 1,
                    })
                );
                geom.computeVertexNormals();
                geom.computeBoundingBox();
                geom.computeBoundingSphere();
                mesh.name = data.data.name;
                model.addMeshToModel(
                    mesh,
                    selectGroup,
                    preselectGroup,
                    model.threeGeometry.children.length === 1
                );
            }
            // console.log(data);
        };
        // worker.postMessage("./Models/model.ifc");
        worker.postMessage({ type: "load", data: "./Models/model.bmt" });
    });
    demoIfc.addEventListener("click", () => {
        viewer
            .loadModel("Models/model.ifc", true, (a) => {
                console.log(a.type, (a.current * 100) / a.total);
            })
            .then((model) => {
                progressWrap.remove();
                console.log(model);
                console.log(viewer);
            });
        demoIfc.remove();
        demoBmt.remove();
        exportIsActiveView.parentElement.style.display = "block";
        exportBmt.style.display = "block";
        input.parentNode.remove();
        inputConvert.parentNode.remove();
    });
    demoBmt.addEventListener("click", () => {
        viewer.loadModel("Models/model.bmt", true).then((model) => {
            console.log(model);
            console.log(viewer);
            progressWrap.remove();
        });
        // viewer.loadModel("/model.bmt", true).then((model) => {
        //     console.log(model);
        //     console.log(viewer);
        // });
        demoIfc.remove();
        demoBmt.remove();
        exportIsActiveView.parentElement.style.display = "block";
        exportBmt.style.display = "block";
        input.parentNode.remove();
        inputConvert.parentNode.remove();
    });
    exportBmt.addEventListener("click", (e) => {
        if (viewer && viewer.models[0]) {
            viewer.loaders.bmtConverter.exportBMT({
                modelID: 0,
                activeView: exportIsActiveView.checked,
            });
        }
    });
    window.viewer = viewer;
    // demoIfc.click();
    // demoBmt.click();
});

// viewer.loadModel("/model.bmt", true).then((model) => {
//     console.log(model);
//     console.log(viewer);
// });

function onKeyDown(event) {
    // if (event.shiftKey) {
    //     const time = Date.now();
    //     viewer.bvhManager.applyThreeMeshBVH(
    //         viewer.models[0].geometry.threeGeometry.geometry
    //     );

    //     console.log(Date.now() - time, "ms");
    // }

    if (event.code === "Escape") {
        if (viewer.utils.dimentionsUtils.active) {
            viewer.utils.dimentionsUtils.cancelDrawing();
        } else {
        }
        // ViewerSelect.ViewerRemoveSelect(viewer, models, dispatch);
    }
    if (event.code === "KeyS") {
        const screenshot = viewer.context.renderer.newScreenshot();
        saveAs(screenshot, "screenshot.png");
    }
    if (event.code === "KeyM") {
        viewer.utils.dimentionsUtils.toggleDimentionsActive();
    }
    if (event.code === "Tab") {
        event.stopPropagation();
        event.preventDefault();
        if (viewer.utils.dimentionsUtils.measureStart) {
            viewer.utils.dimentionsUtils.changeAxes();
        }
    }

    if (event.keyCode === 9) {
        event.preventDefault();
        viewer.selector.preSelection.setDeep;
    }
    if (event.code === "KeyH") {
        if (!viewer.selector.isSelected) return;
        viewer.utils.geometryUtils.hideSelectedElements();
    }
    if (event.code === "KeyI") {
        if (!viewer.selector.isSelected) return;
        viewer.utils.geometryUtils.isolateSelectedElements();
    }
    if (event.code === "KeyC") {
        if (viewer.utils.dimentionsUtils.active) {
            viewer.utils.dimentionsUtils.deleteAll();
        } else {
            if (event.altKey) {
                viewer.utils.geometryUtils.resetAllModelsChunks();
            } else {
                viewer.utils.geometryUtils.showAll();
            }
        }
    }
    if (event.code === "KeyO") {
        viewer.context.controls.setOrbitByClick();
    }
    if (event.code === "KeyP") {
        if (event.altKey) {
            viewer.utils.clippingUtils.deleteAllPlanes();
        } else {
            const plane = viewer.utils.clippingUtils.createPlane();
        }
    }
}
