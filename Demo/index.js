import BimatterViewer from "../src/Viewer";
import { saveAs } from "file-saver";
// import * as THREE from "three";
const viewer = new BimatterViewer();
viewer.utils.useStats = true;
document.addEventListener("DOMContentLoaded", () => {
    viewer.utils.propsUtils.initPropConteiner(document.getElementById("props"));
    window.addEventListener("keydown", onKeyDown);
    const input = document.getElementById("file-input");
    const inputConvert = document.getElementById("file-input-convert");
    const demoIfc = document.getElementById("demo-ifc");
    const demoBmt = document.getElementById("demo-bmt");
    const exportBmt = document.getElementById("export-bmt");
    const exportIsActiveView = document.getElementById("is-active-view");

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
            const file = changed.target.files[0];
            viewer.loadModel(file, true).then((model) => {
                console.log(model);
                console.log(viewer);
            });
            demoIfc.remove();
            demoBmt.remove();
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
    demoIfc.addEventListener("click", () => {
        viewer.loadModel("Models/model.ifc", true).then((model) => {
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
            viewer.utils.exportUtils.exportBMT(0, exportIsActiveView.checked);
        }
    });

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
window.viewer = viewer;
