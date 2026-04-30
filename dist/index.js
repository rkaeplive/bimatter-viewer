'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var THREE2 = require('three');
var threeMeshBvh = require('three-mesh-bvh');
var CameraControls2 = require('camera-controls');
var CSS2DRenderer_js = require('three/examples/jsm/renderers/CSS2DRenderer.js');
var CSS3DRenderer_js = require('three/examples/jsm/renderers/CSS3DRenderer.js');
var CSS2DRenderer = require('three/examples/jsm/renderers/CSS2DRenderer');
var BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils');
var webIfc = require('web-ifc');
var decoder = require('pako');
var Stats = require('three/examples/jsm/libs/stats.module.js');
var GUI = require('lil-gui');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var THREE2__namespace = /*#__PURE__*/_interopNamespace(THREE2);
var CameraControls2__default = /*#__PURE__*/_interopDefault(CameraControls2);
var decoder__namespace = /*#__PURE__*/_interopNamespace(decoder);
var Stats__default = /*#__PURE__*/_interopDefault(Stats);
var GUI__default = /*#__PURE__*/_interopDefault(GUI);

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
var BvhManager = class {
  constructor(context) {
    this.context = context;
    this._worker = null;
    this.computeBoundsTree = threeMeshBvh.computeBoundsTree;
    this.disposeBoundsTree = threeMeshBvh.disposeBoundsTree;
    this.acceleratedRaycast = threeMeshBvh.acceleratedRaycast;
    this.setupThreeMeshBVH();
  }
  set useWorker(worker) {
    if (!worker) {
      this._worker?.terminate();
      this._worker = null;
      return;
    }
    worker.onerror = (e2) => {
      if (e2.message) {
        throw new Error(
          `GenerateMeshBVHWorker: Could not create Web Worker with error "${e2.message}"`
        );
      } else {
        throw new Error(
          "GenerateMeshBVHWorker: Could not create Web Worker."
        );
      }
    };
    this._worker = worker;
  }
  get useWorker() {
    return this._worker;
  }
  async applyThreeMeshBVH(geometry) {
    if (this._worker) {
      geometry.boundsTree = await this.generate(geometry, {
        maxDepth: this.maxDepth ? this.maxDepth : 100
      });
    } else {
      if (!geometry.computeBoundsTree) {
        geometry.computeBoundsTree = this.computeBoundsTree;
      }
      geometry.computeBoundsTree({
        maxDepth: this.maxDepth ? this.maxDepth : 100
      });
    }
  }
  generate(geometry, options = {}) {
    if (this._worker === null) {
      throw new Error("GenerateMeshBVHWorker: Worker has been disposed.");
    }
    return new Promise((resolve, reject) => {
      this._worker.onerror = (e2) => {
        reject(new Error(`GenerateMeshBVHWorker: ${e2.message}`));
      };
      this._worker.onmessage = (e2) => {
        const { data } = e2;
        if (data.error) {
          reject(new Error(data.error));
          this._worker.onmessage = null;
        } else if (data.serialized) {
          const { serialized } = data;
          try {
            const bvh = threeMeshBvh.MeshBVH.deserialize(serialized, geometry, {
              setIndex: true
            });
            resolve(bvh);
          } catch (e3) {
            console.log(e3);
          }
          this._worker.onmessage = null;
        } else if (options.onProgress) {
          options.onProgress(data.progress);
        }
      };
      const index = geometry.index ? geometry.index.array : null;
      const position = geometry.attributes.position.array;
      this._worker.postMessage({
        index,
        position,
        options: {
          ...options
        }
      });
    });
  }
  update(mesh) {
    if (mesh) {
      this.updateByMesh(mesh);
    } else {
      Object.values(this.context.models).forEach((model) => {
        model.threeGeometry.children.forEach((child) => {
          const mesh2 = child;
          this.updateByMesh(mesh2);
        });
      });
    }
  }
  async updateByMesh(mesh) {
    if (this._worker) {
      let geometry = mesh.geometry;
      const bvh = await this.generate(geometry, {
        maxDepth: this.maxDepth ? this.maxDepth : 100
      });
      mesh.geometry.boundsTree = bvh;
    } else {
      mesh.geometry.boundsTree.refit();
    }
  }
  dispose() {
    this._worker?.terminate();
  }
  setupThreeMeshBVH() {
    if (!this.computeBoundsTree || !this.disposeBoundsTree || !this.acceleratedRaycast) {
      console.log("Error while loading three-mesh-bvh");
      return;
    }
    THREE2.BufferGeometry.prototype.computeBoundsTree = this.computeBoundsTree;
    THREE2.BufferGeometry.prototype.disposeBoundsTree = this.disposeBoundsTree;
    THREE2.Mesh.prototype.raycast = this.acceleratedRaycast;
  }
};
var Camera = class {
  constructor(context, fov, near, far) {
    this.context = context;
    this.lookAt = (target) => {
      this.threeCamera.lookAt(target);
      this.threeCamera.updateProjectionMatrix();
      this.threeCamera.updateMatrixWorld();
    };
    this.setPosition = (position) => {
      this.threeCamera.position.set(position.x, position.y, position.z);
      this.threeCamera.updateProjectionMatrix();
      this.threeCamera.updateMatrixWorld();
    };
    const sizes = this.context.sizes;
    this.threeCamera = new THREE2.PerspectiveCamera(
      fov,
      sizes.width / sizes.height,
      near,
      far
    );
    this.threeCamera.position.set(15, 15, 15);
    this.threeCamera.updateProjectionMatrix();
    this.threeCamera.updateMatrixWorld();
  }
};
var _plane = new THREE2.Plane();
var _raycaster = new THREE2.Raycaster();
var _pointer = new THREE2.Vector2();
var _offset = new THREE2.Vector3();
var _intersection = new THREE2.Vector3();
var _worldPosition = new THREE2.Vector3();
new THREE2.Matrix4();
var DragControls = class extends THREE2.EventDispatcher {
  constructor(_objects, _camera, _domElement) {
    super();
    __publicField(this, "defaultActive", true);
    _domElement.style.touchAction = "none";
    let _selected = null, _hovered = null;
    const _intersections = [];
    const scope = this;
    function activate() {
      _domElement.addEventListener("pointermove", onPointerMove);
      _domElement.addEventListener("pointerdown", onPointerDown);
      _domElement.addEventListener("pointerup", onPointerCancel);
      _domElement.addEventListener("pointerleave", onPointerCancel);
    }
    function deactivate() {
      _domElement.removeEventListener("pointermove", onPointerMove);
      _domElement.removeEventListener("pointerdown", onPointerDown);
      _domElement.removeEventListener("pointerup", onPointerCancel);
      _domElement.removeEventListener("pointerleave", onPointerCancel);
      _domElement.style.cursor = "";
    }
    function dispose() {
      deactivate();
    }
    function getObjects() {
      return _objects;
    }
    function getRaycaster() {
      return _raycaster;
    }
    function onPointerMove(event) {
      if (scope.enabled === false) return;
      updatePointer(event);
      _raycaster.setFromCamera(_pointer, _camera);
      if (_selected) {
        let _vec;
        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          _vec = new THREE2.Vector3().copy(_intersection);
          if (scope.defaultActive) {
            _selected.position.copy(_vec);
          }
        }
        scope.dispatchEvent({
          type: "drag",
          object: _selected,
          point: _vec
        });
        return;
      }
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        _intersections.length = 0;
        _raycaster.setFromCamera(_pointer, _camera);
        _raycaster.intersectObjects(_objects, true, _intersections);
        if (_intersections.length > 0) {
          const object = _intersections[0].object;
          _plane.setFromNormalAndCoplanarPoint(
            _camera.getWorldDirection(_plane.normal),
            _worldPosition.setFromMatrixPosition(object.matrixWorld)
          );
          if (_hovered !== object && _hovered !== null) {
            scope.dispatchEvent({
              type: "hoveroff",
              object: _hovered
            });
            _domElement.style.cursor = "auto";
            _hovered = null;
          }
          if (_hovered !== object) {
            scope.dispatchEvent({
              type: "hoveron",
              object
            });
            _domElement.style.cursor = "pointer";
            _hovered = object;
          }
        } else {
          if (_hovered !== null) {
            scope.dispatchEvent({
              type: "hoveroff",
              object: _hovered
            });
            _domElement.style.cursor = "auto";
            _hovered = null;
          }
        }
      }
    }
    function onPointerDown(event) {
      if (scope.enabled === false) return;
      updatePointer(event);
      _intersections.length = 0;
      _raycaster.setFromCamera(_pointer, _camera);
      _raycaster.intersectObjects(_objects, true, _intersections);
      if (_intersections.length > 0) {
        _selected = scope.transformGroup === true ? _objects[0] : _intersections[0].object;
        _plane.setFromNormalAndCoplanarPoint(
          _camera.getWorldDirection(_plane.normal),
          _worldPosition.setFromMatrixPosition(_selected.matrixWorld)
        );
        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          _offset.copy(_intersection).sub(
            _worldPosition.setFromMatrixPosition(
              _selected.matrixWorld
            )
          );
        }
        _domElement.style.cursor = "move";
        scope.dispatchEvent({ type: "dragstart", object: _selected });
      }
    }
    function onPointerCancel() {
      if (scope.enabled === false) return;
      if (_selected) {
        scope.dispatchEvent({ type: "dragend", object: _selected });
        _selected = null;
      }
      _domElement.style.cursor = _hovered ? "pointer" : "auto";
    }
    function updatePointer(event) {
      const rect = _domElement.getBoundingClientRect();
      _pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      _pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    }
    activate();
    this.enabled = true;
    this.transformGroup = false;
    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;
    this.getObjects = getObjects;
    this.getRaycaster = getRaycaster;
  }
};
var vec3$1 = new THREE2.Vector3();
var ComputedTriangle = class extends THREE2.Triangle {
  constructor(a, b, c) {
    super(a, b, c);
    this.normal = this.getNormal(new THREE2.Vector3());
  }
  computeBoundingSphere() {
    this.boundingSphere = makeTriangleBoundingSphere(this, this.normal);
  }
  // https://math.stackexchange.com/questions/1397456/how-to-scale-a-triangle-such-that-the-distance-between-original-edges-and-new-ed
  // scale( amount: number ) {
  // 	const incenter = getIncenter( this, vec3 );
  // 	this.a.sub( incenter ).multiplyScalar( amount ).add( incenter );
  // 	this.b.sub( incenter ).multiplyScalar( amount ).add( incenter );
  // 	this.c.sub( incenter ).multiplyScalar( amount ).add( incenter );
  // 	拡張したら、過去の boundingSphere はすでに大きさが違うものとなる。破棄する。
  // 	this.boundingSphere = undefined;
  // }
  extend(amount) {
    const incenter = getIncenter(this, vec3$1);
    const a = incenter.distanceTo(this.a);
    const b = incenter.distanceTo(this.b);
    const c = incenter.distanceTo(this.c);
    this.a.sub(incenter).normalize().multiplyScalar(a + amount).add(incenter);
    this.b.sub(incenter).normalize().multiplyScalar(b + amount).add(incenter);
    this.c.sub(incenter).normalize().multiplyScalar(c + amount).add(incenter);
    this.boundingSphere = void 0;
  }
};
function getIncenter(triangle, out) {
  const a = triangle.a.distanceTo(triangle.b);
  const b = triangle.b.distanceTo(triangle.c);
  const c = triangle.c.distanceTo(triangle.a);
  const p = a + b + c;
  out.set(
    (a * triangle.a.x + b * triangle.b.x + c * triangle.c.x) / p,
    (a * triangle.a.y + b * triangle.b.y + c * triangle.c.y) / p,
    (a * triangle.a.z + b * triangle.b.z + c * triangle.c.z) / p
  );
  return out;
}
var v = new THREE2.Vector3();
var v0 = new THREE2.Vector3();
var v1 = new THREE2.Vector3();
var e0 = new THREE2.Vector3();
var e1 = new THREE2.Vector3();
var triangleNormal = new THREE2.Vector3();
function makeTriangleBoundingSphere(triangle, normal) {
  const bs = new THREE2.Sphere();
  v0.subVectors(triangle.b, triangle.a);
  v1.subVectors(triangle.c, triangle.a);
  if (v0.dot(v1) <= 0) {
    bs.center.addVectors(triangle.b, triangle.c).divideScalar(2);
    bs.radius = v.subVectors(triangle.b, triangle.c).length() / 2;
    return bs;
  }
  v0.subVectors(triangle.a, triangle.b);
  v1.subVectors(triangle.c, triangle.b);
  if (v0.dot(v1) <= 0) {
    bs.center.addVectors(triangle.a, triangle.c).divideScalar(2);
    bs.radius = v.subVectors(triangle.a, triangle.c).length() / 2;
    return bs;
  }
  v0.subVectors(triangle.a, triangle.c);
  v1.subVectors(triangle.b, triangle.c);
  if (v0.dot(v1) <= 0) {
    bs.center.addVectors(triangle.a, triangle.b).divideScalar(2);
    bs.radius = v.subVectors(triangle.a, triangle.b).length() / 2;
    return bs;
  }
  if (!normal) {
    normal = triangle.getNormal(triangleNormal);
  }
  v0.crossVectors(v.subVectors(triangle.c, triangle.b), normal);
  v1.crossVectors(v.subVectors(triangle.c, triangle.a), normal);
  e0.addVectors(triangle.c, triangle.b).multiplyScalar(0.5);
  e1.addVectors(triangle.c, triangle.a).multiplyScalar(0.5);
  const a = v0.dot(v1);
  const b = v0.dot(v0);
  const d = v1.dot(v1);
  const c = -v.subVectors(e1, e0).dot(v0);
  const e2 = -v.subVectors(e1, e0).dot(v1);
  const div = -a * a + b * d;
  const s = (-c * d + a * e2) / div;
  bs.center = e0.clone().add(v0.clone().multiplyScalar(s));
  bs.radius = v.subVectors(bs.center, triangle.a).length();
  return bs;
}
var vec3 = new THREE2.Vector3();
var vec3_0 = new THREE2.Vector3();
var vec3_1 = new THREE2.Vector3();
new THREE2.Sphere();
new THREE2.Line3();
var Intersection = class {
  constructor() {
    this.point = new THREE2.Vector3();
    this.normal = new THREE2.Vector3();
    this.depth = 0;
  }
  set(point, normal, depth) {
    this.point.copy(point);
    this.normal.copy(normal);
    this.depth = depth;
  }
};
function isIntersectionLineBox(line, box, hit) {
  if (line.end.x < box.min.x && line.start.x < box.min.x) return false;
  if (line.end.x > box.max.x && line.start.x > box.max.x) return false;
  if (line.end.y < box.min.y && line.start.y < box.min.y) return false;
  if (line.end.y > box.max.y && line.start.y > box.max.y) return false;
  if (line.end.z < box.min.z && line.start.z < box.min.z) return false;
  if (line.end.z > box.max.z && line.start.z > box.max.z) return false;
  if (line.start.x > box.min.x && line.start.x < box.max.x && line.start.y > box.min.y && line.start.y < box.max.y && line.start.z > box.min.z && line.start.z < box.max.z) {
    return true;
  }
  const _hit = vec3;
  if (getIntersection(
    line.start.x - box.min.x,
    line.end.x - box.min.x,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 1) || getIntersection(
    line.start.y - box.min.y,
    line.end.y - box.min.y,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 2) || getIntersection(
    line.start.z - box.min.z,
    line.end.z - box.min.z,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 3) || getIntersection(
    line.start.x - box.max.x,
    line.end.x - box.max.x,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 1) || getIntersection(
    line.start.y - box.max.y,
    line.end.y - box.max.y,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 2) || getIntersection(
    line.start.z - box.max.z,
    line.end.z - box.max.z,
    line.start,
    line.end,
    _hit
  ) && inBox(_hit, box, 3)) {
    return true;
  }
  return false;
}
function getIntersection(dst1, dst2, p1, p2, hit) {
  if (dst1 * dst2 >= 0) return false;
  if (dst1 == dst2) return false;
  if (hit) {
    vec3.subVectors(p2, p1);
    vec3.multiplyScalar(-dst1 / (dst2 - dst1));
    hit.addVectors(p1, vec3);
  }
  return true;
}
function inBox(hit, box, axis) {
  if (axis === 1 && hit.z > box.min.z && hit.z < box.max.z && hit.y > box.min.y && hit.y < box.max.y)
    return true;
  if (axis === 2 && hit.z > box.min.z && hit.z < box.max.z && hit.x > box.min.x && hit.x < box.max.x)
    return true;
  if (axis === 3 && hit.x > box.min.x && hit.x < box.max.x && hit.y > box.min.y && hit.y < box.max.y)
    return true;
  return false;
}
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Plane();
var A = new THREE2.Vector3();
var B = new THREE2.Vector3();
var C = new THREE2.Vector3();
var V = new THREE2.Vector3();
var AB = new THREE2.Vector3();
var BC = new THREE2.Vector3();
var CA = new THREE2.Vector3();
var Q1 = new THREE2.Vector3();
var Q2 = new THREE2.Vector3();
var Q3 = new THREE2.Vector3();
var QC = new THREE2.Vector3();
var QA = new THREE2.Vector3();
var QB = new THREE2.Vector3();
var negatedNormal = new THREE2.Vector3();
function isIntersectionSphereTriangle(sphere2, a, b, c, normal, out) {
  A.subVectors(a, sphere2.center);
  B.subVectors(b, sphere2.center);
  C.subVectors(c, sphere2.center);
  const rr = sphere2.radius * sphere2.radius;
  V.crossVectors(vec3_0.subVectors(B, A), vec3_1.subVectors(C, A));
  const d = A.dot(V);
  const e2 = V.dot(V);
  if (d * d > rr * e2) {
    return false;
  }
  const aa = A.dot(A);
  const ab2 = A.dot(B);
  const ac2 = A.dot(C);
  const bb = B.dot(B);
  const bc = B.dot(C);
  const cc = C.dot(C);
  if (aa > rr && ab2 > aa && ac2 > aa || bb > rr && ab2 > bb && bc > bb || cc > rr && ac2 > cc && bc > cc) {
    return false;
  }
  AB.subVectors(B, A);
  BC.subVectors(C, B);
  CA.subVectors(A, C);
  const d1 = ab2 - aa;
  const d2 = bc - bb;
  const d3 = ac2 - cc;
  const e12 = AB.dot(AB);
  const e22 = BC.dot(BC);
  const e3 = CA.dot(CA);
  Q1.subVectors(A.multiplyScalar(e12), AB.multiplyScalar(d1));
  Q2.subVectors(B.multiplyScalar(e22), BC.multiplyScalar(d2));
  Q3.subVectors(C.multiplyScalar(e3), CA.multiplyScalar(d3));
  QC.subVectors(C.multiplyScalar(e12), Q1);
  QA.subVectors(A.multiplyScalar(e22), Q2);
  QB.subVectors(B.multiplyScalar(e3), Q3);
  if (Q1.dot(Q1) > rr * e12 * e12 && Q1.dot(QC) >= 0 || Q2.dot(Q2) > rr * e22 * e22 && Q2.dot(QA) >= 0 || Q3.dot(Q3) > rr * e3 * e3 && Q3.dot(QB) >= 0) {
    return false;
  }
  const distance = Math.sqrt(d * d / e2) - sphere2.radius - 1;
  negatedNormal.set(-normal.x, -normal.y, -normal.z);
  const contactPoint = sphere2.center.clone().add(negatedNormal.multiplyScalar(distance));
  out.set(contactPoint, normal, distance);
  return true;
}
var ab = new THREE2.Vector3();
var ac = new THREE2.Vector3();
var qp = new THREE2.Vector3();
var n = new THREE2.Vector3();
var ap = new THREE2.Vector3();
var e = new THREE2.Vector3();
var au = new THREE2.Vector3();
var bv = new THREE2.Vector3();
var cw = new THREE2.Vector3();
function testLineTriangle(p, q, a, b, c, hit) {
  ab.subVectors(b, a);
  ac.subVectors(c, a);
  qp.subVectors(p, q);
  n.copy(ab).cross(ac);
  const d = qp.dot(n);
  if (d <= 0) return false;
  ap.subVectors(p, a);
  let t = ap.dot(n);
  if (t < 0) return false;
  if (t > d) return false;
  e.copy(qp).cross(ap);
  let v2 = ac.dot(e);
  if (v2 < 0 || v2 > d) return false;
  let w = vec3.copy(ab).dot(e) * -1;
  if (w < 0 || v2 + w > d) return false;
  const ood = 1 / d;
  t *= ood;
  v2 *= ood;
  w *= ood;
  const u = 1 - v2 - w;
  au.copy(a).multiplyScalar(u);
  bv.copy(b).multiplyScalar(v2);
  cw.copy(c).multiplyScalar(w);
  hit.copy(au).add(bv).add(cw);
  return true;
}
new THREE2.Vector3();
new THREE2.Plane();
new THREE2.Line3();
new THREE2.Line3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
new THREE2.Vector3();
var _v1 = new THREE2.Vector3();
var _v2$1 = new THREE2.Vector3();
var Octree = class _Octree {
  constructor(box = new THREE2.Box3()) {
    this.bounds = new THREE2.Box3();
    this.triangles = [];
    this.subTrees = [];
    this.box = box;
  }
  addTriangle(triangle) {
    this.bounds.min.x = Math.min(
      this.bounds.min.x,
      triangle.a.x,
      triangle.b.x,
      triangle.c.x
    );
    this.bounds.min.y = Math.min(
      this.bounds.min.y,
      triangle.a.y,
      triangle.b.y,
      triangle.c.y
    );
    this.bounds.min.z = Math.min(
      this.bounds.min.z,
      triangle.a.z,
      triangle.b.z,
      triangle.c.z
    );
    this.bounds.max.x = Math.max(
      this.bounds.max.x,
      triangle.a.x,
      triangle.b.x,
      triangle.c.x
    );
    this.bounds.max.y = Math.max(
      this.bounds.max.y,
      triangle.a.y,
      triangle.b.y,
      triangle.c.y
    );
    this.bounds.max.z = Math.max(
      this.bounds.max.z,
      triangle.a.z,
      triangle.b.z,
      triangle.c.z
    );
    this.triangles.push(triangle);
  }
  calcBox() {
    this.box.set(this.bounds.min, this.bounds.max);
    this.box.min.x -= 0.01;
    this.box.min.y -= 0.01;
    this.box.min.z -= 0.01;
    return this;
  }
  split(level) {
    const subTrees = [];
    const halfSize = _v2$1.copy(this.box.max).sub(this.box.min).multiplyScalar(0.5);
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const box = new THREE2.Box3();
          const v2 = _v1.set(x, y, z);
          box.min.copy(this.box.min).add(v2.multiply(halfSize));
          box.max.copy(box.min).add(halfSize);
          subTrees.push(new _Octree(box));
        }
      }
    }
    let triangle;
    while (triangle = this.triangles.pop()) {
      for (let i = 0; i < subTrees.length; i++) {
        if (subTrees[i].box.intersectsTriangle(triangle)) {
          subTrees[i].triangles.push(triangle);
        }
      }
    }
    for (let i = 0; i < subTrees.length; i++) {
      const len = subTrees[i].triangles.length;
      if (len > 8 && level < 16) {
        subTrees[i].split(level + 1);
      }
      if (len !== 0) {
        this.subTrees.push(subTrees[i]);
      }
    }
  }
  build() {
    this.calcBox();
    this.split(0);
    return this;
  }
  getLineTriangles(line, result) {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];
      if (!isIntersectionLineBox(line, subTree.box)) continue;
      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (result.indexOf(subTree.triangles[j]) === -1)
            result.push(subTree.triangles[j]);
        }
      } else {
        subTree.getLineTriangles(line, result);
      }
    }
    return result;
  }
  getRayTriangles(ray, result) {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];
      if (!ray.intersectsBox(subTree.box)) continue;
      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (result.indexOf(subTree.triangles[j]) === -1)
            result.push(subTree.triangles[j]);
        }
      } else {
        subTree.getRayTriangles(ray, result);
      }
    }
    return result;
  }
  getSphereTriangles(sphere2, result) {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];
      if (!sphere2.intersectsBox(subTree.box)) continue;
      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (result.indexOf(subTree.triangles[j]) === -1)
            result.push(subTree.triangles[j]);
        }
      } else {
        subTree.getSphereTriangles(sphere2, result);
      }
    }
    return result;
  }
  getCapsuleTriangles(capsule, result) {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];
      if (!capsule.intersectsBox(subTree.box)) continue;
      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (result.indexOf(subTree.triangles[j]) === -1)
            result.push(subTree.triangles[j]);
        }
      } else {
        subTree.getCapsuleTriangles(capsule, result);
      }
    }
  }
  lineIntersect(line) {
    const position = new THREE2.Vector3();
    const triangles = [];
    let distanceSquared = Infinity;
    let triangle = null;
    this.getLineTriangles(line, triangles);
    for (let i = 0; i < triangles.length; i++) {
      const result = _v1;
      const isIntersected = testLineTriangle(
        line.start,
        line.end,
        triangles[i].a,
        triangles[i].b,
        triangles[i].c,
        result
      );
      if (isIntersected) {
        const newDistanceSquared = line.start.distanceToSquared(result);
        if (distanceSquared > newDistanceSquared) {
          position.copy(result);
          distanceSquared = newDistanceSquared;
          triangle = triangles[i];
        }
      }
    }
    return triangle ? { distance: Math.sqrt(distanceSquared), triangle, position } : false;
  }
  rayIntersect(ray) {
    if (ray.direction.lengthSq() === 0) return;
    const triangles = [];
    let triangle, position, distanceSquared = 1e100;
    this.getRayTriangles(ray, triangles);
    for (let i = 0; i < triangles.length; i++) {
      const result = ray.intersectTriangle(
        triangles[i].a,
        triangles[i].b,
        triangles[i].c,
        true,
        _v1
      );
      if (result) {
        const newDistanceSquared = result.sub(ray.origin).lengthSq();
        if (distanceSquared > newDistanceSquared) {
          position = result.clone().add(ray.origin);
          distanceSquared = newDistanceSquared;
          triangle = triangles[i];
        }
      }
    }
    return distanceSquared < 1e100 ? { distance: Math.sqrt(distanceSquared), triangle, position } : false;
  }
  addGraphNode(object) {
    object.updateWorldMatrix(true, true);
    const mesh = object;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrix);
    geometry.computeVertexNormals();
    if (!!geometry.index) {
      const indices = geometry.index.array;
      const positions = geometry.attributes.position.array;
      const groups = geometry.groups.length !== 0 ? geometry.groups : [
        {
          start: 0,
          count: indices.length,
          materialIndex: 0
        }
      ];
      for (let i = 0, l = groups.length; i < l; ++i) {
        const start = groups[i].start;
        const count = groups[i].count;
        for (let ii = start, ll = start + count; ii < ll; ii += 3) {
          const a = indices[ii];
          const b = indices[ii + 1];
          const c = indices[ii + 2];
          const vA = new THREE2.Vector3().fromArray(positions, a * 3);
          const vB = new THREE2.Vector3().fromArray(positions, b * 3);
          const vC = new THREE2.Vector3().fromArray(positions, c * 3);
          const triangle = new ComputedTriangle(vA, vB, vC);
          triangle.extend(1e-10);
          triangle.computeBoundingSphere();
          this.addTriangle(triangle);
        }
      }
    }
    this.build();
  }
};
var EventDispatcher$1 = class EventDispatcher2 {
  constructor() {
    this._listeners = {};
  }
  /**
   * Adds the specified event listener.
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  addEventListener(type, listener) {
    const listeners = this._listeners;
    if (listeners[type] === void 0) listeners[type] = [];
    if (listeners[type].indexOf(listener) === -1)
      listeners[type].push(listener);
  }
  /**
   * Presence of the specified event listener.
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  hasEventListener(type, listener) {
    const listeners = this._listeners;
    return listeners[type] !== void 0 && listeners[type].indexOf(listener) !== -1;
  }
  /**
   * Removes the specified event listener
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  removeEventListener(type, listener) {
    const listeners = this._listeners;
    const listenerArray = listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) listenerArray.splice(index, 1);
    }
  }
  /**
   * Fire an event type.
   * @param event DispatcherEvent
   * @category Methods
   */
  dispatchEvent(event) {
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== void 0) {
      event.target = this;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
    }
  }
};
var FALL_VELOCITY = -20;
var JUMP_DURATION = 1e3;
var PI_HALF$1 = Math.PI * 0.5;
var PI_ONE_HALF = Math.PI * 1.5;
var direction2D = new THREE2.Vector2();
var wallNormal2D = new THREE2.Vector2();
var groundingHead = new THREE2.Vector3();
var groundingTo = new THREE2.Vector3();
var groundContactPointTmp = new THREE2.Vector3();
var groundContactPoint = new THREE2.Vector3();
var translate = new THREE2.Vector3();
var sphereCenter = new THREE2.Vector3();
var sphere$1 = new THREE2.Sphere();
var intersection = new Intersection();
var CharacterController = class extends EventDispatcher$1 {
  constructor(object3d, radius) {
    super();
    this.isCharacterController = true;
    this.position = new THREE2.Vector3();
    this.groundCheckDepth = 0.2;
    this.maxSlopeGradient = Math.cos(50 * THREE2.MathUtils.DEG2RAD);
    this.isGrounded = false;
    this.isOnSlope = false;
    this.isIdling = false;
    this.isRunning = false;
    this.isJumping = false;
    this.direction = 0;
    this.movementSpeed = 10;
    this.velocity = new THREE2.Vector3(0, -9.8, 0);
    this.currentJumpPower = 0;
    this.jumpStartTime = 0;
    this.groundHeight = 0;
    this.groundNormal = new THREE2.Vector3();
    this.nearTriangles = [];
    this.contactInfo = [];
    this.object = object3d;
    this.radius = radius;
    this.position.set(0, 0, 0);
    let isFirstUpdate = true;
    let wasGrounded = false;
    let wasOnSlope = false;
    let wasRunning = false;
    let wasJumping = false;
    this._events = () => {
      if (isFirstUpdate) {
        isFirstUpdate = false;
        wasGrounded = this.isGrounded;
        wasOnSlope = this.isOnSlope;
        wasRunning = this.isRunning;
        wasJumping = this.isJumping;
        return;
      }
      if (!wasRunning && !this.isRunning && this.isGrounded && !this.isIdling) {
        this.isIdling = true;
        this.dispatchEvent({ type: "startIdling" });
      } else if (!wasRunning && this.isRunning && !this.isJumping && this.isGrounded || !wasGrounded && this.isGrounded && this.isRunning || wasOnSlope && !this.isOnSlope && this.isRunning && this.isGrounded) {
        this.isIdling = false;
        this.dispatchEvent({ type: "startWalking" });
      } else if (!wasJumping && this.isJumping) {
        this.isIdling = false;
        this.dispatchEvent({ type: "startJumping" });
      } else if (!wasOnSlope && this.isOnSlope) {
        this.dispatchEvent({ type: "startSliding" });
      } else if (wasGrounded && !this.isGrounded && !this.isJumping) {
        this.dispatchEvent({ type: "startFalling" });
      }
      if (!wasGrounded && this.isGrounded) ;
      wasGrounded = this.isGrounded;
      wasOnSlope = this.isOnSlope;
      wasRunning = this.isRunning;
      wasJumping = this.isJumping;
    };
  }
  setNearTriangles(nearTriangles) {
    this.nearTriangles = nearTriangles;
  }
  update(deltaTime) {
    this.isGrounded = false;
    this.isOnSlope = false;
    this.groundHeight = -Infinity;
    this.groundNormal.set(0, 1, 0);
    this._checkGround();
    this._updateJumping();
    this._updatePosition(deltaTime);
    this._collisionDetection();
    this._solvePosition();
    this._updateVelocity();
    this._events();
  }
  _updateVelocity() {
    const frontDirection = -Math.cos(this.direction);
    const rightDirection = -Math.sin(this.direction);
    let isHittingCeiling = false;
    this.velocity.set(
      this.isRunning ? rightDirection * this.movementSpeed : 0,
      FALL_VELOCITY,
      this.isRunning ? frontDirection * this.movementSpeed : 0
    );
    if (this.contactInfo.length === 0 && !this.isJumping) {
      return;
    } else if (this.isGrounded && !this.isOnSlope && !this.isJumping) {
      this.velocity.y = 0;
    } else if (this.isOnSlope) {
      const horizontalSpeed = 20 / (1 - this.groundNormal.y) * 0.2;
      this.velocity.x = this.groundNormal.x * horizontalSpeed;
      this.velocity.y = FALL_VELOCITY;
      this.velocity.z = this.groundNormal.z * horizontalSpeed;
    } else if (!this.isGrounded && !this.isOnSlope && this.isJumping) {
      this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;
    }
    direction2D.set(rightDirection, frontDirection);
    const negativeFrontAngle = Math.atan2(-direction2D.y, -direction2D.x);
    for (let i = 0, l = this.contactInfo.length; i < l; i++) {
      const normal = this.contactInfo[i].triangle.normal;
      if (this.maxSlopeGradient < normal.y || this.isOnSlope) {
        continue;
      }
      if (!isHittingCeiling && normal.y < 0) {
        isHittingCeiling = true;
      }
      wallNormal2D.set(normal.x, normal.z).normalize();
      const wallAngle = Math.atan2(wallNormal2D.y, wallNormal2D.x);
      if (Math.abs(negativeFrontAngle - wallAngle) >= PI_HALF$1 && //  90deg
      Math.abs(negativeFrontAngle - wallAngle) <= PI_ONE_HALF) {
        continue;
      }
      wallNormal2D.set(
        direction2D.dot(wallNormal2D) * wallNormal2D.x,
        direction2D.dot(wallNormal2D) * wallNormal2D.y
      );
      direction2D.sub(wallNormal2D);
      this.velocity.x = this.isRunning ? direction2D.x * this.movementSpeed : 0;
      this.velocity.z = this.isRunning ? direction2D.y * this.movementSpeed : 0;
    }
    if (isHittingCeiling) {
      this.velocity.y = Math.min(0, this.velocity.y);
      this.isJumping = false;
    }
  }
  _checkGround() {
    let groundContact = null;
    const triangles = this.nearTriangles;
    groundingHead.set(
      this.position.x,
      this.position.y + this.radius * 2,
      this.position.z
    );
    groundingTo.set(
      this.position.x,
      this.position.y - 10,
      this.position.z
    );
    for (let i = 0, l = triangles.length; i < l; i++) {
      const triangle = triangles[i];
      if (triangle.normal.y <= 0) continue;
      const isIntersected = testLineTriangle(
        groundingHead,
        groundingTo,
        triangle.a,
        triangle.b,
        triangle.c,
        groundContactPointTmp
      );
      if (!isIntersected) continue;
      if (!groundContact) {
        groundContactPoint.copy(groundContactPointTmp);
        groundContact = {
          point: groundContactPoint,
          ground: triangle
        };
        continue;
      }
      if (groundContactPointTmp.y <= groundContact.point.y) continue;
      groundContactPoint.copy(groundContactPointTmp);
      groundContact = {
        point: groundContactPoint,
        ground: triangle
      };
    }
    if (!groundContact) return;
    this.groundHeight = groundContact.point.y;
    this.groundNormal.copy(groundContact.ground.normal);
    const top = groundingHead.y;
    const bottom = this.position.y - this.groundCheckDepth;
    if (this.isJumping && 0 < this.currentJumpPower) {
      this.isOnSlope = false;
      this.isGrounded = false;
      return;
    }
    this.isGrounded = bottom <= this.groundHeight && this.groundHeight <= top;
    this.isOnSlope = this.groundNormal.y <= this.maxSlopeGradient;
    if (this.isGrounded) {
      this.isJumping = false;
    }
  }
  _updatePosition(deltaTime) {
    this.position.set(
      this.position.x + this.velocity.x * deltaTime,
      this.isGrounded ? this.groundHeight : this.position.y + this.velocity.y * deltaTime,
      this.position.z + this.velocity.z * deltaTime
    );
  }
  _collisionDetection() {
    sphereCenter.set(0, this.radius, 0).add(this.position);
    sphere$1.set(sphereCenter, this.radius);
    const triangles = this.nearTriangles;
    this.contactInfo.length = 0;
    for (let i = 0, l = triangles.length; i < l; i++) {
      const triangle = triangles[i];
      if (!triangle.boundingSphere) triangle.computeBoundingSphere();
      if (!sphere$1.intersectsSphere(triangle.boundingSphere)) continue;
      const isIntersected = isIntersectionSphereTriangle(
        sphere$1,
        triangle.a,
        triangle.b,
        triangle.c,
        triangle.normal,
        intersection
      );
      if (!isIntersected) continue;
      this.contactInfo.push({
        point: intersection.point.clone(),
        depth: intersection.depth,
        triangle
      });
    }
  }
  _solvePosition() {
    let normal;
    if (this.contactInfo.length === 0) {
      this.object.position.copy(this.position);
      this.object.rotation.y = this.direction + Math.PI;
      return;
    }
    translate.set(0, 0, 0);
    for (let i = 0, l = this.contactInfo.length; i < l; i++) {
      normal = this.contactInfo[i].triangle.normal;
      if (this.maxSlopeGradient < normal.y) {
        continue;
      }
      const isSlopeFace = this.maxSlopeGradient <= normal.y && normal.y < 1;
      if (this.isJumping && 0 >= this.currentJumpPower && isSlopeFace) {
        this.isJumping = false;
        this.isGrounded = true;
      }
    }
    this.position.add(translate);
    this.object.position.copy(this.position);
    this.object.rotation.y = this.direction + Math.PI;
  }
  setDirection() {
  }
  jump() {
    if (this.isJumping || !this.isGrounded || this.isOnSlope) return;
    this.jumpStartTime = performance.now();
    this.currentJumpPower = 1;
    this.isJumping = true;
  }
  _updateJumping() {
    if (!this.isJumping) return;
    const elapsed = performance.now() - this.jumpStartTime;
    const progress = elapsed / JUMP_DURATION;
    this.currentJumpPower = Math.cos(Math.min(progress, 1) * Math.PI);
  }
  teleport(x, y, z) {
    this.position.set(x, y, z);
    this.object.position.copy(this.position);
  }
};
var sphere = new THREE2.Sphere();
var World = class {
  constructor({ fps = 60, stepsPerFrame = 4 } = {}) {
    this.colliderPool = [];
    this.characterPool = [];
    this._fps = fps;
    this._stepsPerFrame = stepsPerFrame;
  }
  add(object) {
    if (object instanceof Octree) {
      this.colliderPool.push(object);
    }
    if (object instanceof CharacterController) {
      this.characterPool.push(object);
    }
  }
  remove(object) {
    if (object instanceof Octree) {
      const index = this.colliderPool.indexOf(object);
      if (index !== -1) this.colliderPool.splice(index, 1);
    }
    if (object instanceof CharacterController) {
      const index = this.characterPool.indexOf(object);
      if (index !== -1) this.characterPool.splice(index, 1);
    }
  }
  fixedUpdate() {
    const deltaTime = 1 / this._fps;
    const stepDeltaTime = deltaTime / this._stepsPerFrame;
    for (let i = 0; i < this._stepsPerFrame; i++) {
      this.step(stepDeltaTime);
    }
  }
  step(stepDeltaTime) {
    for (let i = 0, l = this.characterPool.length; i < l; i++) {
      const character = this.characterPool[i];
      let triangles = [];
      for (let ii = 0, ll = this.colliderPool.length; ii < ll; ii++) {
        const octree = this.colliderPool[ii];
        sphere.center.set(0, character.radius, 0).add(character.position);
        sphere.radius = character.radius + character.groundCheckDepth;
        triangles.push(...octree.getSphereTriangles(sphere, []));
      }
      character.setNearTriangles(triangles);
      character.update(stepDeltaTime);
    }
  }
};
var KEY_W = 87;
var KEY_UP = 38;
var KEY_S = 83;
var KEY_DOWN = 40;
var KEY_A = 65;
var KEY_LEFT = 37;
var KEY_D = 68;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;
var DEG2RAD$1 = Math.PI / 180;
var DEG_0 = 0 * DEG2RAD$1;
var DEG_45 = 45 * DEG2RAD$1;
var DEG_90 = 90 * DEG2RAD$1;
var DEG_135 = 135 * DEG2RAD$1;
var DEG_180 = 180 * DEG2RAD$1;
var DEG_225 = 225 * DEG2RAD$1;
var DEG_270 = 270 * DEG2RAD$1;
var DEG_315 = 315 * DEG2RAD$1;
var KeyInputControl = class extends EventDispatcher$1 {
  constructor() {
    super();
    this.isDisabled = false;
    this.isUp = false;
    this.isDown = false;
    this.isLeft = false;
    this.isRight = false;
    this.isMoveKeyHolding = false;
    this.frontAngle = 0;
    this._keydownListener = (event) => {
      if (this.isDisabled) return;
      if (isInputEvent(event)) return;
      switch (event.keyCode) {
        case KEY_W:
        case KEY_UP:
          this.isUp = true;
          break;
        case KEY_S:
        case KEY_DOWN:
          this.isDown = true;
          break;
        case KEY_A:
        case KEY_LEFT:
          this.isLeft = true;
          break;
        case KEY_D:
        case KEY_RIGHT:
          this.isRight = true;
          break;
        case KEY_SPACE:
          this.jump();
          break;
        default:
          return;
      }
      const prevAngle = this.frontAngle;
      this.updateAngle();
      if (prevAngle !== this.frontAngle) {
        this.dispatchEvent({ type: "movekeychange" });
      }
      if ((this.isUp || this.isDown || this.isLeft || this.isRight) && !this.isMoveKeyHolding) {
        this.isMoveKeyHolding = true;
        this.dispatchEvent({ type: "movekeyon" });
      }
    };
    this._keyupListener = (event) => {
      if (this.isDisabled) return;
      switch (event.keyCode) {
        case KEY_W:
        case KEY_UP:
          this.isUp = false;
          break;
        case KEY_S:
        case KEY_DOWN:
          this.isDown = false;
          break;
        case KEY_A:
        case KEY_LEFT:
          this.isLeft = false;
          break;
        case KEY_D:
        case KEY_RIGHT:
          this.isRight = false;
          break;
        case KEY_SPACE:
          break;
        default:
          return;
      }
      const prevAngle = this.frontAngle;
      this.updateAngle();
      if (prevAngle !== this.frontAngle) {
        this.dispatchEvent({ type: "movekeychange" });
      }
      if (!this.isUp && !this.isDown && !this.isLeft && !this.isRight && (event.keyCode === KEY_W || event.keyCode === KEY_UP || event.keyCode === KEY_S || event.keyCode === KEY_DOWN || event.keyCode === KEY_A || event.keyCode === KEY_LEFT || event.keyCode === KEY_D || event.keyCode === KEY_RIGHT)) {
        this.isMoveKeyHolding = false;
        this.dispatchEvent({ type: "movekeyoff" });
      }
    };
    this._blurListener = () => {
      this.isUp = false;
      this.isDown = false;
      this.isLeft = false;
      this.isRight = false;
      if (this.isMoveKeyHolding) {
        this.isMoveKeyHolding = false;
        this.dispatchEvent({ type: "movekeyoff" });
      }
    };
    function isInputEvent(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA" || target.tagName === "BUTTON" || target.isContentEditable;
    }
    window.addEventListener("keydown", this._keydownListener);
    window.addEventListener("keyup", this._keyupListener);
    window.addEventListener("blur", this._blurListener);
    window.addEventListener("contextmenu", this._blurListener);
  }
  jump() {
    this.dispatchEvent({ type: "jumpkeypress" });
  }
  updateAngle() {
    const up = this.isUp;
    const down = this.isDown;
    const left = this.isLeft;
    const right = this.isRight;
    if (up && !left && !down && !right) this.frontAngle = DEG_0;
    else if (up && left && !down && !right) this.frontAngle = DEG_45;
    else if (!up && left && !down && !right) this.frontAngle = DEG_90;
    else if (!up && left && down && !right) this.frontAngle = DEG_135;
    else if (!up && !left && down && !right) this.frontAngle = DEG_180;
    else if (!up && !left && down && right) this.frontAngle = DEG_225;
    else if (!up && !left && !down && right) this.frontAngle = DEG_270;
    else if (up && !left && !down && right) this.frontAngle = DEG_315;
  }
  dispose() {
    window.removeEventListener("keydown", this._keydownListener);
    window.removeEventListener("keyup", this._keyupListener);
    window.removeEventListener("blur", this._blurListener);
    this._blurListener();
  }
};
var MOUSE_BUTTON = {
  LEFT: 1,
  RIGHT: 2,
  MIDDLE: 4
};
var ACTION = Object.freeze({
  NONE: 0,
  ROTATE: 1,
  TRUCK: 2,
  OFFSET: 4,
  DOLLY: 8,
  ZOOM: 16,
  TOUCH_ROTATE: 32,
  TOUCH_TRUCK: 64,
  TOUCH_OFFSET: 128,
  TOUCH_DOLLY: 256,
  TOUCH_ZOOM: 512,
  TOUCH_DOLLY_TRUCK: 1024,
  TOUCH_DOLLY_OFFSET: 2048,
  TOUCH_DOLLY_ROTATE: 4096,
  TOUCH_ZOOM_TRUCK: 8192,
  TOUCH_ZOOM_OFFSET: 16384,
  TOUCH_ZOOM_ROTATE: 32768
});
function isPerspectiveCamera(camera) {
  return camera.isPerspectiveCamera;
}
function isOrthographicCamera(camera) {
  return camera.isOrthographicCamera;
}
var PI_2 = Math.PI * 2;
var PI_HALF = Math.PI / 2;
var EPSILON = 1e-5;
var DEG2RAD = Math.PI / 180;
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function approxZero(number, error = EPSILON) {
  return Math.abs(number) < error;
}
function approxEquals(a, b, error = EPSILON) {
  return approxZero(a - b, error);
}
function roundToStep(value, step) {
  return Math.round(value / step) * step;
}
function infinityToMaxNumber(value) {
  if (isFinite(value)) return value;
  if (value < 0) return -Number.MAX_VALUE;
  return Number.MAX_VALUE;
}
function maxNumberToInfinity(value) {
  if (Math.abs(value) < Number.MAX_VALUE) return value;
  return value * Infinity;
}
function smoothDamp(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime) {
  smoothTime = Math.max(1e-4, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;
  const temp = (currentVelocityRef.value + omega * change) * deltaTime;
  currentVelocityRef.value = (currentVelocityRef.value - omega * temp) * exp;
  let output = target + (change + temp) * exp;
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    currentVelocityRef.value = (output - originalTo) / deltaTime;
  }
  return output;
}
function smoothDampVec3(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime, out) {
  smoothTime = Math.max(1e-4, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let targetX = target.x;
  let targetY = target.y;
  let targetZ = target.z;
  let changeX = current.x - targetX;
  let changeY = current.y - targetY;
  let changeZ = current.z - targetZ;
  const originalToX = targetX;
  const originalToY = targetY;
  const originalToZ = targetZ;
  const maxChange = maxSpeed * smoothTime;
  const maxChangeSq = maxChange * maxChange;
  const magnitudeSq = changeX * changeX + changeY * changeY + changeZ * changeZ;
  if (magnitudeSq > maxChangeSq) {
    const magnitude = Math.sqrt(magnitudeSq);
    changeX = changeX / magnitude * maxChange;
    changeY = changeY / magnitude * maxChange;
    changeZ = changeZ / magnitude * maxChange;
  }
  targetX = current.x - changeX;
  targetY = current.y - changeY;
  targetZ = current.z - changeZ;
  const tempX = (currentVelocityRef.x + omega * changeX) * deltaTime;
  const tempY = (currentVelocityRef.y + omega * changeY) * deltaTime;
  const tempZ = (currentVelocityRef.z + omega * changeZ) * deltaTime;
  currentVelocityRef.x = (currentVelocityRef.x - omega * tempX) * exp;
  currentVelocityRef.y = (currentVelocityRef.y - omega * tempY) * exp;
  currentVelocityRef.z = (currentVelocityRef.z - omega * tempZ) * exp;
  out.x = targetX + (changeX + tempX) * exp;
  out.y = targetY + (changeY + tempY) * exp;
  out.z = targetZ + (changeZ + tempZ) * exp;
  const origMinusCurrentX = originalToX - current.x;
  const origMinusCurrentY = originalToY - current.y;
  const origMinusCurrentZ = originalToZ - current.z;
  const outMinusOrigX = out.x - originalToX;
  const outMinusOrigY = out.y - originalToY;
  const outMinusOrigZ = out.z - originalToZ;
  if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY + origMinusCurrentZ * outMinusOrigZ > 0) {
    out.x = originalToX;
    out.y = originalToY;
    out.z = originalToZ;
    currentVelocityRef.x = (out.x - originalToX) / deltaTime;
    currentVelocityRef.y = (out.y - originalToY) / deltaTime;
    currentVelocityRef.z = (out.z - originalToZ) / deltaTime;
  }
  return out;
}
function extractClientCoordFromEvent(pointers, out) {
  out.set(0, 0);
  pointers.forEach((pointer) => {
    out.x += pointer.clientX;
    out.y += pointer.clientY;
  });
  out.x /= pointers.length;
  out.y /= pointers.length;
}
function notSupportedInOrthographicCamera(camera, message) {
  if (isOrthographicCamera(camera)) {
    console.warn(`${message} is not supported in OrthographicCamera`);
    return true;
  }
  return false;
}
var EventDispatcher3 = class {
  constructor() {
    this._listeners = {};
  }
  /**
   * Adds the specified event listener.
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  addEventListener(type, listener) {
    const listeners = this._listeners;
    if (listeners[type] === void 0) listeners[type] = [];
    if (listeners[type].indexOf(listener) === -1)
      listeners[type].push(listener);
  }
  /**
   * Presence of the specified event listener.
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  hasEventListener(type, listener) {
    const listeners = this._listeners;
    return listeners[type] !== void 0 && listeners[type].indexOf(listener) !== -1;
  }
  /**
   * Removes the specified event listener
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  removeEventListener(type, listener) {
    const listeners = this._listeners;
    const listenerArray = listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) listenerArray.splice(index, 1);
    }
  }
  /**
   * Removes all event listeners
   * @param type event name
   * @category Methods
   */
  removeAllEventListeners(type) {
    if (!type) {
      this._listeners = {};
      return;
    }
    if (Array.isArray(this._listeners[type]))
      this._listeners[type].length = 0;
  }
  /**
   * Fire an event type.
   * @param event DispatcherEvent
   * @category Methods
   */
  dispatchEvent(event) {
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== void 0) {
      event.target = this;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
    }
  }
};
var VERSION = "2.3.4";
var TOUCH_DOLLY_FACTOR = 1 / 8;
var isBrowser = typeof window !== "undefined";
var isMac = isBrowser && /Mac/.test(navigator.platform);
var isPointerEventsNotSupported = !(isBrowser && "PointerEvent" in window);
var THREE;
var _ORIGIN$1;
var _AXIS_Y;
var _AXIS_Z;
var _v2;
var _v3A$1;
var _v3B$1;
var _v3C$1;
var _xColumn;
var _yColumn;
var _zColumn;
var _deltaTarget;
var _deltaOffset;
var _sphericalA;
var _sphericalB;
var _box3A;
var _box3B;
var _sphere;
var _quaternionA;
var _quaternionB;
var _rotationMatrix$1;
var _raycaster2;
var CameraControls = class _CameraControls extends EventDispatcher3 {
  /**
       * Injects THREE as the dependency. You can then proceed to use CameraControls.
       *
       * e.g
       * ```javascript
       * CameraControls.install( { THREE: THREE } );
       * ```
       *
       * Note: If you do not wish to use enter three.js to reduce file size(tree-shaking for example), make a subset to install.
       *
       * ```js
       * import {
       * 	Vector2,
       * 	Vector3,
       * 	Vector4,
       * 	Quaternion,
       * 	Matrix4,
       * 	Spherical,
       * 	Box3,
       * 	Sphere,
       * 	Raycaster,
       * 	MathUtils,
       * } from 'three';
       *
       * const subsetOfTHREE = {
       * 	Vector2   : Vector2,
       * 	Vector3   : Vector3,
       * 	Vector4   : Vector4,
       * 	Quaternion: Quaternion,
       * 	Matrix4   : Matrix4,
       * 	Spherical : Spherical,
       * 	Box3      : Box3,
       * 	Sphere    : Sphere,
       * 	Raycaster : Raycaster,
       * };
  
       * CameraControls.install( { THREE: subsetOfTHREE } );
       * ```
       * @category Statics
       */
  static install(libs) {
    THREE = libs.THREE;
    _ORIGIN$1 = Object.freeze(new THREE.Vector3(0, 0, 0));
    _AXIS_Y = Object.freeze(new THREE.Vector3(0, 1, 0));
    _AXIS_Z = Object.freeze(new THREE.Vector3(0, 0, 1));
    _v2 = new THREE.Vector2();
    _v3A$1 = new THREE.Vector3();
    _v3B$1 = new THREE.Vector3();
    _v3C$1 = new THREE.Vector3();
    _xColumn = new THREE.Vector3();
    _yColumn = new THREE.Vector3();
    _zColumn = new THREE.Vector3();
    _deltaTarget = new THREE.Vector3();
    _deltaOffset = new THREE.Vector3();
    _sphericalA = new THREE.Spherical();
    _sphericalB = new THREE.Spherical();
    _box3A = new THREE.Box3();
    _box3B = new THREE.Box3();
    _sphere = new THREE.Sphere();
    _quaternionA = new THREE.Quaternion();
    _quaternionB = new THREE.Quaternion();
    _rotationMatrix$1 = new THREE.Matrix4();
    _raycaster2 = new THREE.Raycaster();
  }
  /**
   * list all ACTIONs
   * @category Statics
   */
  static get ACTION() {
    return ACTION;
  }
  /**
   * Creates a `CameraControls` instance.
   *
   * Note:
   * You **must install** three.js before using camera-controls. see [#install](#install)
   * Not doing so will lead to runtime errors (`undefined` references to THREE).
   *
   * e.g.
   * ```
   * CameraControls.install( { THREE } );
   * const cameraControls = new CameraControls( camera, domElement );
   * ```
   *
   * @param camera A `THREE.PerspectiveCamera` or `THREE.OrthographicCamera` to be controlled.
   * @param domElement A `HTMLElement` for the draggable area, usually `renderer.domElement`.
   * @category Constructor
   */
  constructor(camera, domElement) {
    super();
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.infinityDolly = false;
    this.minZoom = 0.01;
    this.maxZoom = Infinity;
    this.smoothTime = 0.25;
    this.draggingSmoothTime = 0.125;
    this.maxSpeed = Infinity;
    this.azimuthRotateSpeed = 1;
    this.polarRotateSpeed = 1;
    this.dollySpeed = 1;
    this.dollyDragInverted = false;
    this.truckSpeed = 2;
    this.dollyToCursor = false;
    this.dragToOffset = false;
    this.verticalDragToForward = false;
    this.boundaryFriction = 0;
    this.restThreshold = 0.01;
    this.colliderMeshes = [];
    this.cancel = () => {
    };
    this._enabled = true;
    this._state = ACTION.NONE;
    this._viewport = null;
    this._dollyControlAmount = 0;
    this._hasRested = true;
    this._boundaryEnclosesCamera = false;
    this._needsUpdate = true;
    this._updatedLastTime = false;
    this._elementRect = new DOMRect();
    this._activePointers = [];
    this._isUserControllingRotate = false;
    this._isUserControllingDolly = false;
    this._isUserControllingTruck = false;
    this._isUserControllingOffset = false;
    this._isUserControllingZoom = false;
    this._thetaVelocity = { value: 0 };
    this._phiVelocity = { value: 0 };
    this._radiusVelocity = { value: 0 };
    this._targetVelocity = new THREE.Vector3();
    this._focalOffsetVelocity = new THREE.Vector3();
    this._zoomVelocity = { value: 0 };
    this._truckInternal = (deltaX, deltaY, dragToOffset) => {
      if (isPerspectiveCamera(this._camera)) {
        const offset = _v3A$1.copy(this._camera.position).sub(this._target);
        const fov = this._camera.getEffectiveFOV() * DEG2RAD;
        const targetDistance = offset.length() * Math.tan(fov * 0.5);
        const truckX = this.truckSpeed * deltaX * targetDistance / this._elementRect.height;
        const pedestalY = this.truckSpeed * deltaY * targetDistance / this._elementRect.height;
        if (this.verticalDragToForward) {
          dragToOffset ? this.setFocalOffset(
            this._focalOffsetEnd.x + truckX,
            this._focalOffsetEnd.y,
            this._focalOffsetEnd.z,
            true
          ) : this.truck(truckX, 0, true);
          this.forward(-pedestalY, true);
        } else {
          dragToOffset ? this.setFocalOffset(
            this._focalOffsetEnd.x + truckX,
            this._focalOffsetEnd.y + pedestalY,
            this._focalOffsetEnd.z,
            true
          ) : this.truck(truckX, pedestalY, true);
        }
      } else if (isOrthographicCamera(this._camera)) {
        const camera2 = this._camera;
        const truckX = deltaX * (camera2.right - camera2.left) / camera2.zoom / this._elementRect.width;
        const pedestalY = deltaY * (camera2.top - camera2.bottom) / camera2.zoom / this._elementRect.height;
        dragToOffset ? this.setFocalOffset(
          this._focalOffsetEnd.x + truckX,
          this._focalOffsetEnd.y + pedestalY,
          this._focalOffsetEnd.z,
          true
        ) : this.truck(truckX, pedestalY, true);
      }
    };
    this._rotateInternal = (deltaX, deltaY) => {
      const theta = PI_2 * this.azimuthRotateSpeed * deltaX / this._elementRect.height;
      const phi = PI_2 * this.polarRotateSpeed * deltaY / this._elementRect.height;
      this.rotate(theta, phi, true);
    };
    this._dollyInternal = (delta, x, y) => {
      const dollyScale = Math.pow(0.95, -delta * this.dollySpeed);
      const distance = this._sphericalEnd.radius * dollyScale;
      const prevRadius = this._sphericalEnd.radius;
      const signedPrevRadius = prevRadius * (delta >= 0 ? -1 : 1);
      this.dollyTo(distance);
      if (this.infinityDolly && (distance < this.minDistance || this.maxDistance === this.minDistance)) {
        this._camera.getWorldDirection(_v3A$1);
        this._targetEnd.add(
          _v3A$1.normalize().multiplyScalar(signedPrevRadius)
        );
        this._target.add(
          _v3A$1.normalize().multiplyScalar(signedPrevRadius)
        );
      }
      if (this.dollyToCursor) {
        this._dollyControlAmount += this._sphericalEnd.radius - prevRadius;
        if (this.infinityDolly && (distance < this.minDistance || this.maxDistance === this.minDistance)) {
          this._dollyControlAmount -= signedPrevRadius;
        }
        this._dollyControlCoord.set(x, y);
      }
    };
    this._zoomInternal = (delta, x, y) => {
      const zoomScale = Math.pow(0.95, delta * this.dollySpeed);
      const prevZoom = this._zoomEnd;
      this.zoomTo(this._zoom * zoomScale);
      if (this.dollyToCursor) {
        this._dollyControlAmount += this._zoomEnd - prevZoom;
        this._dollyControlCoord.set(x, y);
      }
    };
    if (typeof THREE === "undefined") {
      console.error(
        "camera-controls: `THREE` is undefined. You must first run `CameraControls.install( { THREE: THREE } )`. Check the docs for further information."
      );
    }
    this._camera = camera;
    this._yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(
      this._camera.up,
      _AXIS_Y
    );
    this._yAxisUpSpaceInverse = this._yAxisUpSpace.clone().invert();
    this._state = ACTION.NONE;
    this._target = new THREE.Vector3();
    this._targetEnd = this._target.clone();
    this._focalOffset = new THREE.Vector3();
    this._focalOffsetEnd = this._focalOffset.clone();
    this._spherical = new THREE.Spherical().setFromVector3(
      _v3A$1.copy(this._camera.position).applyQuaternion(this._yAxisUpSpace)
    );
    this._sphericalEnd = this._spherical.clone();
    this._zoom = this._camera.zoom;
    this._zoomEnd = this._zoom;
    this._nearPlaneCorners = [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3()
    ];
    this._updateNearPlaneCorners();
    this._boundary = new THREE.Box3(
      new THREE.Vector3(-Infinity, -Infinity, -Infinity),
      new THREE.Vector3(Infinity, Infinity, Infinity)
    );
    this._cameraUp0 = this._camera.up.clone();
    this._target0 = this._target.clone();
    this._position0 = this._camera.position.clone();
    this._zoom0 = this._zoom;
    this._focalOffset0 = this._focalOffset.clone();
    this._dollyControlAmount = 0;
    this._dollyControlCoord = new THREE.Vector2();
    this.mouseButtons = {
      left: ACTION.ROTATE,
      middle: ACTION.DOLLY,
      right: ACTION.TRUCK,
      wheel: isPerspectiveCamera(this._camera) ? ACTION.DOLLY : isOrthographicCamera(this._camera) ? ACTION.ZOOM : ACTION.NONE
    };
    this.touches = {
      one: ACTION.TOUCH_ROTATE,
      two: isPerspectiveCamera(this._camera) ? ACTION.TOUCH_DOLLY_TRUCK : isOrthographicCamera(this._camera) ? ACTION.TOUCH_ZOOM_TRUCK : ACTION.NONE,
      three: ACTION.TOUCH_TRUCK
    };
    const dragStartPosition = new THREE.Vector2();
    const lastDragPosition = new THREE.Vector2();
    const dollyStart = new THREE.Vector2();
    const onPointerDown = (event) => {
      if (!this._enabled || !this._domElement) return;
      const mouseButton = event.pointerType !== "mouse" ? null : (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.LEFT : (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE ? MOUSE_BUTTON.MIDDLE : (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT ? MOUSE_BUTTON.RIGHT : null;
      if (mouseButton !== null) {
        const zombiePointer = this._findPointerByMouseButton(mouseButton);
        zombiePointer && this._activePointers.splice(
          this._activePointers.indexOf(zombiePointer),
          1
        );
      }
      const pointer = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        deltaX: 0,
        deltaY: 0,
        mouseButton
      };
      this._activePointers.push(pointer);
      this._domElement.ownerDocument.removeEventListener(
        "pointermove",
        onPointerMove,
        { passive: false }
      );
      this._domElement.ownerDocument.removeEventListener(
        "pointerup",
        onPointerUp
      );
      this._domElement.ownerDocument.addEventListener(
        "pointermove",
        onPointerMove,
        { passive: false }
      );
      this._domElement.ownerDocument.addEventListener(
        "pointerup",
        onPointerUp
      );
      startDragging(event);
    };
    const onMouseDown = (event) => {
      if (!this._enabled || !this._domElement) return;
      const mouseButton = (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.LEFT : (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE ? MOUSE_BUTTON.MIDDLE : (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT ? MOUSE_BUTTON.RIGHT : null;
      if (mouseButton !== null) {
        const zombiePointer = this._findPointerByMouseButton(mouseButton);
        zombiePointer && this._activePointers.splice(
          this._activePointers.indexOf(zombiePointer),
          1
        );
      }
      const pointer = {
        pointerId: 0,
        clientX: event.clientX,
        clientY: event.clientY,
        deltaX: 0,
        deltaY: 0,
        mouseButton: (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.LEFT : (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.MIDDLE : (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.RIGHT : null
      };
      this._activePointers.push(pointer);
      this._domElement.ownerDocument.removeEventListener(
        "mousemove",
        onMouseMove
      );
      this._domElement.ownerDocument.removeEventListener(
        "mouseup",
        onMouseUp
      );
      this._domElement.ownerDocument.addEventListener(
        "mousemove",
        onMouseMove
      );
      this._domElement.ownerDocument.addEventListener(
        "mouseup",
        onMouseUp
      );
      startDragging(event);
    };
    const onPointerMove = (event) => {
      if (event.cancelable) event.preventDefault();
      const pointerId = event.pointerId;
      const pointer = this._findPointerById(pointerId);
      if (!pointer) return;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.deltaX = event.movementX;
      pointer.deltaY = event.movementY;
      if (event.pointerType === "touch") {
        switch (this._activePointers.length) {
          case 1:
            this._state = this.touches.one;
            break;
          case 2:
            this._state = this.touches.two;
            break;
          case 3:
            this._state = this.touches.three;
            break;
        }
      } else {
        this._state = 0;
        if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
          this._state = this._state | this.mouseButtons.left;
        }
        if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
          this._state = this._state | this.mouseButtons.middle;
        }
        if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
          this._state = this._state | this.mouseButtons.right;
        }
      }
      dragging();
    };
    const onMouseMove = (event) => {
      const pointer = this._findPointerById(0);
      if (!pointer) return;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.deltaX = event.movementX;
      pointer.deltaY = event.movementY;
      this._state = 0;
      if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
        this._state = this._state | this.mouseButtons.left;
      }
      if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
        this._state = this._state | this.mouseButtons.middle;
      }
      if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
        this._state = this._state | this.mouseButtons.right;
      }
      dragging();
    };
    const onPointerUp = (event) => {
      const pointerId = event.pointerId;
      const pointer = this._findPointerById(pointerId);
      pointer && this._activePointers.splice(
        this._activePointers.indexOf(pointer),
        1
      );
      if (event.pointerType === "touch") {
        switch (this._activePointers.length) {
          case 0:
            this._state = ACTION.NONE;
            break;
          case 1:
            this._state = this.touches.one;
            break;
          case 2:
            this._state = this.touches.two;
            break;
          case 3:
            this._state = this.touches.three;
            break;
        }
      } else {
        this._state = ACTION.NONE;
      }
      endDragging();
    };
    const onMouseUp = () => {
      const pointer = this._findPointerById(0);
      pointer && this._activePointers.splice(
        this._activePointers.indexOf(pointer),
        1
      );
      this._state = ACTION.NONE;
      endDragging();
    };
    let lastScrollTimeStamp = -1;
    const onMouseWheel = (event) => {
      if (!this._enabled || this.mouseButtons.wheel === ACTION.NONE)
        return;
      event.preventDefault();
      if (this.dollyToCursor || this.mouseButtons.wheel === ACTION.ROTATE || this.mouseButtons.wheel === ACTION.TRUCK) {
        const now = performance.now();
        if (lastScrollTimeStamp - now < 1e3)
          this._getClientRect(this._elementRect);
        lastScrollTimeStamp = now;
      }
      const deltaYFactor = isMac ? -1 : -3;
      const delta = event.deltaMode === 1 ? event.deltaY / deltaYFactor : event.deltaY / (deltaYFactor * 10);
      const x = this.dollyToCursor ? (event.clientX - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
      const y = this.dollyToCursor ? (event.clientY - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
      switch (this.mouseButtons.wheel) {
        case ACTION.ROTATE: {
          this._rotateInternal(event.deltaX, event.deltaY);
          this._isUserControllingRotate = true;
          break;
        }
        case ACTION.TRUCK: {
          this._truckInternal(event.deltaX, event.deltaY, false);
          this._isUserControllingTruck = true;
          break;
        }
        case ACTION.OFFSET: {
          this._truckInternal(event.deltaX, event.deltaY, true);
          this._isUserControllingOffset = true;
          break;
        }
        case ACTION.DOLLY: {
          this._dollyInternal(-delta, x, y);
          this._isUserControllingDolly = true;
          break;
        }
        case ACTION.ZOOM: {
          this._zoomInternal(-delta, x, y);
          this._isUserControllingZoom = true;
          break;
        }
      }
      this.dispatchEvent({ type: "control" });
    };
    const onContextMenu = (event) => {
      if (!this._domElement || !this._enabled) return;
      if (this.mouseButtons.right === _CameraControls.ACTION.NONE) {
        const pointerId = event instanceof PointerEvent ? event.pointerId : event instanceof MouseEvent ? 0 : 0;
        const pointer = this._findPointerById(pointerId);
        pointer && this._activePointers.splice(
          this._activePointers.indexOf(pointer),
          1
        );
        this._domElement.ownerDocument.removeEventListener(
          "pointermove",
          onPointerMove,
          { passive: false }
        );
        this._domElement.ownerDocument.removeEventListener(
          "pointerup",
          onPointerUp
        );
        this._domElement.ownerDocument.removeEventListener(
          "mousemove",
          onMouseMove
        );
        this._domElement.ownerDocument.removeEventListener(
          "mouseup",
          onMouseUp
        );
        return;
      }
      event.preventDefault();
    };
    const startDragging = (event) => {
      if (!this._enabled) return;
      extractClientCoordFromEvent(this._activePointers, _v2);
      this._getClientRect(this._elementRect);
      dragStartPosition.copy(_v2);
      lastDragPosition.copy(_v2);
      const isMultiTouch = this._activePointers.length >= 2;
      if (isMultiTouch) {
        const dx = _v2.x - this._activePointers[1].clientX;
        const dy = _v2.y - this._activePointers[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        dollyStart.set(0, distance);
        const x = (this._activePointers[0].clientX + this._activePointers[1].clientX) * 0.5;
        const y = (this._activePointers[0].clientY + this._activePointers[1].clientY) * 0.5;
        lastDragPosition.set(x, y);
      }
      if ("pointerType" in event && event.pointerType === "touch") {
        switch (this._activePointers.length) {
          case 1:
            this._state = this.touches.one;
            break;
          case 2:
            this._state = this.touches.two;
            break;
          case 3:
            this._state = this.touches.three;
            break;
        }
      } else {
        this._state = 0;
        if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
          this._state = this._state | this.mouseButtons.left;
        }
        if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
          this._state = this._state | this.mouseButtons.middle;
        }
        if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
          this._state = this._state | this.mouseButtons.right;
        }
      }
      if ((this._state & ACTION.ROTATE) === ACTION.ROTATE || (this._state & ACTION.TOUCH_ROTATE) === ACTION.TOUCH_ROTATE || (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE || (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
        this._sphericalEnd.theta = this._spherical.theta;
        this._sphericalEnd.phi = this._spherical.phi;
        this._thetaVelocity.value = 0;
        this._phiVelocity.value = 0;
      }
      if ((this._state & ACTION.TRUCK) === ACTION.TRUCK || (this._state & ACTION.TOUCH_TRUCK) === ACTION.TOUCH_TRUCK || (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK || (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK) {
        this._targetEnd.copy(this._target);
        this._targetVelocity.set(0, 0, 0);
      }
      if ((this._state & ACTION.DOLLY) === ACTION.DOLLY || (this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY || (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK || (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET || (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE) {
        this._sphericalEnd.radius = this._spherical.radius;
        this._radiusVelocity.value = 0;
      }
      if ((this._state & ACTION.ZOOM) === ACTION.ZOOM || (this._state & ACTION.TOUCH_ZOOM) === ACTION.TOUCH_ZOOM || (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK || (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET || (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
        this._zoomEnd = this._zoom;
        this._zoomVelocity.value = 0;
      }
      if ((this._state & ACTION.OFFSET) === ACTION.OFFSET || (this._state & ACTION.TOUCH_OFFSET) === ACTION.TOUCH_OFFSET || (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET || (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET) {
        this._focalOffsetEnd.copy(this._focalOffset);
        this._focalOffsetVelocity.set(0, 0, 0);
      }
      this.dispatchEvent({ type: "controlstart" });
    };
    const dragging = () => {
      if (!this._enabled) return;
      extractClientCoordFromEvent(this._activePointers, _v2);
      const isPointerLockActive = this._domElement && document.pointerLockElement === this._domElement;
      const deltaX = isPointerLockActive ? -this._activePointers[0].deltaX : lastDragPosition.x - _v2.x;
      const deltaY = isPointerLockActive ? -this._activePointers[0].deltaY : lastDragPosition.y - _v2.y;
      lastDragPosition.copy(_v2);
      if ((this._state & ACTION.ROTATE) === ACTION.ROTATE || (this._state & ACTION.TOUCH_ROTATE) === ACTION.TOUCH_ROTATE || (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE || (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
        this._rotateInternal(deltaX, deltaY);
        this._isUserControllingRotate = true;
      }
      if ((this._state & ACTION.DOLLY) === ACTION.DOLLY || (this._state & ACTION.ZOOM) === ACTION.ZOOM) {
        const dollyX = this.dollyToCursor ? (dragStartPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
        const dollyY = this.dollyToCursor ? (dragStartPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
        const dollyDirection = this.dollyDragInverted ? -1 : 1;
        if ((this._state & ACTION.DOLLY) === ACTION.DOLLY) {
          this._dollyInternal(
            dollyDirection * deltaY * TOUCH_DOLLY_FACTOR,
            dollyX,
            dollyY
          );
          this._isUserControllingDolly = true;
        } else {
          this._zoomInternal(
            dollyDirection * deltaY * TOUCH_DOLLY_FACTOR,
            dollyX,
            dollyY
          );
          this._isUserControllingZoom = true;
        }
      }
      if ((this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY || (this._state & ACTION.TOUCH_ZOOM) === ACTION.TOUCH_ZOOM || (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK || (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK || (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET || (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET || (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE || (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
        const dx = _v2.x - this._activePointers[1].clientX;
        const dy = _v2.y - this._activePointers[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dollyDelta = dollyStart.y - distance;
        dollyStart.set(0, distance);
        const dollyX = this.dollyToCursor ? (lastDragPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
        const dollyY = this.dollyToCursor ? (lastDragPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
        if ((this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY || (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE || (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK || (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET) {
          this._dollyInternal(
            dollyDelta * TOUCH_DOLLY_FACTOR,
            dollyX,
            dollyY
          );
          this._isUserControllingDolly = true;
        } else {
          this._zoomInternal(
            dollyDelta * TOUCH_DOLLY_FACTOR,
            dollyX,
            dollyY
          );
          this._isUserControllingZoom = true;
        }
      }
      if ((this._state & ACTION.TRUCK) === ACTION.TRUCK || (this._state & ACTION.TOUCH_TRUCK) === ACTION.TOUCH_TRUCK || (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK || (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK) {
        this._truckInternal(deltaX, deltaY, false);
        this._isUserControllingTruck = true;
      }
      if ((this._state & ACTION.OFFSET) === ACTION.OFFSET || (this._state & ACTION.TOUCH_OFFSET) === ACTION.TOUCH_OFFSET || (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET || (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET) {
        this._truckInternal(deltaX, deltaY, true);
        this._isUserControllingOffset = true;
      }
      this.dispatchEvent({ type: "control" });
    };
    const endDragging = () => {
      extractClientCoordFromEvent(this._activePointers, _v2);
      lastDragPosition.copy(_v2);
      if (this._activePointers.length === 0 && this._domElement) {
        this._domElement.ownerDocument.removeEventListener(
          "pointermove",
          onPointerMove,
          { passive: false }
        );
        this._domElement.ownerDocument.removeEventListener(
          "mousemove",
          onMouseMove
        );
        this._domElement.ownerDocument.removeEventListener(
          "pointerup",
          onPointerUp
        );
        this._domElement.ownerDocument.removeEventListener(
          "mouseup",
          onMouseUp
        );
        this.dispatchEvent({ type: "controlend" });
      }
    };
    this._addAllEventListeners = (domElement2) => {
      this._domElement = domElement2;
      this._domElement.style.touchAction = "none";
      this._domElement.style.userSelect = "none";
      this._domElement.style.webkitUserSelect = "none";
      this._domElement.addEventListener("pointerdown", onPointerDown);
      isPointerEventsNotSupported && this._domElement.addEventListener("mousedown", onMouseDown);
      this._domElement.addEventListener("pointercancel", onPointerUp);
      this._domElement.addEventListener("wheel", onMouseWheel, {
        passive: false
      });
      this._domElement.addEventListener("contextmenu", onContextMenu);
    };
    this._removeAllEventListeners = () => {
      if (!this._domElement) return;
      this._domElement.style.touchAction = "";
      this._domElement.style.userSelect = "";
      this._domElement.style.webkitUserSelect = "";
      this._domElement.removeEventListener("pointerdown", onPointerDown);
      this._domElement.removeEventListener("mousedown", onMouseDown);
      this._domElement.removeEventListener("pointercancel", onPointerUp);
      this._domElement.removeEventListener("wheel", onMouseWheel, {
        passive: false
      });
      this._domElement.removeEventListener("contextmenu", onContextMenu);
      this._domElement.ownerDocument.removeEventListener(
        "pointermove",
        onPointerMove,
        { passive: false }
      );
      this._domElement.ownerDocument.removeEventListener(
        "mousemove",
        onMouseMove
      );
      this._domElement.ownerDocument.removeEventListener(
        "pointerup",
        onPointerUp
      );
      this._domElement.ownerDocument.removeEventListener(
        "mouseup",
        onMouseUp
      );
    };
    this.cancel = () => {
      if (this._state === ACTION.NONE) return;
      this._state = ACTION.NONE;
      this._activePointers.length = 0;
      endDragging();
    };
    if (domElement) this.connect(domElement);
    this.update(0);
  }
  /**
   * The camera to be controlled
   * @category Properties
   */
  get camera() {
    return this._camera;
  }
  set camera(camera) {
    this._camera = camera;
    this.updateCameraUp();
    this._camera.updateProjectionMatrix();
    this._updateNearPlaneCorners();
    this._needsUpdate = true;
  }
  /**
   * Whether or not the controls are enabled.
   * `false` to disable user dragging/touch-move, but all methods works.
   * @category Properties
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(enabled) {
    this._enabled = enabled;
    if (!this._domElement) return;
    if (enabled) {
      this._domElement.style.touchAction = "none";
      this._domElement.style.userSelect = "none";
      this._domElement.style.webkitUserSelect = "none";
    } else {
      this.cancel();
      this._domElement.style.touchAction = "";
      this._domElement.style.userSelect = "";
      this._domElement.style.webkitUserSelect = "";
    }
  }
  /**
   * Returns `true` if the controls are active updating.
   * readonly value.
   * @category Properties
   */
  get active() {
    return !this._hasRested;
  }
  /**
   * Getter for the current `ACTION`.
   * readonly value.
   * @category Properties
   */
  get currentAction() {
    return this._state;
  }
  /**
   * get/set Current distance.
   * @category Properties
   */
  get distance() {
    return this._spherical.radius;
  }
  set distance(distance) {
    if (this._spherical.radius === distance && this._sphericalEnd.radius === distance)
      return;
    this._spherical.radius = distance;
    this._sphericalEnd.radius = distance;
    this._needsUpdate = true;
  }
  // horizontal angle
  /**
   * get/set the azimuth angle (horizontal) in radians.
   * Every 360 degrees turn is added to `.azimuthAngle` value, which is accumulative.
   * @category Properties
   */
  get azimuthAngle() {
    return this._spherical.theta;
  }
  set azimuthAngle(azimuthAngle) {
    if (this._spherical.theta === azimuthAngle && this._sphericalEnd.theta === azimuthAngle)
      return;
    this._spherical.theta = azimuthAngle;
    this._sphericalEnd.theta = azimuthAngle;
    this._needsUpdate = true;
  }
  // vertical angle
  /**
   * get/set the polar angle (vertical) in radians.
   * @category Properties
   */
  get polarAngle() {
    return this._spherical.phi;
  }
  set polarAngle(polarAngle) {
    if (this._spherical.phi === polarAngle && this._sphericalEnd.phi === polarAngle)
      return;
    this._spherical.phi = polarAngle;
    this._sphericalEnd.phi = polarAngle;
    this._needsUpdate = true;
  }
  /**
   * Whether camera position should be enclosed in the boundary or not.
   * @category Properties
   */
  get boundaryEnclosesCamera() {
    return this._boundaryEnclosesCamera;
  }
  set boundaryEnclosesCamera(boundaryEnclosesCamera) {
    this._boundaryEnclosesCamera = boundaryEnclosesCamera;
    this._needsUpdate = true;
  }
  /**
   * Adds the specified event listener.
   * Applicable event types (which is `K`) are:
   * | Event name          | Timing |
   * | ------------------- | ------ |
   * | `'controlstart'`    | When the user starts to control the camera via mouse / touches. ¹ |
   * | `'control'`         | When the user controls the camera (dragging). |
   * | `'controlend'`      | When the user ends to control the camera. ¹ |
   * | `'transitionstart'` | When any kind of transition starts, either user control or using a method with `enableTransition = true` |
   * | `'update'`          | When the camera position is updated. |
   * | `'wake'`            | When the camera starts moving. |
   * | `'rest'`            | When the camera movement is below `.restThreshold` ². |
   * | `'sleep'`           | When the camera end moving. |
   *
   * 1. `mouseButtons.wheel` (Mouse wheel control) does not emit `'controlstart'` and `'controlend'`. `mouseButtons.wheel` uses scroll-event internally, and scroll-event happens intermittently. That means "start" and "end" cannot be detected.
   * 2. Due to damping, `sleep` will usually fire a few seconds after the camera _appears_ to have stopped moving. If you want to do something (e.g. enable UI, perform another transition) at the point when the camera has stopped, you probably want the `rest` event. This can be fine tuned using the `.restThreshold` parameter. See the [Rest and Sleep Example](https://yomotsu.github.io/camera-controls/examples/rest-and-sleep.html).
   *
   * e.g.
   * ```
   * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
   * ```
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  addEventListener(type, listener) {
    super.addEventListener(type, listener);
  }
  /**
   * Removes the specified event listener
   * e.g.
   * ```
   * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
   * ```
   * @param type event name
   * @param listener handler function
   * @category Methods
   */
  removeEventListener(type, listener) {
    super.removeEventListener(type, listener);
  }
  /**
   * Rotate azimuthal angle(horizontal) and polar angle(vertical).
   * Every value is added to the current value.
   * @param azimuthAngle Azimuth rotate angle. In radian.
   * @param polarAngle Polar rotate angle. In radian.
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  rotate(azimuthAngle, polarAngle, enableTransition = false) {
    return this.rotateTo(
      this._sphericalEnd.theta + azimuthAngle,
      this._sphericalEnd.phi + polarAngle,
      enableTransition
    );
  }
  /**
   * Rotate azimuthal angle(horizontal) to the given angle and keep the same polar angle(vertical) target.
   *
   * e.g.
   * ```
   * cameraControls.rotateAzimuthTo( 30 * THREE.MathUtils.DEG2RAD, true );
   * ```
   * @param azimuthAngle Azimuth rotate angle. In radian.
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  rotateAzimuthTo(azimuthAngle, enableTransition = false) {
    return this.rotateTo(
      azimuthAngle,
      this._sphericalEnd.phi,
      enableTransition
    );
  }
  /**
   * Rotate polar angle(vertical) to the given angle and keep the same azimuthal angle(horizontal) target.
   *
   * e.g.
   * ```
   * cameraControls.rotatePolarTo( 30 * THREE.MathUtils.DEG2RAD, true );
   * ```
   * @param polarAngle Polar rotate angle. In radian.
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  rotatePolarTo(polarAngle, enableTransition = false) {
    return this.rotateTo(
      this._sphericalEnd.theta,
      polarAngle,
      enableTransition
    );
  }
  /**
   * Rotate azimuthal angle(horizontal) and polar angle(vertical) to the given angle.
   * Camera view will rotate over the orbit pivot absolutely:
   *
   * azimuthAngle
   * ```
   *       0º
   *         \
   * 90º -----+----- -90º
   *           \
   *           180º
   * ```
   * | direction | angle                  |
   * | --------- | ---------------------- |
   * | front     | 0º                     |
   * | left      | 90º (`Math.PI / 2`)    |
   * | right     | -90º (`- Math.PI / 2`) |
   * | back      | 180º (`Math.PI`)       |
   *
   * polarAngle
   * ```
   *     180º
   *      |
   *      90º
   *      |
   *      0º
   * ```
   * | direction            | angle                  |
   * | -------------------- | ---------------------- |
   * | top/sky              | 180º (`Math.PI`)       |
   * | horizontal from view | 90º (`Math.PI / 2`)    |
   * | bottom/floor         | 0º                     |
   *
   * @param azimuthAngle Azimuth rotate angle to. In radian.
   * @param polarAngle Polar rotate angle to. In radian.
   * @param enableTransition  Whether to move smoothly or immediately
   * @category Methods
   */
  rotateTo(azimuthAngle, polarAngle, enableTransition = false) {
    this._isUserControllingRotate = false;
    const theta = clamp(
      azimuthAngle,
      this.minAzimuthAngle,
      this.maxAzimuthAngle
    );
    const phi = clamp(polarAngle, this.minPolarAngle, this.maxPolarAngle);
    this._sphericalEnd.theta = theta;
    this._sphericalEnd.phi = phi;
    this._sphericalEnd.makeSafe();
    this._needsUpdate = true;
    if (!enableTransition) {
      this._spherical.theta = this._sphericalEnd.theta;
      this._spherical.phi = this._sphericalEnd.phi;
    }
    const resolveImmediately = !enableTransition || approxEquals(
      this._spherical.theta,
      this._sphericalEnd.theta,
      this.restThreshold
    ) && approxEquals(
      this._spherical.phi,
      this._sphericalEnd.phi,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Dolly in/out camera position.
   * @param distance Distance of dollyIn. Negative number for dollyOut.
   * @param enableTransition Whether to move smoothly or immediately.
   * @category Methods
   */
  dolly(distance, enableTransition = false) {
    return this.dollyTo(
      this._sphericalEnd.radius - distance,
      enableTransition
    );
  }
  /**
   * Dolly in/out camera position to given distance.
   * @param distance Distance of dolly.
   * @param enableTransition Whether to move smoothly or immediately.
   * @category Methods
   */
  dollyTo(distance, enableTransition = false) {
    this._isUserControllingDolly = false;
    const lastRadius = this._sphericalEnd.radius;
    const newRadius = clamp(distance, this.minDistance, this.maxDistance);
    const hasCollider = this.colliderMeshes.length >= 1;
    if (hasCollider) {
      const maxDistanceByCollisionTest = this._collisionTest();
      const isCollided = approxEquals(
        maxDistanceByCollisionTest,
        this._spherical.radius
      );
      const isDollyIn = lastRadius > newRadius;
      if (!isDollyIn && isCollided) return Promise.resolve();
      this._sphericalEnd.radius = Math.min(
        newRadius,
        maxDistanceByCollisionTest
      );
    } else {
      this._sphericalEnd.radius = newRadius;
    }
    this._needsUpdate = true;
    if (!enableTransition) {
      this._spherical.radius = this._sphericalEnd.radius;
    }
    const resolveImmediately = !enableTransition || approxEquals(
      this._spherical.radius,
      this._sphericalEnd.radius,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Zoom in/out camera. The value is added to camera zoom.
   * Limits set with `.minZoom` and `.maxZoom`
   * @param zoomStep zoom scale
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  zoom(zoomStep, enableTransition = false) {
    return this.zoomTo(this._zoomEnd + zoomStep, enableTransition);
  }
  /**
   * Zoom in/out camera to given scale. The value overwrites camera zoom.
   * Limits set with .minZoom and .maxZoom
   * @param zoom
   * @param enableTransition
   * @category Methods
   */
  zoomTo(zoom, enableTransition = false) {
    this._isUserControllingZoom = false;
    this._zoomEnd = clamp(zoom, this.minZoom, this.maxZoom);
    this._needsUpdate = true;
    if (!enableTransition) {
      this._zoom = this._zoomEnd;
    }
    const resolveImmediately = !enableTransition || approxEquals(this._zoom, this._zoomEnd, this.restThreshold);
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * @deprecated `pan()` has been renamed to `truck()`
   * @category Methods
   */
  pan(x, y, enableTransition = false) {
    console.warn("`pan` has been renamed to `truck`");
    return this.truck(x, y, enableTransition);
  }
  /**
   * Truck and pedestal camera using current azimuthal angle
   * @param x Horizontal translate amount
   * @param y Vertical translate amount
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  truck(x, y, enableTransition = false) {
    this._camera.updateMatrix();
    _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
    _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
    _xColumn.multiplyScalar(x);
    _yColumn.multiplyScalar(-y);
    const offset = _v3A$1.copy(_xColumn).add(_yColumn);
    const to = _v3B$1.copy(this._targetEnd).add(offset);
    return this.moveTo(to.x, to.y, to.z, enableTransition);
  }
  /**
   * Move forward / backward.
   * @param distance Amount to move forward / backward. Negative value to move backward
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  forward(distance, enableTransition = false) {
    _v3A$1.setFromMatrixColumn(this._camera.matrix, 0);
    _v3A$1.crossVectors(this._camera.up, _v3A$1);
    _v3A$1.multiplyScalar(distance);
    const to = _v3B$1.copy(this._targetEnd).add(_v3A$1);
    return this.moveTo(to.x, to.y, to.z, enableTransition);
  }
  /**
   * Move up / down.
   * @param height Amount to move up / down. Negative value to move down
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  elevate(height, enableTransition = false) {
    _v3A$1.copy(this._camera.up).multiplyScalar(height);
    return this.moveTo(
      this._targetEnd.x + _v3A$1.x,
      this._targetEnd.y + _v3A$1.y,
      this._targetEnd.z + _v3A$1.z,
      enableTransition
    );
  }
  /**
   * Move target position to given point.
   * @param x x coord to move center position
   * @param y y coord to move center position
   * @param z z coord to move center position
   * @param enableTransition Whether to move smoothly or immediately
   * @category Methods
   */
  moveTo(x, y, z, enableTransition = false) {
    this._isUserControllingTruck = false;
    const offset = _v3A$1.set(x, y, z).sub(this._targetEnd);
    this._encloseToBoundary(this._targetEnd, offset, this.boundaryFriction);
    this._needsUpdate = true;
    if (!enableTransition) {
      this._target.copy(this._targetEnd);
    }
    const resolveImmediately = !enableTransition || approxEquals(
      this._target.x,
      this._targetEnd.x,
      this.restThreshold
    ) && approxEquals(
      this._target.y,
      this._targetEnd.y,
      this.restThreshold
    ) && approxEquals(
      this._target.z,
      this._targetEnd.z,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Look in the given point direction.
   * @param x point x.
   * @param y point y.
   * @param z point z.
   * @param enableTransition Whether to move smoothly or immediately.
   * @returns Transition end promise
   * @category Methods
   */
  lookInDirectionOf(x, y, z, enableTransition = false) {
    const point = _v3A$1.set(x, y, z);
    const direction = point.sub(this._targetEnd).normalize();
    const position = direction.multiplyScalar(-this._sphericalEnd.radius);
    return this.setPosition(
      position.x,
      position.y,
      position.z,
      enableTransition
    );
  }
  /**
   * Fit the viewport to the box or the bounding box of the object, using the nearest axis. paddings are in unit.
   * set `cover: true` to fill enter screen.
   * e.g.
   * ```
   * cameraControls.fitToBox( myMesh );
   * ```
   * @param box3OrObject Axis aligned bounding box to fit the view.
   * @param enableTransition Whether to move smoothly or immediately.
   * @param options | `<object>` { cover: boolean, paddingTop: number, paddingLeft: number, paddingBottom: number, paddingRight: number }
   * @returns Transition end promise
   * @category Methods
   */
  fitToBox(box3OrObject, enableTransition, {
    cover = false,
    paddingLeft = 0,
    paddingRight = 0,
    paddingBottom = 0,
    paddingTop = 0
  } = {}) {
    const promises = [];
    const aabb = box3OrObject.isBox3 ? _box3A.copy(box3OrObject) : _box3A.setFromObject(box3OrObject);
    if (aabb.isEmpty()) {
      console.warn(
        "camera-controls: fitTo() cannot be used with an empty box. Aborting"
      );
      Promise.resolve();
    }
    const theta = roundToStep(this._sphericalEnd.theta, PI_HALF);
    const phi = roundToStep(this._sphericalEnd.phi, PI_HALF);
    promises.push(this.rotateTo(theta, phi, enableTransition));
    const normal = _v3A$1.setFromSpherical(this._sphericalEnd).normalize();
    const rotation = _quaternionA.setFromUnitVectors(normal, _AXIS_Z);
    const viewFromPolar = approxEquals(Math.abs(normal.y), 1);
    if (viewFromPolar) {
      rotation.multiply(_quaternionB.setFromAxisAngle(_AXIS_Y, theta));
    }
    rotation.multiply(this._yAxisUpSpaceInverse);
    const bb = _box3B.makeEmpty();
    _v3B$1.copy(aabb.min).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.min).setX(aabb.max.x).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.min).setY(aabb.max.y).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.max).setZ(aabb.min.z).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.min).setZ(aabb.max.z).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.max).setY(aabb.min.y).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.max).setX(aabb.min.x).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    _v3B$1.copy(aabb.max).applyQuaternion(rotation);
    bb.expandByPoint(_v3B$1);
    bb.min.x -= paddingLeft;
    bb.min.y -= paddingBottom;
    bb.max.x += paddingRight;
    bb.max.y += paddingTop;
    rotation.setFromUnitVectors(_AXIS_Z, normal);
    if (viewFromPolar) {
      rotation.premultiply(_quaternionB.invert());
    }
    rotation.premultiply(this._yAxisUpSpace);
    const bbSize = bb.getSize(_v3A$1);
    const center = bb.getCenter(_v3B$1).applyQuaternion(rotation);
    if (isPerspectiveCamera(this._camera)) {
      const distance = this.getDistanceToFitBox(
        bbSize.x,
        bbSize.y,
        bbSize.z,
        cover
      );
      promises.push(
        this.moveTo(center.x, center.y, center.z, enableTransition)
      );
      promises.push(this.dollyTo(distance, enableTransition));
      promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
    } else if (isOrthographicCamera(this._camera)) {
      const camera = this._camera;
      const width = camera.right - camera.left;
      const height = camera.top - camera.bottom;
      const zoom = cover ? Math.max(width / bbSize.x, height / bbSize.y) : Math.min(width / bbSize.x, height / bbSize.y);
      promises.push(
        this.moveTo(center.x, center.y, center.z, enableTransition)
      );
      promises.push(this.zoomTo(zoom, enableTransition));
      promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
    }
    return Promise.all(promises);
  }
  /**
   * Fit the viewport to the sphere or the bounding sphere of the object.
   * @param sphereOrMesh
   * @param enableTransition
   * @category Methods
   */
  fitToSphere(sphereOrMesh, enableTransition) {
    const promises = [];
    const isSphere = sphereOrMesh instanceof THREE.Sphere;
    const boundingSphere = isSphere ? _sphere.copy(sphereOrMesh) : _CameraControls.createBoundingSphere(sphereOrMesh, _sphere);
    promises.push(
      this.moveTo(
        boundingSphere.center.x,
        boundingSphere.center.y,
        boundingSphere.center.z,
        enableTransition
      )
    );
    if (isPerspectiveCamera(this._camera)) {
      const distanceToFit = this.getDistanceToFitSphere(
        boundingSphere.radius
      );
      promises.push(this.dollyTo(distanceToFit, enableTransition));
    } else if (isOrthographicCamera(this._camera)) {
      const width = this._camera.right - this._camera.left;
      const height = this._camera.top - this._camera.bottom;
      const diameter = 2 * boundingSphere.radius;
      const zoom = Math.min(width / diameter, height / diameter);
      promises.push(this.zoomTo(zoom, enableTransition));
    }
    promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
    return Promise.all(promises);
  }
  /**
   * Look at the `target` from the `position`.
   * @param positionX
   * @param positionY
   * @param positionZ
   * @param targetX
   * @param targetY
   * @param targetZ
   * @param enableTransition
   * @category Methods
   */
  setLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition = false) {
    this._isUserControllingRotate = false;
    this._isUserControllingDolly = false;
    this._isUserControllingTruck = false;
    const target = _v3B$1.set(targetX, targetY, targetZ);
    const position = _v3A$1.set(positionX, positionY, positionZ);
    this._targetEnd.copy(target);
    this._sphericalEnd.setFromVector3(
      position.sub(target).applyQuaternion(this._yAxisUpSpace)
    );
    this.normalizeRotations();
    this._needsUpdate = true;
    if (!enableTransition) {
      this._target.copy(this._targetEnd);
      this._spherical.copy(this._sphericalEnd);
    }
    const resolveImmediately = !enableTransition || approxEquals(
      this._target.x,
      this._targetEnd.x,
      this.restThreshold
    ) && approxEquals(
      this._target.y,
      this._targetEnd.y,
      this.restThreshold
    ) && approxEquals(
      this._target.z,
      this._targetEnd.z,
      this.restThreshold
    ) && approxEquals(
      this._spherical.theta,
      this._sphericalEnd.theta,
      this.restThreshold
    ) && approxEquals(
      this._spherical.phi,
      this._sphericalEnd.phi,
      this.restThreshold
    ) && approxEquals(
      this._spherical.radius,
      this._sphericalEnd.radius,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Similar to setLookAt, but it interpolates between two states.
   * @param positionAX
   * @param positionAY
   * @param positionAZ
   * @param targetAX
   * @param targetAY
   * @param targetAZ
   * @param positionBX
   * @param positionBY
   * @param positionBZ
   * @param targetBX
   * @param targetBY
   * @param targetBZ
   * @param t
   * @param enableTransition
   * @category Methods
   */
  lerpLookAt(positionAX, positionAY, positionAZ, targetAX, targetAY, targetAZ, positionBX, positionBY, positionBZ, targetBX, targetBY, targetBZ, t, enableTransition = false) {
    this._isUserControllingRotate = false;
    this._isUserControllingDolly = false;
    this._isUserControllingTruck = false;
    const targetA = _v3A$1.set(targetAX, targetAY, targetAZ);
    const positionA = _v3B$1.set(positionAX, positionAY, positionAZ);
    _sphericalA.setFromVector3(
      positionA.sub(targetA).applyQuaternion(this._yAxisUpSpace)
    );
    const targetB = _v3C$1.set(targetBX, targetBY, targetBZ);
    const positionB = _v3B$1.set(positionBX, positionBY, positionBZ);
    _sphericalB.setFromVector3(
      positionB.sub(targetB).applyQuaternion(this._yAxisUpSpace)
    );
    this._targetEnd.copy(targetA.lerp(targetB, t));
    const deltaTheta = _sphericalB.theta - _sphericalA.theta;
    const deltaPhi = _sphericalB.phi - _sphericalA.phi;
    const deltaRadius = _sphericalB.radius - _sphericalA.radius;
    this._sphericalEnd.set(
      _sphericalA.radius + deltaRadius * t,
      _sphericalA.phi + deltaPhi * t,
      _sphericalA.theta + deltaTheta * t
    );
    this.normalizeRotations();
    this._needsUpdate = true;
    if (!enableTransition) {
      this._target.copy(this._targetEnd);
      this._spherical.copy(this._sphericalEnd);
    }
    const resolveImmediately = !enableTransition || approxEquals(
      this._target.x,
      this._targetEnd.x,
      this.restThreshold
    ) && approxEquals(
      this._target.y,
      this._targetEnd.y,
      this.restThreshold
    ) && approxEquals(
      this._target.z,
      this._targetEnd.z,
      this.restThreshold
    ) && approxEquals(
      this._spherical.theta,
      this._sphericalEnd.theta,
      this.restThreshold
    ) && approxEquals(
      this._spherical.phi,
      this._sphericalEnd.phi,
      this.restThreshold
    ) && approxEquals(
      this._spherical.radius,
      this._sphericalEnd.radius,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Set angle and distance by given position.
   * An alias of `setLookAt()`, without target change. Thus keep gazing at the current target
   * @param positionX
   * @param positionY
   * @param positionZ
   * @param enableTransition
   * @category Methods
   */
  setPosition(positionX, positionY, positionZ, enableTransition = false) {
    return this.setLookAt(
      positionX,
      positionY,
      positionZ,
      this._targetEnd.x,
      this._targetEnd.y,
      this._targetEnd.z,
      enableTransition
    );
  }
  /**
   * Set the target position where gaze at.
   * An alias of `setLookAt()`, without position change. Thus keep the same position.
   * @param targetX
   * @param targetY
   * @param targetZ
   * @param enableTransition
   * @category Methods
   */
  setTarget(targetX, targetY, targetZ, enableTransition = false) {
    const pos = this.getPosition(_v3A$1);
    const promise = this.setLookAt(
      pos.x,
      pos.y,
      pos.z,
      targetX,
      targetY,
      targetZ,
      enableTransition
    );
    this._sphericalEnd.phi = clamp(
      this.polarAngle,
      this.minPolarAngle,
      this.maxPolarAngle
    );
    return promise;
  }
  /**
   * Set focal offset using the screen parallel coordinates. z doesn't affect in Orthographic as with Dolly.
   * @param x
   * @param y
   * @param z
   * @param enableTransition
   * @category Methods
   */
  setFocalOffset(x, y, z, enableTransition = false) {
    this._isUserControllingOffset = false;
    this._focalOffsetEnd.set(x, y, z);
    this._needsUpdate = true;
    if (!enableTransition) this._focalOffset.copy(this._focalOffsetEnd);
    const resolveImmediately = !enableTransition || approxEquals(
      this._focalOffset.x,
      this._focalOffsetEnd.x,
      this.restThreshold
    ) && approxEquals(
      this._focalOffset.y,
      this._focalOffsetEnd.y,
      this.restThreshold
    ) && approxEquals(
      this._focalOffset.z,
      this._focalOffsetEnd.z,
      this.restThreshold
    );
    return this._createOnRestPromise(resolveImmediately);
  }
  /**
   * Set orbit point without moving the camera.
   * SHOULD NOT RUN DURING ANIMATIONS. `setOrbitPoint()` will immediately fix the positions.
   * @param targetX
   * @param targetY
   * @param targetZ
   * @category Methods
   */
  setOrbitPoint(targetX, targetY, targetZ) {
    this._camera.updateMatrixWorld();
    _xColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 0);
    _yColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 1);
    _zColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 2);
    const position = _v3A$1.set(targetX, targetY, targetZ);
    const distance = position.distanceTo(this._camera.position);
    const cameraToPoint = position.sub(this._camera.position);
    _xColumn.multiplyScalar(cameraToPoint.x);
    _yColumn.multiplyScalar(cameraToPoint.y);
    _zColumn.multiplyScalar(cameraToPoint.z);
    _v3A$1.copy(_xColumn).add(_yColumn).add(_zColumn);
    _v3A$1.z = _v3A$1.z + distance;
    this.dollyTo(distance, false);
    this.setFocalOffset(-_v3A$1.x, _v3A$1.y, -_v3A$1.z, false);
    this.moveTo(targetX, targetY, targetZ, false);
  }
  /**
   * Set the boundary box that encloses the target of the camera. box3 is in THREE.Box3
   * @param box3
   * @category Methods
   */
  setBoundary(box3) {
    if (!box3) {
      this._boundary.min.set(-Infinity, -Infinity, -Infinity);
      this._boundary.max.set(Infinity, Infinity, Infinity);
      this._needsUpdate = true;
      return;
    }
    this._boundary.copy(box3);
    this._boundary.clampPoint(this._targetEnd, this._targetEnd);
    this._needsUpdate = true;
  }
  /**
   * Set (or unset) the current viewport.
   * Set this when you want to use renderer viewport and .dollyToCursor feature at the same time.
   * @param viewportOrX
   * @param y
   * @param width
   * @param height
   * @category Methods
   */
  setViewport(viewportOrX, y, width, height) {
    if (viewportOrX === null) {
      this._viewport = null;
      return;
    }
    this._viewport = this._viewport || new THREE.Vector4();
    if (typeof viewportOrX === "number") {
      this._viewport.set(viewportOrX, y, width, height);
    } else {
      this._viewport.copy(viewportOrX);
    }
  }
  /**
   * Calculate the distance to fit the box.
   * @param width box width
   * @param height box height
   * @param depth box depth
   * @returns distance
   * @category Methods
   */
  getDistanceToFitBox(width, height, depth, cover = false) {
    if (notSupportedInOrthographicCamera(
      this._camera,
      "getDistanceToFitBox"
    ))
      return this._spherical.radius;
    const boundingRectAspect = width / height;
    const fov = this._camera.getEffectiveFOV() * DEG2RAD;
    const aspect = this._camera.aspect;
    const heightToFit = (cover ? boundingRectAspect > aspect : boundingRectAspect < aspect) ? height : width / aspect;
    return heightToFit * 0.5 / Math.tan(fov * 0.5) + depth * 0.5;
  }
  /**
   * Calculate the distance to fit the sphere.
   * @param radius sphere radius
   * @returns distance
   * @category Methods
   */
  getDistanceToFitSphere(radius) {
    if (notSupportedInOrthographicCamera(
      this._camera,
      "getDistanceToFitSphere"
    ))
      return this._spherical.radius;
    const vFOV = this._camera.getEffectiveFOV() * DEG2RAD;
    const hFOV = Math.atan(Math.tan(vFOV * 0.5) * this._camera.aspect) * 2;
    const fov = 1 < this._camera.aspect ? vFOV : hFOV;
    return radius / Math.sin(fov * 0.5);
  }
  /**
   * Returns its current gazing target, which is the center position of the orbit.
   * @param out current gazing target
   * @category Methods
   */
  getTarget(out) {
    const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
    return _out.copy(this._targetEnd);
  }
  /**
   * Returns its current position.
   * @param out current position
   * @category Methods
   */
  getPosition(out) {
    const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
    return _out.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).add(this._targetEnd);
  }
  /**
   * Returns its current focal offset, which is how much the camera appears to be translated in screen parallel coordinates.
   * @param out current focal offset
   * @category Methods
   */
  getFocalOffset(out) {
    const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
    return _out.copy(this._focalOffsetEnd);
  }
  /**
   * Normalize camera azimuth angle rotation between 0 and 360 degrees.
   * @category Methods
   */
  normalizeRotations() {
    this._sphericalEnd.theta = this._sphericalEnd.theta % PI_2;
    if (this._sphericalEnd.theta < 0) this._sphericalEnd.theta += PI_2;
    this._spherical.theta += PI_2 * Math.round(
      (this._sphericalEnd.theta - this._spherical.theta) / PI_2
    );
  }
  /**
   * Reset all rotation and position to defaults.
   * @param enableTransition
   * @category Methods
   */
  reset(enableTransition = false) {
    if (!approxEquals(this._camera.up.x, this._cameraUp0.x) || !approxEquals(this._camera.up.y, this._cameraUp0.y) || !approxEquals(this._camera.up.z, this._cameraUp0.z)) {
      this._camera.up.copy(this._cameraUp0);
      const position = this.getPosition(_v3A$1);
      this.updateCameraUp();
      this.setPosition(position.x, position.y, position.z);
    }
    const promises = [
      this.setLookAt(
        this._position0.x,
        this._position0.y,
        this._position0.z,
        this._target0.x,
        this._target0.y,
        this._target0.z,
        enableTransition
      ),
      this.setFocalOffset(
        this._focalOffset0.x,
        this._focalOffset0.y,
        this._focalOffset0.z,
        enableTransition
      ),
      this.zoomTo(this._zoom0, enableTransition)
    ];
    return Promise.all(promises);
  }
  /**
   * Set current camera position as the default position.
   * @category Methods
   */
  saveState() {
    this._cameraUp0.copy(this._camera.up);
    this.getTarget(this._target0);
    this.getPosition(this._position0);
    this._zoom0 = this._zoom;
    this._focalOffset0.copy(this._focalOffset);
  }
  /**
   * Sync camera-up direction.
   * When camera-up vector is changed, `.updateCameraUp()` must be called.
   * @category Methods
   */
  updateCameraUp() {
    this._yAxisUpSpace.setFromUnitVectors(this._camera.up, _AXIS_Y);
    this._yAxisUpSpaceInverse.copy(this._yAxisUpSpace).invert();
  }
  /**
   * Apply current camera-up direction to the camera.
   * The orbit system will be re-initialized with the current position.
   * @category Methods
   */
  applyCameraUp() {
    const cameraDirection = _v3A$1.subVectors(this._target, this._camera.position).normalize();
    const side = _v3B$1.crossVectors(cameraDirection, this._camera.up).normalize();
    this._camera.up.crossVectors(side, cameraDirection).normalize();
    this._camera.updateMatrixWorld();
    const position = this.getPosition(_v3A$1);
    this.updateCameraUp();
    this.setPosition(position.x, position.y, position.z);
  }
  /**
   * Update camera position and directions.
   * This should be called in your tick loop every time, and returns true if re-rendering is needed.
   * @param delta
   * @returns updated
   * @category Methods
   */
  update(delta) {
    const deltaTheta = this._sphericalEnd.theta - this._spherical.theta;
    const deltaPhi = this._sphericalEnd.phi - this._spherical.phi;
    const deltaRadius = this._sphericalEnd.radius - this._spherical.radius;
    const deltaTarget = _deltaTarget.subVectors(
      this._targetEnd,
      this._target
    );
    const deltaOffset = _deltaOffset.subVectors(
      this._focalOffsetEnd,
      this._focalOffset
    );
    const deltaZoom = this._zoomEnd - this._zoom;
    if (approxZero(deltaTheta)) {
      this._thetaVelocity.value = 0;
      this._spherical.theta = this._sphericalEnd.theta;
    } else {
      const smoothTime = this._isUserControllingRotate ? this.draggingSmoothTime : this.smoothTime;
      this._spherical.theta = smoothDamp(
        this._spherical.theta,
        this._sphericalEnd.theta,
        this._thetaVelocity,
        smoothTime,
        Infinity,
        delta
      );
      this._needsUpdate = true;
    }
    if (approxZero(deltaPhi)) {
      this._phiVelocity.value = 0;
      this._spherical.phi = this._sphericalEnd.phi;
    } else {
      const smoothTime = this._isUserControllingRotate ? this.draggingSmoothTime : this.smoothTime;
      this._spherical.phi = smoothDamp(
        this._spherical.phi,
        this._sphericalEnd.phi,
        this._phiVelocity,
        smoothTime,
        Infinity,
        delta
      );
      this._needsUpdate = true;
    }
    if (approxZero(deltaRadius)) {
      this._radiusVelocity.value = 0;
      this._spherical.radius = this._sphericalEnd.radius;
    } else {
      const smoothTime = this._isUserControllingDolly ? this.draggingSmoothTime : this.smoothTime;
      this._spherical.radius = smoothDamp(
        this._spherical.radius,
        this._sphericalEnd.radius,
        this._radiusVelocity,
        smoothTime,
        this.maxSpeed,
        delta
      );
      this._needsUpdate = true;
    }
    if (approxZero(deltaTarget.x) && approxZero(deltaTarget.y) && approxZero(deltaTarget.z)) {
      this._targetVelocity.set(0, 0, 0);
      this._target.copy(this._targetEnd);
    } else {
      const smoothTime = this._isUserControllingTruck ? this.draggingSmoothTime : this.smoothTime;
      smoothDampVec3(
        this._target,
        this._targetEnd,
        this._targetVelocity,
        smoothTime,
        this.maxSpeed,
        delta,
        this._target
      );
      this._needsUpdate = true;
    }
    if (approxZero(deltaOffset.x) && approxZero(deltaOffset.y) && approxZero(deltaOffset.z)) {
      this._focalOffsetVelocity.set(0, 0, 0);
      this._focalOffset.copy(this._focalOffsetEnd);
    } else {
      const smoothTime = this._isUserControllingOffset ? this.draggingSmoothTime : this.smoothTime;
      smoothDampVec3(
        this._focalOffset,
        this._focalOffsetEnd,
        this._focalOffsetVelocity,
        smoothTime,
        this.maxSpeed,
        delta,
        this._focalOffset
      );
      this._needsUpdate = true;
    }
    if (this._dollyControlAmount !== 0) {
      if (isPerspectiveCamera(this._camera)) {
        const camera = this._camera;
        const cameraDirection = _v3A$1.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
        const planeX = _v3B$1.copy(cameraDirection).cross(camera.up).normalize();
        if (planeX.lengthSq() === 0) planeX.x = 1;
        const planeY = _v3C$1.crossVectors(planeX, cameraDirection);
        const worldToScreen = this._sphericalEnd.radius * Math.tan(camera.getEffectiveFOV() * DEG2RAD * 0.5);
        const prevRadius = this._sphericalEnd.radius - this._dollyControlAmount;
        const lerpRatio = (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius;
        const cursor = _v3A$1.copy(this._targetEnd).add(
          planeX.multiplyScalar(
            this._dollyControlCoord.x * worldToScreen * camera.aspect
          )
        ).add(
          planeY.multiplyScalar(
            this._dollyControlCoord.y * worldToScreen
          )
        );
        this._targetEnd.lerp(cursor, lerpRatio);
      } else if (isOrthographicCamera(this._camera)) {
        const camera = this._camera;
        const worldCursorPosition = _v3A$1.set(
          this._dollyControlCoord.x,
          this._dollyControlCoord.y,
          (camera.near + camera.far) / (camera.near - camera.far)
        ).unproject(camera);
        const quaternion = _v3B$1.set(0, 0, -1).applyQuaternion(camera.quaternion);
        const cursor = _v3C$1.copy(worldCursorPosition).add(
          quaternion.multiplyScalar(
            -worldCursorPosition.dot(camera.up)
          )
        );
        const prevZoom = this._zoom - this._dollyControlAmount;
        const lerpRatio = -(prevZoom - this._zoomEnd) / this._zoom;
        const cameraDirection = _v3A$1.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
        const prevPlaneConstant = this._targetEnd.dot(cameraDirection);
        this._targetEnd.lerp(cursor, lerpRatio);
        const newPlaneConstant = this._targetEnd.dot(cameraDirection);
        const pullBack = cameraDirection.multiplyScalar(
          newPlaneConstant - prevPlaneConstant
        );
        this._targetEnd.sub(pullBack);
      }
      this._target.copy(this._targetEnd);
      this._boundary.clampPoint(this._targetEnd, this._targetEnd);
      this._dollyControlAmount = 0;
    }
    if (approxZero(deltaZoom)) {
      this._zoomVelocity.value = 0;
      this._zoom = this._zoomEnd;
    } else {
      const smoothTime = this._isUserControllingZoom ? this.draggingSmoothTime : this.smoothTime;
      this._zoom = smoothDamp(
        this._zoom,
        this._zoomEnd,
        this._zoomVelocity,
        smoothTime,
        Infinity,
        delta
      );
    }
    if (this._camera.zoom !== this._zoom) {
      this._camera.zoom = this._zoom;
      this._camera.updateProjectionMatrix();
      this._updateNearPlaneCorners();
      this._needsUpdate = true;
    }
    const maxDistance = this._collisionTest();
    this._spherical.radius = Math.min(this._spherical.radius, maxDistance);
    this._spherical.makeSafe();
    this._camera.position.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(this._target);
    this._camera.lookAt(this._target);
    const affectOffset = !approxZero(this._focalOffset.x) || !approxZero(this._focalOffset.y) || !approxZero(this._focalOffset.z);
    if (affectOffset) {
      this._camera.updateMatrixWorld();
      _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
      _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
      _zColumn.setFromMatrixColumn(this._camera.matrix, 2);
      _xColumn.multiplyScalar(this._focalOffset.x);
      _yColumn.multiplyScalar(-this._focalOffset.y);
      _zColumn.multiplyScalar(this._focalOffset.z);
      _v3A$1.copy(_xColumn).add(_yColumn).add(_zColumn);
      this._camera.position.add(_v3A$1);
    }
    if (this._boundaryEnclosesCamera) {
      this._encloseToBoundary(
        this._camera.position.copy(this._target),
        _v3A$1.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse),
        1
      );
    }
    const updated = this._needsUpdate;
    if (updated && !this._updatedLastTime) {
      this._hasRested = false;
      this.dispatchEvent({ type: "wake" });
      this.dispatchEvent({ type: "update" });
    } else if (updated) {
      this.dispatchEvent({ type: "update" });
      if (approxZero(deltaTheta, this.restThreshold) && approxZero(deltaPhi, this.restThreshold) && approxZero(deltaRadius, this.restThreshold) && approxZero(deltaTarget.x, this.restThreshold) && approxZero(deltaTarget.y, this.restThreshold) && approxZero(deltaTarget.z, this.restThreshold) && approxZero(deltaOffset.x, this.restThreshold) && approxZero(deltaOffset.y, this.restThreshold) && approxZero(deltaOffset.z, this.restThreshold) && approxZero(deltaZoom, this.restThreshold) && !this._hasRested) {
        this._hasRested = true;
        this.dispatchEvent({ type: "rest" });
      }
    } else if (!updated && this._updatedLastTime) {
      this.dispatchEvent({ type: "sleep" });
    }
    this._updatedLastTime = updated;
    this._needsUpdate = false;
    return updated;
  }
  /**
   * Get all state in JSON string
   * @category Methods
   */
  toJSON() {
    return JSON.stringify({
      enabled: this._enabled,
      minDistance: this.minDistance,
      maxDistance: infinityToMaxNumber(this.maxDistance),
      minZoom: this.minZoom,
      maxZoom: infinityToMaxNumber(this.maxZoom),
      minPolarAngle: this.minPolarAngle,
      maxPolarAngle: infinityToMaxNumber(this.maxPolarAngle),
      minAzimuthAngle: infinityToMaxNumber(this.minAzimuthAngle),
      maxAzimuthAngle: infinityToMaxNumber(this.maxAzimuthAngle),
      smoothTime: this.smoothTime,
      draggingSmoothTime: this.draggingSmoothTime,
      dollySpeed: this.dollySpeed,
      truckSpeed: this.truckSpeed,
      dollyToCursor: this.dollyToCursor,
      verticalDragToForward: this.verticalDragToForward,
      target: this._targetEnd.toArray(),
      position: _v3A$1.setFromSpherical(this._sphericalEnd).add(this._targetEnd).toArray(),
      zoom: this._zoomEnd,
      focalOffset: this._focalOffsetEnd.toArray(),
      target0: this._target0.toArray(),
      position0: this._position0.toArray(),
      zoom0: this._zoom0,
      focalOffset0: this._focalOffset0.toArray()
    });
  }
  /**
   * Reproduce the control state with JSON. enableTransition is where anim or not in a boolean.
   * @param json
   * @param enableTransition
   * @category Methods
   */
  fromJSON(json, enableTransition = false) {
    const obj = JSON.parse(json);
    this.enabled = obj.enabled;
    this.minDistance = obj.minDistance;
    this.maxDistance = maxNumberToInfinity(obj.maxDistance);
    this.minZoom = obj.minZoom;
    this.maxZoom = maxNumberToInfinity(obj.maxZoom);
    this.minPolarAngle = obj.minPolarAngle;
    this.maxPolarAngle = maxNumberToInfinity(obj.maxPolarAngle);
    this.minAzimuthAngle = maxNumberToInfinity(obj.minAzimuthAngle);
    this.maxAzimuthAngle = maxNumberToInfinity(obj.maxAzimuthAngle);
    this.smoothTime = obj.smoothTime;
    this.draggingSmoothTime = obj.draggingSmoothTime;
    this.dollySpeed = obj.dollySpeed;
    this.truckSpeed = obj.truckSpeed;
    this.dollyToCursor = obj.dollyToCursor;
    this.verticalDragToForward = obj.verticalDragToForward;
    this._target0.fromArray(obj.target0);
    this._position0.fromArray(obj.position0);
    this._zoom0 = obj.zoom0;
    this._focalOffset0.fromArray(obj.focalOffset0);
    this.moveTo(
      obj.target[0],
      obj.target[1],
      obj.target[2],
      enableTransition
    );
    _sphericalA.setFromVector3(
      _v3A$1.fromArray(obj.position).sub(this._targetEnd).applyQuaternion(this._yAxisUpSpace)
    );
    this.rotateTo(_sphericalA.theta, _sphericalA.phi, enableTransition);
    this.dollyTo(_sphericalA.radius, enableTransition);
    this.zoomTo(obj.zoom, enableTransition);
    this.setFocalOffset(
      obj.focalOffset[0],
      obj.focalOffset[1],
      obj.focalOffset[2],
      enableTransition
    );
    this._needsUpdate = true;
  }
  /**
   * Attach all internal event handlers to enable drag control.
   * @category Methods
   */
  connect(domElement) {
    if (this._domElement) {
      console.warn("camera-controls is already connected.");
      return;
    }
    domElement.setAttribute("data-camera-controls-version", VERSION);
    this._addAllEventListeners(domElement);
  }
  /**
   * Detach all internal event handlers to disable drag control.
   */
  disconnect() {
    this.cancel();
    this._removeAllEventListeners();
    if (this._domElement) {
      this._domElement.removeAttribute("data-camera-controls-version");
      this._domElement = void 0;
    }
  }
  /**
   * Dispose the cameraControls instance itself, remove all eventListeners.
   * @category Methods
   */
  dispose() {
    this.removeAllEventListeners();
    this.disconnect();
  }
  _findPointerById(pointerId) {
    return this._activePointers.find(
      (activePointer) => activePointer.pointerId === pointerId
    );
  }
  _findPointerByMouseButton(mouseButton) {
    return this._activePointers.find(
      (activePointer) => activePointer.mouseButton === mouseButton
    );
  }
  _encloseToBoundary(position, offset, friction) {
    const offsetLength2 = offset.lengthSq();
    if (offsetLength2 === 0) {
      return position;
    }
    const newTarget = _v3B$1.copy(offset).add(position);
    const clampedTarget = this._boundary.clampPoint(newTarget, _v3C$1);
    const deltaClampedTarget = clampedTarget.sub(newTarget);
    const deltaClampedTargetLength2 = deltaClampedTarget.lengthSq();
    if (deltaClampedTargetLength2 === 0) {
      return position.add(offset);
    } else if (deltaClampedTargetLength2 === offsetLength2) {
      return position;
    } else if (friction === 0) {
      return position.add(offset).add(deltaClampedTarget);
    } else {
      const offsetFactor = 1 + friction * deltaClampedTargetLength2 / offset.dot(deltaClampedTarget);
      return position.add(_v3B$1.copy(offset).multiplyScalar(offsetFactor)).add(deltaClampedTarget.multiplyScalar(1 - friction));
    }
  }
  _updateNearPlaneCorners() {
    if (isPerspectiveCamera(this._camera)) {
      const camera = this._camera;
      const near = camera.near;
      const fov = camera.getEffectiveFOV() * DEG2RAD;
      const heightHalf = Math.tan(fov * 0.5) * near;
      const widthHalf = heightHalf * camera.aspect;
      this._nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);
      this._nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);
      this._nearPlaneCorners[2].set(widthHalf, heightHalf, 0);
      this._nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);
    } else if (isOrthographicCamera(this._camera)) {
      const camera = this._camera;
      const zoomInv = 1 / camera.zoom;
      const left = camera.left * zoomInv;
      const right = camera.right * zoomInv;
      const top = camera.top * zoomInv;
      const bottom = camera.bottom * zoomInv;
      this._nearPlaneCorners[0].set(left, top, 0);
      this._nearPlaneCorners[1].set(right, top, 0);
      this._nearPlaneCorners[2].set(right, bottom, 0);
      this._nearPlaneCorners[3].set(left, bottom, 0);
    }
  }
  // lateUpdate
  _collisionTest() {
    let distance = Infinity;
    const hasCollider = this.colliderMeshes.length >= 1;
    if (!hasCollider) return distance;
    if (notSupportedInOrthographicCamera(this._camera, "_collisionTest"))
      return distance;
    const direction = _v3A$1.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
    _rotationMatrix$1.lookAt(_ORIGIN$1, direction, this._camera.up);
    for (let i = 0; i < 4; i++) {
      const nearPlaneCorner = _v3B$1.copy(this._nearPlaneCorners[i]);
      nearPlaneCorner.applyMatrix4(_rotationMatrix$1);
      const origin = _v3C$1.addVectors(this._target, nearPlaneCorner);
      _raycaster2.set(origin, direction);
      _raycaster2.far = this._spherical.radius + 1;
      const intersects = _raycaster2.intersectObjects(this.colliderMeshes);
      if (intersects.length !== 0 && intersects[0].distance < distance) {
        distance = intersects[0].distance;
      }
    }
    return distance;
  }
  /**
   * Get its client rect and package into given `DOMRect` .
   */
  _getClientRect(target) {
    if (!this._domElement) return;
    const rect = this._domElement.getBoundingClientRect();
    target.x = rect.left;
    target.y = rect.top;
    if (this._viewport) {
      target.x += this._viewport.x;
      target.y += rect.height - this._viewport.w - this._viewport.y;
      target.width = this._viewport.z;
      target.height = this._viewport.w;
    } else {
      target.width = rect.width;
      target.height = rect.height;
    }
    return target;
  }
  _createOnRestPromise(resolveImmediately) {
    if (resolveImmediately) return Promise.resolve();
    this._hasRested = false;
    this.dispatchEvent({ type: "transitionstart" });
    return new Promise((resolve) => {
      const onResolve = () => {
        this.removeEventListener("rest", onResolve);
        resolve();
      };
      this.addEventListener("rest", onResolve);
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _addAllEventListeners(_domElement) {
  }
  _removeAllEventListeners() {
  }
  /**
   * backward compatible
   * @deprecated use smoothTime (in seconds) instead
   * @category Properties
   */
  get dampingFactor() {
    console.warn(
      ".dampingFactor has been deprecated. use smoothTime (in seconds) instead."
    );
    return 0;
  }
  /**
   * backward compatible
   * @deprecated use smoothTime (in seconds) instead
   * @category Properties
   */
  set dampingFactor(_) {
    console.warn(
      ".dampingFactor has been deprecated. use smoothTime (in seconds) instead."
    );
  }
  /**
   * backward compatible
   * @deprecated use draggingSmoothTime (in seconds) instead
   * @category Properties
   */
  get draggingDampingFactor() {
    console.warn(
      ".draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead."
    );
    return 0;
  }
  /**
   * backward compatible
   * @deprecated use draggingSmoothTime (in seconds) instead
   * @category Properties
   */
  set draggingDampingFactor(_) {
    console.warn(
      ".draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead."
    );
  }
  static createBoundingSphere(object3d, out = new THREE.Sphere()) {
    const boundingSphere = out;
    const center = boundingSphere.center;
    _box3A.makeEmpty();
    object3d.traverseVisible((object) => {
      if (!object.isMesh) return;
      _box3A.expandByObject(object);
    });
    _box3A.getCenter(center);
    let maxRadiusSq = 0;
    object3d.traverseVisible((object) => {
      if (!object.isMesh) return;
      const mesh = object;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      const bufferGeometry = geometry;
      const position = bufferGeometry.attributes.position;
      for (let i = 0, l = position.count; i < l; i++) {
        _v3A$1.fromBufferAttribute(position, i);
        maxRadiusSq = Math.max(
          maxRadiusSq,
          center.distanceToSquared(_v3A$1)
        );
      }
    });
    boundingSphere.radius = Math.sqrt(maxRadiusSq);
    return boundingSphere;
  }
};
var subsetOfTHREE = {
  Vector2: THREE2.Vector2,
  Vector3: THREE2.Vector3,
  Vector4: THREE2.Vector4,
  Quaternion: THREE2.Quaternion,
  Matrix4: THREE2.Matrix4,
  Spherical: THREE2.Spherical,
  Box3: THREE2.Box3,
  Sphere: THREE2.Sphere,
  Raycaster: THREE2.Raycaster
};
CameraControls.install({ THREE: subsetOfTHREE });
var _ORIGIN = new THREE2.Vector3(0, 0, 0);
var _v3A = new THREE2.Vector3();
var _v3B = new THREE2.Vector3();
var _v3C = new THREE2.Vector3();
var _ray = new THREE2.Ray();
var _rotationMatrix = new THREE2.Matrix4();
var TPSCameraControls = class extends CameraControls {
  constructor(camera, trackObject, world, domElement) {
    super(camera, domElement);
    this.minDistance = 1;
    this.maxDistance = 30;
    this.azimuthRotateSpeed = 0.3;
    this.polarRotateSpeed = -0.2;
    this.minPolarAngle = 30 * THREE2.MathUtils.DEG2RAD;
    this.maxPolarAngle = 120 * THREE2.MathUtils.DEG2RAD;
    this.draggingSmoothTime = 1e-10;
    this.mouseButtons.right = CameraControls.ACTION.NONE;
    this.mouseButtons.middle = CameraControls.ACTION.NONE;
    this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
    this.touches.three = CameraControls.ACTION.TOUCH_DOLLY;
    this.world = world;
    this.colliderMeshes = [new THREE2.Object3D()];
    const offset = new THREE2.Vector3(0, 2, 0);
    this.update = (delta) => {
      const x = trackObject.position.x + offset.x;
      const y = trackObject.position.y + offset.y;
      const z = trackObject.position.z + offset.z;
      this.moveTo(x, y, z, false);
      return super.update(delta);
    };
  }
  get frontAngle() {
    return this.azimuthAngle;
  }
  _collisionTest() {
    let distance = Infinity;
    if (!this.world) return distance;
    for (let i = 0, l = this.world.colliderPool.length; i < l; i++) {
      const octree = this.world.colliderPool[i];
      const direction = _v3A.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
      _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);
      for (let i2 = 0; i2 < 4; i2++) {
        const nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i2]);
        nearPlaneCorner.applyMatrix4(_rotationMatrix);
        const origin = _v3C.addVectors(this._target, nearPlaneCorner);
        _ray.set(origin, direction);
        const intersect = octree.rayIntersect(_ray);
        if (intersect && intersect.distance < distance) {
          distance = intersect.distance;
        }
      }
    }
    return distance;
  }
};

// src/Viewer/Context/Controls/Controls.ts
CameraControls2__default.default.install({ THREE: THREE2__namespace });
var Controls = class {
  constructor(context) {
    this.context = context;
    this._moving = false;
    this._position = new THREE2__namespace.Vector3();
    this.settings = {
      speed: 0.05,
      rotateSpeed: 1e-3,
      upSpeed: 1e-3,
      polarRotateSpeed: 1,
      azimuthRotateSpeed: 0.6
    };
    this.createDragControl = (objects) => {
      return new DragControls(
        objects,
        this.context.camera.threeCamera,
        this.context.domElement
      );
    };
    this.getIntersects = (objects = Object.values(
      this.context.context.selector.selectorModels
    ).flat()) => {
      const intersects = [];
      for (const object of objects) {
        this.getIntersect(object).forEach((p) => intersects.push(p));
      }
      return intersects.sort((a, b) => a.distance - b.distance);
    };
    this.onControl = this._onControl.bind(this);
    this._activeMode = "Orthographic";
    this.cameraControl = new CameraControls2__default.default(
      this.context.camera.threeCamera,
      this.context.domElement
    );
    this.cameraControl.truckSpeed = 1.3;
    this.cameraControl.dollySpeed = 0.6;
    this.cameraControl.azimuthRotateSpeed = 0.6;
    this.cameraControl.draggingSmoothTime = 0.05;
    this.cameraControl.smoothTime = 0.1;
    this.cameraControl.dollyToCursor = true;
    this.cameraControl.infinityDolly = true;
    this.cameraControl.minDistance = 3;
    this.raycaster = new THREE2__namespace.Raycaster();
    this.addEvents();
  }
  get activeMode() {
    return this._activeMode;
  }
  set activeMode(mode) {
    this._activeMode = mode;
    var state = {
      _a: false,
      _s: false,
      _d: false,
      _w: false,
      _up: false,
      _down: false,
      _right: false,
      _left: false,
      _c: false,
      _space: false
    };
    switch (mode) {
      case "1stPerson":
        try {
          this.context.controls.cameraControl.lockPointer();
        } catch {
        }
        this.settings.polarRotateSpeed = this.context.controls.cameraControl.polarRotateSpeed;
        this.settings.azimuthRotateSpeed = this.context.controls.cameraControl.azimuthRotateSpeed;
        this.context.controls.cameraControl.polarRotateSpeed = 0.5;
        this.context.controls.cameraControl.azimuthRotateSpeed = 0.5;
        if (!document) return;
        this._activeModeKeyDownEvents = (e2) => {
          switch (e2.code) {
            case "KeyW":
              state._w = true;
              break;
            case "ArrowUp":
              state._up = true;
              break;
            case "KeyS":
              state._s = true;
              break;
            case "ArrowDown":
              state._down = true;
              break;
            case "KeyA":
              state._a = true;
              break;
            case "ArrowLeft":
              state._left = true;
              break;
            case "KeyD":
              state._d = true;
              break;
            case "ArrowRight":
              state._right = true;
              break;
            case "ShiftLeft":
              state._c = true;
              break;
            case "Space":
              state._space = true;
              break;
          }
        };
        document.addEventListener(
          "keydown",
          this._activeModeKeyDownEvents
        );
        this._activeModeKeyUpEvents = (e2) => {
          switch (e2.code) {
            case "KeyW":
              state._w = false;
              break;
            case "ArrowUp":
              state._up = false;
              break;
            case "KeyS":
              state._s = false;
              break;
            case "ArrowDown":
              state._down = false;
              break;
            case "KeyA":
              state._a = false;
              break;
            case "ArrowLeft":
              state._left = false;
              break;
            case "KeyD":
              state._d = false;
              break;
            case "ArrowRight":
              state._right = false;
              break;
            case "ShiftLeft":
              state._c = false;
              break;
            case "Space":
              state._space = false;
              break;
          }
        };
        document.addEventListener("keyup", this._activeModeKeyUpEvents);
        this._activeModeRendererEvent = () => {
          if (state["_a"]) {
            this.context.controls.cameraControl.truck(
              -this.settings.speed / 2,
              0
            );
          }
          if (state["_left"]) {
            this.context.controls.cameraControl.rotateAzimuthTo(
              this.context.controls.cameraControl.azimuthAngle + this.settings.rotateSpeed
            );
          }
          if (state["_d"]) {
            this.context.controls.cameraControl.truck(
              this.settings.speed / 2,
              0
            );
          }
          if (state["_right"]) {
            this.context.controls.cameraControl.rotateAzimuthTo(
              this.context.controls.cameraControl.azimuthAngle - this.settings.rotateSpeed
            );
          }
          if (state["_w"]) {
            this.context.controls.cameraControl.dollyInFixed(
              this.settings.speed
            );
          }
          if (state["_s"]) {
            this.context.controls.cameraControl.dollyInFixed(
              -this.settings.speed
            );
          }
          if (state["_up"]) {
            this.context.controls.cameraControl.rotatePolarTo(
              this.context.controls.cameraControl.polarAngle + this.settings.upSpeed
            );
          }
          if (state["_down"]) {
            this.context.controls.cameraControl.rotatePolarTo(
              this.context.controls.cameraControl.polarAngle - this.settings.upSpeed
            );
          }
          if (state["_c"]) {
            this.context.controls.cameraControl.truck(
              0,
              this.settings.speed / 2
            );
          }
          if (state["_space"]) {
            this.context.controls.cameraControl.truck(
              0,
              -this.settings.speed / 2
            );
          }
        };
        this.context.renderer.addCallback(
          this._activeModeRendererEvent
        );
        break;
      case "3rdPerson":
        const world = new World();
        const octree = new Octree();
        for (const model of Object.values(
          this.context.context.models
        )) {
          for (const child of model.threeGeometry.children) {
            const mesh = child;
            octree.addGraphNode(mesh);
          }
        }
        const ground = new THREE2__namespace.Mesh(
          new THREE2__namespace.PlaneGeometry(50, 50, 10, 10),
          new THREE2__namespace.MeshBasicMaterial({
            color: "red"
          })
        );
        ground.traverse((geom) => {
          console.log(geom);
        });
        this.context.scene.threeScene.add(ground);
        octree.addGraphNode(ground);
        const bb = this.context.context.models[0].boundingBox;
        ground.position.set(
          (bb.max.x + bb.min.x) / 2,
          bb.min.y,
          (bb.max.z + bb.min.z) / 2
        );
        ground.rotation.x = -90 * THREE2__namespace.MathUtils.DEG2RAD;
        world.add(octree);
        const playerObjectHolder = new THREE2__namespace.Object3D();
        this.context.scene.threeScene.add(playerObjectHolder);
        const sphere2 = new THREE2__namespace.Mesh(
          new THREE2__namespace.SphereGeometry(0.75, 16, 16),
          new THREE2__namespace.MeshBasicMaterial({
            color: 16711680,
            wireframe: true
          })
        );
        sphere2.position.y = 0.75;
        playerObjectHolder.add(sphere2);
        const playerController = new CharacterController(
          playerObjectHolder,
          0.75
        );
        playerController.teleport(0, 10, 0);
        world.add(playerController);
        const keyInputControl = new KeyInputControl();
        const tpsCameraControls = new TPSCameraControls(
          this.context.camera.threeCamera,
          // three.js camera
          playerObjectHolder,
          // tracking object
          world,
          this.context.renderer.threeRenderer.domElement
        );
        keyInputControl.addEventListener(
          "movekeyon",
          () => playerController.isRunning = true
        );
        keyInputControl.addEventListener(
          "movekeyoff",
          () => playerController.isRunning = false
        );
        keyInputControl.addEventListener(
          "jumpkeypress",
          () => playerController.jump()
        );
        keyInputControl.addEventListener("movekeychange", () => {
          const cameraFrontAngle = tpsCameraControls.frontAngle;
          const characterFrontAngle = keyInputControl.frontAngle;
          playerController.direction = cameraFrontAngle + characterFrontAngle;
        });
        tpsCameraControls.addEventListener("update", () => {
          if (!playerController.isRunning) return;
          const cameraFrontAngle = tpsCameraControls.frontAngle;
          const characterFrontAngle = keyInputControl.frontAngle;
          playerController.direction = cameraFrontAngle + characterFrontAngle;
        });
        this.context.renderer.addCallback(() => {
          const delta = this.context.context.context.clock.getDelta();
          world.fixedUpdate();
          tpsCameraControls.update(delta);
        });
        break;
      case "Orthographic":
        try {
          this.context.controls.cameraControl.unlockPointer();
        } catch {
        }
        this.context.controls.cameraControl.polarRotateSpeed = this.settings.polarRotateSpeed;
        this.context.controls.cameraControl.azimuthRotateSpeed = this.settings.polarRotateSpeed;
        this._activeModeKeyDownEvents && document.removeEventListener(
          "keydown",
          this._activeModeKeyDownEvents
        );
        this._activeModeKeyUpEvents && document.removeEventListener(
          "keyup",
          this._activeModeKeyUpEvents
        );
        this._activeModeRendererEvent && this.context.renderer.removeCallback(
          this._activeModeRendererEvent
        );
        break;
      case "Perspective":
        try {
          this.context.controls.cameraControl.unlockPointer();
        } catch {
        }
        this.context.controls.cameraControl.polarRotateSpeed = this.settings.polarRotateSpeed;
        this.context.controls.cameraControl.azimuthRotateSpeed = this.settings.polarRotateSpeed;
        this._activeModeKeyDownEvents && document.removeEventListener(
          "keydown",
          this._activeModeKeyDownEvents
        );
        this._activeModeKeyUpEvents && document.removeEventListener(
          "keyup",
          this._activeModeKeyUpEvents
        );
        this._activeModeRendererEvent && this.context.renderer.removeCallback(
          this._activeModeRendererEvent
        );
        break;
    }
  }
  // get pointer() {
  //     return this._pointer;
  // }
  get moving() {
    return this._moving;
  }
  set moving(moving) {
    this._moving = moving;
  }
  getIntersect(object) {
    const mesh = object;
    if (!mesh) {
      return [];
    }
    if (mesh.geometry.boundsTree) {
      let intersect = (
        //@ts-ignore
        mesh.geometry.boundsTree.raycast(
          this.context.context.context.controls.raycaster.ray,
          this.context.context.selector.useDoubleSideMaterial ? THREE2__namespace.DoubleSide : THREE2__namespace.FrontSide
        )
      );
      return intersect.map((p) => {
        p.object = mesh;
        return p;
      }).filter((p) => this.checkIntersect(p));
    } else {
      const intersects = this.raycaster.intersectObjects([object]);
      return intersects.filter((p) => this.checkIntersect(p));
    }
  }
  checkIntersect(intersect) {
    const clipper = this.context.context.utils.clippingUtils;
    if (clipper.active && clipper.planes.length) {
      let flag = true;
      for (const plane of clipper.planes) {
        if (plane.distanceToPoint(intersect.point) <= 0) {
          flag = false;
          break;
        }
      }
      return flag;
    }
    return true;
  }
  addEvents() {
    this.cameraControl.addEventListener("controlstart", () => {
      this.cameraControl.getPosition(this._position);
      this.cameraControl.addEventListener("control", this.onControl);
    });
    this.cameraControl.addEventListener("controlend", () => {
      if (this.cameraControl.enabled) {
        setTimeout(() => {
          this._moving = false;
        }, 10);
      }
      this.cameraControl.removeEventListener("control", this.onControl);
    });
  }
  _onControl() {
    if (!this._moving) {
      const pos = new THREE2__namespace.Vector3();
      this.cameraControl.getPosition(pos);
      if (pos.distanceTo(this._position) > 0.1) {
        this._moving = true;
      }
    }
  }
  setOrbitByClick() {
    const intersect = this.context.context.selector.preSelection.preSelectElement;
    if (intersect) {
      this.cameraControl.setOrbitPoint(
        intersect.point.x,
        intersect.point.y,
        intersect.point.z
      );
    }
  }
  setOrbitByTarget(target) {
    this.cameraControl.setOrbitPoint(target.x, target.y, target.z);
  }
};
var Sizes = class {
  constructor(context) {
    this.context = context;
    this.modelSize = new THREE2.Box3();
    this.width = context.context.container.offsetWidth;
    this.height = context.context.container.offsetHeight;
    window.addEventListener("resize", this.resize.bind(this));
  }
  resize() {
    this.width = this.context.context.container.offsetWidth;
    this.height = this.context.context.container.offsetHeight;
    this.context.renderer.resize();
  }
};
var Environment = class {
  constructor(context) {
    this.context = context;
    this.lights = new Lights(this);
  }
};
var Lights = class {
  constructor(context) {
    this.context = context;
    this.ambientLight = new THREE2.AmbientLight(16777215, 1.2);
    this.directionalLight1 = new THREE2.DirectionalLight(16777215, 2);
    this.directionalLight2 = new THREE2.DirectionalLight(16777215, 2);
    const target = new THREE2.Vector3();
    this.context.context.controls.cameraControl.getTarget(target);
    this.directionalLight1.lookAt(target);
    this.directionalLight2.lookAt(target);
    this.context.context.scene.threeScene.add(this.ambientLight);
    this.context.context.scene.threeScene.add(this.directionalLight1);
    this.context.context.scene.threeScene.add(this.directionalLight2);
  }
  updateLightPosition(box) {
    const max = box.max;
    const min = box.min;
    this.directionalLight1.position.set(
      max.x * 1.3,
      max.y + 10,
      max.z * 1.3
    );
    this.directionalLight2.position.set(
      min.x * 1.3,
      max.y + 10,
      min.z * 1.3
    );
    const sceneCenter = new THREE2.Vector3();
    box.getCenter(sceneCenter);
    this.directionalLight1.lookAt(sceneCenter);
    this.directionalLight2.lookAt(sceneCenter);
  }
};
var Postproduction = class {
  constructor(context) {
    this.context = context;
    this._castShadow = false;
  }
  set castShadow(castShadow) {
    this._castShadow = castShadow;
    if (this.context.context.models) {
      this.context.environment.lights.directionalLight1.castShadow = castShadow;
      this.context.renderer.threeRenderer.shadowMap.enabled = castShadow;
      const points = [];
      for (const model of Object.values(this.context.context.models)) {
        model.threeGeometry.children.forEach((ch) => {
          ch.castShadow = castShadow;
          ch.receiveShadow = castShadow;
        });
        points.push(model.boundingBox.max, model.boundingBox.min);
      }
      const fullBox = new THREE2.Box3();
      fullBox.setFromPoints(points);
      const L = fullBox.min.distanceTo(fullBox.max) / 2 + 10;
      this.context.environment.lights.directionalLight1.shadow.mapSize.set(
        2048,
        2048
      );
      this.context.environment.lights.directionalLight1.shadow.normalBias = 2;
      this.context.environment.lights.directionalLight1.shadow.camera.left = -L;
      this.context.environment.lights.directionalLight1.shadow.camera.bottom = -L;
      this.context.environment.lights.directionalLight1.shadow.camera.right = L;
      this.context.environment.lights.directionalLight1.shadow.camera.top = L;
      setTimeout(() => {
        const cameraPos = this.context.environment.lights.directionalLight1.shadow.camera.position;
        this.context.environment.lights.directionalLight1.shadow.camera.near = cameraPos.distanceTo(fullBox.max) - L / 2;
        this.context.environment.lights.directionalLight1.shadow.camera.far = cameraPos.distanceTo(fullBox.min) + L / 2;
      }, 50);
    }
  }
};
var Renderer = class {
  constructor(context) {
    this.context = context;
    this.animationCallbackList = [];
    this.clock = new THREE2.Clock();
    this.needUpdate = true;
    this.threeRenderer = new THREE2.WebGLRenderer({
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true,
      antialias: true,
      alpha: true
    });
    this.threeRenderer2D = new CSS2DRenderer_js.CSS2DRenderer();
    this.threeRenderer2D.domElement.style.position = "absolute";
    this.threeRenderer2D.domElement.style.top = "0px";
    this.threeRenderer2D.domElement.style.pointerEvents = "none";
    context.context.container.appendChild(this.threeRenderer2D.domElement);
    this.threeRenderer3D = new CSS3DRenderer_js.CSS3DRenderer();
    this.threeRenderer3D.domElement.style.position = "absolute";
    this.threeRenderer3D.domElement.style.top = "0px";
    this.threeRenderer3D.domElement.style.pointerEvents = "none";
    context.context.container.appendChild(this.threeRenderer3D.domElement);
    this.resize();
    this.animation();
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.threeRenderer.outputColorSpace = THREE2.SRGBColorSpace;
    this.threeRenderer.setClearColor(0, 0);
  }
  newScreenshot(camera) {
    const domElement = this.context.domElement;
    const tempCanvas = domElement.cloneNode(true);
    const tempRenderer = new THREE2.WebGLRenderer({
      canvas: tempCanvas,
      logarithmicDepthBuffer: true,
      antialias: true,
      alpha: true
    });
    tempRenderer.localClippingEnabled = true;
    const scene = this.context.scene.threeScene;
    const cameraToRender = camera || this.context.camera.threeCamera;
    tempRenderer.render(scene, cameraToRender);
    const result = tempRenderer.domElement.toDataURL();
    tempRenderer.dispose();
    return result;
  }
  resize() {
    this.threeRenderer.setSize(
      this.context.sizes.width,
      this.context.sizes.height
    );
    this.threeRenderer2D.setSize(
      this.context.sizes.width,
      this.context.sizes.height
    );
    this.threeRenderer3D.setSize(
      this.context.sizes.width,
      this.context.sizes.height
    );
    if (this.context.camera.threeCamera instanceof THREE2.PerspectiveCamera) {
      this.context.camera.threeCamera.aspect = this.context.sizes.width / this.context.sizes.height;
    }
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.context.camera.threeCamera.updateProjectionMatrix();
  }
  animation() {
    requestAnimationFrame(() => {
      this.animation();
    });
    if (this.context.context.utils?.stats) {
      this.context.context.utils.stats.begin();
    }
    if (this.needUpdate && this.context.controls && this.context.mouse) {
      this.context.controls.raycaster.setFromCamera(
        this.context.mouse.position,
        this.context.camera.threeCamera
      );
    }
    for (const callback of this.animationCallbackList) {
      callback();
    }
    const delta = this.clock.getDelta();
    if (this.context.controls) {
      this.context.controls.cameraControl.update(delta);
    }
    if (this.needUpdate) {
      this.render();
    }
    if (this.context.context.utils?.stats) {
      this.context.context.utils.stats.end();
    }
  }
  addCallback(callback) {
    this.animationCallbackList.push(callback);
  }
  removeCallback(callback) {
    this.animationCallbackList = this.animationCallbackList.filter(
      (f) => f !== callback
    );
  }
  render() {
    this.threeRenderer.render(
      this.context.scene.threeScene,
      this.context.camera.threeCamera
    );
    this.threeRenderer2D.render(
      this.context.scene.threeScene,
      this.context.camera.threeCamera
    );
    this.threeRenderer3D.render(
      this.context.scene.threeScene,
      this.context.camera.threeCamera
    );
  }
};
var Scene2 = class {
  constructor(context, useDefaultTexture = true) {
    this.context = context;
    this.threeScene = new THREE2__namespace.Scene();
    if (useDefaultTexture) {
      this.context.textureLoader.load(
        "Resources/scene_bg.jpg",
        (texture) => {
          this.threeScene.background = texture;
        }
      );
    }
  }
};

// src/Viewer/Context/Context.ts
var Context = class {
  constructor(context, settings) {
    this.context = context;
    this.mouse = {
      position: new THREE2.Vector2(),
      cords: new THREE2.Vector2()
    };
    this.mouseMoveHandleBind = this.mouseMoveHandle.bind(this);
    this.sizes = new Sizes(this);
    this.textureLoader = new THREE2.TextureLoader();
    this.scene = new Scene2(this, settings.useDefaultTexture);
    this.camera = new Camera(this, 45, 0.1, 1e3);
    this.scene.threeScene.add(this.camera.threeCamera);
    this.renderer = new Renderer(this);
    this.domElement = this.renderer.threeRenderer.domElement;
    this.controls = new Controls(this);
    this.environment = new Environment(this);
    this.postproduction = new Postproduction(this);
    context.container.appendChild(this.domElement);
    this.domElement.addEventListener("mousemove", this.mouseMoveHandleBind);
    this.clock = new THREE2.Clock();
  }
  mouseMoveHandle(event) {
    const bounds = this.context.container.getBoundingClientRect();
    this.mouse.cords.x = event.clientX;
    this.mouse.cords.y = event.clientY;
    this.mouse.position.x = (event.clientX - bounds.left) / (bounds.right - bounds.left) * 2 - 1;
    this.mouse.position.y = -((event.clientY - bounds.top) / (bounds.bottom - bounds.top)) * 2 + 1;
  }
  resizeViewer(width, height) {
    if (width) this.context.container.style.width = width;
    if (height) this.context.container.style.height = height;
    this.sizes.resize();
  }
};

// src/Viewer/Model/Properties/Properties.ts
var Properties = class {
  constructor(context, data, structure) {
    this.context = context;
    this.data = data;
    this.structure = structure;
    this.hasProperties = Boolean(Object.keys(data).length);
  }
  loadStructure(path) {
    console.log("add load structure func");
  }
  setStructure(structure) {
    this.structure = structure;
  }
  loadProperties(path) {
    console.log("add load props func");
  }
  setProperties(properties) {
    this.data = properties;
  }
};
var ModelGrids = class {
  constructor(context, grids) {
    this.context = context;
    this.topTags = [];
    this.botTags = [];
    this.leftTags = [];
    this.rightTags = [];
    this.mesh = new THREE2.Group();
    this._active = true;
    this.grids = Object.values(grids);
    if (context.context.context.scene.threeScene.background instanceof THREE2.Texture) {
      this.color = "black";
    } else {
      let bgColor = context.context.context.scene.threeScene.background;
      if (!bgColor && context.context.container.style.background) {
        bgColor = new THREE2.Color(context.context.container.style.background);
      }
      if (!bgColor) {
        this.color = "#000";
      } else {
        this.color = this.changeColor(bgColor);
      }
    }
    this.material = new THREE2.LineBasicMaterial({
      color: new THREE2.Color(this.color),
      linewidth: 2
    });
    this.init();
  }
  async init() {
    const lowY = this.context.boundingBox.min;
    const gridGroup = new THREE2.Group();
    this.mesh = gridGroup;
    for (const grid of this.grids) {
      const locCoordinates = grid.loc;
      const uAxes = grid.points["u"];
      const vAxes = grid.points["v"];
      this.addGrid(gridGroup, uAxes, locCoordinates, "u", lowY);
      this.addGrid(gridGroup, vAxes, locCoordinates, "v", lowY);
    }
    this.context.context.context.scene.threeScene.add(gridGroup);
  }
  addGrid(gridGroup, data, locCoordinates, type, lowY) {
    for (const shortName of Object.keys(data)) {
      const tag = document.createElement("p");
      tag.style.color = this.color;
      tag.innerHTML = shortName;
      tag.visible = true;
      tag.className = "gridMark";
      tag.style.fontSize = "14px";
      tag.style.fontFamily = "Onest, Roboto";
      const tagObj = new CSS2DRenderer.CSS2DObject(tag);
      const curPoints = data[shortName];
      const point1 = curPoints[0];
      const point2 = curPoints[1];
      const linePoints = [
        new THREE2.Vector3(
          point1.x ? point1.x : 0,
          point1.y ? point1.y : 0,
          point1.z ? point1.z : 0
        ),
        new THREE2.Vector3(
          point2.x ? point2.x : 0,
          point2.y ? point2.y : 0,
          point2.z ? point2.z : 0
        )
      ];
      tagObj.position.set(
        linePoints[0].x,
        linePoints[0].y,
        linePoints[0].z
      );
      const tagObj2 = tagObj.clone();
      tagObj2.position.set(
        linePoints[1].x,
        linePoints[1].y,
        linePoints[1].z
      );
      const geometry = new THREE2.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE2.Line(geometry, this.material);
      line.position.set(
        locCoordinates.x,
        locCoordinates.y,
        locCoordinates.z
      );
      line.add(tagObj);
      line.add(tagObj2);
      switch (type) {
        case "u":
          this.leftTags.push(tagObj);
          this.rightTags.push(tagObj2);
          tagObj2.visible = false;
          break;
        case "v":
          this.topTags.push(tagObj);
          this.botTags.push(tagObj2);
          tagObj.visible = false;
          break;
        default:
          this.leftTags.push(tagObj);
          this.rightTags.push(tagObj2);
          tagObj2.visible = false;
          break;
      }
      if (this.context.context.loaders.coordinationMatrix) {
        line.applyMatrix4(
          this.context.context.loaders.coordinationMatrix
        );
        line.position.setY(lowY.y);
      }
      gridGroup.add(line);
    }
  }
  viewTop(bool) {
    this.topTags.forEach((tag) => {
      if (tag.visible !== bool) tag.visible = bool;
    });
  }
  viewBot(bool) {
    this.botTags.forEach((tag) => {
      if (tag.visible !== bool) tag.visible = bool;
    });
  }
  viewLeft(bool) {
    this.leftTags.forEach((tag) => {
      if (tag.visible !== bool) tag.visible = bool;
    });
  }
  viewRight(bool) {
    this.rightTags.forEach((tag) => {
      if (tag.visible !== bool) tag.visible = bool;
    });
  }
  get active() {
    return this._active;
  }
  set active(active) {
    this._active = active;
    this.leftTags.forEach((tag) => {
      tag.visible = active;
    });
    if (!active) {
      this.rightTags.forEach((tag) => {
        tag.visible = active;
      });
      this.topTags.forEach((tag) => {
        tag.visible = active;
      });
    }
    this.botTags.forEach((tag) => {
      tag.visible = active;
    });
    this.mesh.visible = active;
  }
  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
  }
  hex2hsl(hex) {
    const { r, g, b } = this.hexToRgb(hex);
    return this.rgb2hsl(r, g, b);
  }
  rgb2hsl(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  }
  changeColor(color) {
    const e2 = typeof color === "string" ? this.hex2hsl(color) : this.rgb2hsl(color.r, color.g, color.b);
    if (e2[0] && e2[0] < 0.55 && e2[2] && e2[2] >= 0.5 || e2[0] && e2[0] >= 0.55 && e2[2] && e2[2] >= 0.75) {
      return "#000000";
    } else {
      return "#FFFFFF";
    }
  }
};

// src/Viewer/Model/Model.ts
var Model = class {
  constructor(context, modelID, fitToView = false, threeGeometry, propsData, structure, indMap, idsMap, defIndMap, defIdsMap, start) {
    this.context = context;
    this.modelID = modelID;
    this.threeGeometry = threeGeometry;
    // readonly levels: Levels;
    this.activeElements = /* @__PURE__ */ new Set();
    this._showGrids = true;
    this.getSelectionGeom(start);
    this.context.context.scene.threeScene.add(this.threeGeometry);
    this.context.models[modelID] = this;
    this.threeGeometry.name = modelID.toString();
    [this.state, this.defaultState] = this.getGeometryState(
      indMap,
      idsMap,
      defIndMap,
      defIdsMap
    );
    this.boundingBox = this.getBoundingBox();
    if (this.context.utils.stats && start) {
      console.log("selection:", Date.now() - start, "ms");
    }
    if (this.context.utils.stats && start) {
      console.log("state recording:", Date.now() - start, "ms");
    }
    if (this.context.utils.stats && start) {
      console.log("compute active elements:", Date.now() - start, "ms");
    }
    this.properties = new Properties(this, propsData, structure);
    if (this.context.utils.stats && start) {
      console.log("property init:", Date.now() - start, "ms");
    }
    if (threeGeometry.children.length) {
      this.updateBox();
      this.context.utils.navigationCubeUtil.updateBoundingSphere();
    }
    if (fitToView) {
      this.fitToView();
    }
    if (this.context.utils.clippingUtils.edgesActive) {
      this.context.utils.clippingUtils.edges.forEach((edge) => {
        edge.createByModel(Number(modelID));
      });
    }
    this.context.utils.clippingUtils.updateMaterials(this.modelID);
  }
  get showGrids() {
    return this._showGrids;
  }
  set showGrids(bool) {
    this._showGrids = bool;
    if (!this.grids) {
      return;
    }
    this.grids.mesh.visible = bool;
  }
  getBoundingBox() {
    let points = [];
    for (const ch of this.threeGeometry.children) {
      const mesh = ch;
      points.push(
        mesh.geometry.boundingBox.max,
        mesh.geometry.boundingBox.min
      );
    }
    return new THREE2.Box3().setFromPoints(points);
  }
  cloneGeometry(geometry) {
    const preselGeom = new THREE2.BufferGeometry();
    preselGeom.setAttribute("position", geometry.attributes.position);
    preselGeom.setAttribute("ids", geometry.attributes.ids);
    preselGeom.setAttribute("normal", geometry.attributes.normal);
    preselGeom.name = geometry.name;
    return preselGeom;
  }
  getSelectionGeom(start) {
    if (!this.context.selector.selectorModels[this.modelID]) {
      this.context.selector.selectorModels[this.modelID] = [];
    }
    const preselectGroup = new THREE2.Group();
    const selectGroup = new THREE2.Group();
    this.context.selector.preSelection.state[this.modelID] = {};
    this.context.selector.selection.state[this.modelID] = {};
    for (const ch of this.threeGeometry.children) {
      const mesh = ch;
      this.context.bvhManager.applyThreeMeshBVH(mesh.geometry);
      const preselGeom = this.cloneGeometry(mesh.geometry);
      const selGeom = this.cloneGeometry(mesh.geometry);
      preselGeom.setIndex([]);
      selGeom.setIndex([]);
      const preselectMesh = new THREE2.Mesh(
        preselGeom,
        this.context.selector.preSelMaterial
      );
      const selectMesh = new THREE2.Mesh(
        selGeom,
        this.context.selector.selMaterial
      );
      preselectMesh.renderOrder = 1;
      selectMesh.renderOrder = 2;
      preselectGroup.add(preselectMesh);
      this.context.selector.preSelection.state[this.modelID][Number(mesh.name)] = preselGeom;
      selectGroup.add(selectMesh);
      this.context.selector.selection.state[this.modelID][Number(mesh.name)] = selGeom;
    }
    if (this.threeGeometry.children.length) {
      this.context.selector.selectorModels[this.modelID] = this.threeGeometry.children;
      this.context.selector.selection._selectedMesh.add(selectGroup);
      this.context.selector.preSelection._preSelectMesh.add(
        preselectGroup
      );
    }
    this.context.selector.selectedElements[this.modelID] = /* @__PURE__ */ new Set();
  }
  setState(state, defaultState, activeElements) {
    this.state = state;
    this.defaultState = defaultState;
    if (activeElements) {
      this.activeElements = activeElements;
    }
  }
  getGeometryState(indMap, idsMap, defInsMap, defIdsMap) {
    const state = {
      // indMap: indMap ? indMap : {},
      idsMap: idsMap ? idsMap : {},
      needsUpdate: /* @__PURE__ */ new Set()
    };
    const defaultState = {
      indMap: defInsMap ? defInsMap : {},
      idsMap: defIdsMap ? defIdsMap : {}
    };
    for (const child of this.threeGeometry.children) {
      const mesh = child;
      const matInd = Number(child.name);
      if (!indMap) {
        if (mesh.geometry.index) {
          defaultState.indMap[matInd] = mesh.geometry.index.array;
        }
      }
      if (!idsMap) {
        const idsAttr = mesh.geometry.attributes.ids;
        const indAttr = mesh.geometry.index;
        for (let i = 0; i < (indAttr ? indAttr.count : idsAttr.count); i++) {
          const index = indAttr ? indAttr.getX(i) : i;
          const element = idsAttr.getX(index);
          const elData = state.idsMap[element];
          this.activeElements.add(element);
          if (elData) {
            const elMatData = elData[matInd];
            if (elMatData) {
              defaultState.idsMap[element][matInd].push(index);
              elMatData.push(index);
            } else {
              defaultState.idsMap[element][matInd] = [index];
              elData[matInd] = [index];
            }
          } else {
            defaultState.idsMap[element] = {
              [matInd]: [index]
            };
            state.idsMap[element] = { [matInd]: [index] };
          }
        }
      } else {
        Object.keys(idsMap).forEach((id) => {
          this.activeElements.add(Number(id));
        });
      }
    }
    return [state, defaultState];
  }
  updateBox() {
    const points = Object.values(this.context.models).map((model) => {
      if (model.threeGeometry.children.length) {
        model.boundingBox = model.getBoundingBox();
        return [model.boundingBox.max, model.boundingBox.min];
      }
      return [];
    }).flat();
    const box = new THREE2.Box3();
    const context = this.context.context;
    box.setFromPoints(points);
    this.boundingBox = box;
    context.environment.lights.updateLightPosition(box);
    const camera = context.camera.threeCamera;
    camera.far = box.max.distanceTo(box.min) * 3;
    camera.updateProjectionMatrix();
    context.sizes.modelSize = box;
  }
  async fitToView(enableTransition = false) {
    const context = this.context.context;
    const box = context.sizes.modelSize;
    const sceneSize = new THREE2.Vector3();
    box.getSize(sceneSize);
    const sceneCenter = new THREE2.Vector3();
    box.getCenter(sceneCenter);
    const nearFactor = 0.5;
    const radius = Math.max(sceneSize.x, sceneSize.y, sceneSize.z) * nearFactor;
    if (radius !== Infinity) {
      const sphere2 = new THREE2.Sphere(sceneCenter, radius);
      await context.controls.cameraControl.fitToSphere(
        sphere2,
        enableTransition
      );
    }
  }
  addMeshToModel(mesh, selectGroup, preselectGroup, fitToView) {
    this.context.bvhManager.applyThreeMeshBVH(mesh.geometry);
    const preselGeom = this.cloneGeometry(mesh.geometry);
    const selGeom = this.cloneGeometry(mesh.geometry);
    mesh.renderOrder = 0.5;
    preselGeom.setIndex([]);
    selGeom.setIndex([]);
    const preselectMesh = new THREE2.Mesh(
      preselGeom,
      this.context.selector.preSelMaterial
    );
    const selectMesh = new THREE2.Mesh(selGeom, this.context.selector.selMaterial);
    preselectMesh.renderOrder = 1;
    selectMesh.renderOrder = 2;
    preselectGroup.add(preselectMesh);
    this.context.selector.preSelection.state[this.modelID][Number(mesh.name)] = preselGeom;
    selectGroup.add(selectMesh);
    this.context.selector.selection.state[this.modelID][Number(mesh.name)] = selGeom;
    this.threeGeometry.add(mesh);
    this.updateBox();
    this.context.utils.navigationCubeUtil.updateBoundingSphere();
    this.context.utils.clippingUtils.updateMaterials();
    if (fitToView) {
      this.fitToView();
    }
  }
  setupGrids(gridsData) {
    this.grids = new ModelGrids(this, gridsData);
  }
};
var PropertySerializer = class {
  constructor(context) {
    this.context = context;
    // private geometryTypes = new Set([
    //     1123145078, 574549367, 1675464909, 2059837836, 3798115385, 32440307,
    //     3125803723, 3207858831, 2740243338, 2624227202, 4240577450, 3615266464,
    //     3724593414, 220341763, 477187591, 1878645084, 1300840506, 3303107099,
    //     1607154358, 1878645084, 846575682, 1351298697, 2417041796, 3049322572,
    //     3331915920, 1416205885, 776857604, 3285139300, 3958052878, 2827736869,
    //     2732653382, 673634403, 3448662350, 4142052618, 2924175390, 803316827,
    //     2556980723, 1809719519, 2205249479, 807026263, 3737207727, 1660063152,
    //     2347385850, 3940055652, 2705031697, 3732776249, 2485617015, 2611217952,
    //     1704287377, 2937912522, 2770003689, 1281925730, 1484403080, 3448662350,
    //     4142052618, 3800577675, 4006246654, 3590301190, 1383045692, 2775532180,
    //     2047409740, 370225590, 3593883385, 2665983363, 4124623270, 812098782,
    //     3649129432, 987898635, 1105321065, 3510044353, 1635779807, 2603310189,
    //     3406155212, 1310608509, 4261334040, 2736907675, 3649129432, 1136057603,
    //     1260505505, 4182860854, 2713105998, 2898889636, 59481748, 3749851601,
    //     3486308946, 3150382593, 1062206242, 3264961684, 15328376, 1485152156,
    //     370225590, 1981873012, 2859738748, 45288368, 2614616156, 2732653382,
    //     775493141, 2147822146, 2601014836, 2629017746, 1186437898, 2367409068,
    //     1213902940, 3632507154, 3900360178, 476780140, 1472233963, 2804161546,
    //     3008276851, 738692330, 374418227, 315944413, 3905492369, 3570813810,
    //     2571569899, 178912537, 2294589976, 1437953363, 2133299955, 572779678,
    //     3092502836, 388784114, 2624227202, 1425443689, 3057273783, 2347385850,
    //     1682466193, 2519244187, 2839578677, 3958567839, 2513912981, 2830218821,
    //     427810014,
    // ]);
    this.PropsNames = {
      aggregates: {
        name: webIfc.IFCRELAGGREGATES,
        relating: "RelatingObject",
        related: "RelatedObjects",
        key: "children"
      },
      spatial: {
        name: webIfc.IFCRELCONTAINEDINSPATIALSTRUCTURE,
        relating: "RelatingStructure",
        related: "RelatedElements",
        key: "children"
      },
      psets: {
        name: webIfc.IFCRELDEFINESBYPROPERTIES,
        relating: "RelatingPropertyDefinition",
        related: "RelatedObjects",
        key: "IsDefinedBy"
      },
      materials: {
        name: webIfc.IFCRELASSOCIATESMATERIAL,
        relating: "RelatingMaterial",
        related: "RelatedObjects",
        key: "HasAssociations"
      },
      type: {
        name: webIfc.IFCRELDEFINESBYTYPE,
        relating: "RelatingType",
        related: "RelatedObjects",
        key: "IsDefinedBy"
      }
    };
  }
  async serializeAllProperties(modelID, ids, onLoadCallback) {
    return await this.getPropertiesAsBlobs(modelID, ids, onLoadCallback);
  }
  async getPropertiesAsBlobs(modelID, ids, onLoadCallback) {
    const relDefineByPropsSet = await this.getAllRelDefinesByProps(modelID);
    this.context.context?.loadingProgressUtils.initializeLoadingState(
      "Parsing properties",
      relDefineByPropsSet.size + ids.size
    );
    let properties = {};
    const allLines = this.context._parser.GetLineIDsWithType(
      modelID,
      webIfc.IFCPROJECT
    );
    const projectID = allLines.get(0);
    const elementProps = await this.getItemProperty(modelID, projectID);
    elementProps.sets = [];
    properties[projectID] = elementProps;
    for (const relDefineByPropsId of relDefineByPropsSet) {
      this.context.context?.loadingProgressUtils.updateLoadingState(
        "Parsing properties"
      );
      const relDefineByProps = await this.getItemProperty(
        modelID,
        relDefineByPropsId
      );
      if (relDefineByProps) {
        const propertieDef = relDefineByProps.RelatingPropertyDefinition;
        const propertie = await this.getItemProperty(
          modelID,
          propertieDef,
          true
        );
        let curProp = {
          id: propertieDef,
          guid: "null",
          name: "null",
          props: [],
          isQuantities: false
        };
        if (propertie && (propertie.HasProperties || propertie.Quantities)) {
          if (propertie.Quantities) {
            for (const q of propertie.Quantities) {
              this.formatItemProperties(q);
            }
          }
          if (propertie.HasProperties) {
            for (const p of propertie.HasProperties) {
              this.formatItemProperties(p);
            }
          }
          curProp = {
            id: propertieDef,
            guid: propertie.GlobalId,
            name: propertie.Name,
            props: propertie.HasProperties ? propertie.HasProperties : propertie.Quantities ? propertie.Quantities : [],
            isQuantities: !!propertie.Quantities
          };
        }
        const elements = relDefineByProps.RelatedObjects;
        for (const element_id of elements) {
          if (!properties[element_id]) {
            const elementProps2 = await this.getItemProperty(
              modelID,
              element_id
            );
            if (elementProps2) {
              const guid = elementProps2.GlobalId;
              const name = elementProps2.Name;
              const typeName = elementProps2.ObjectType;
              const longName = elementProps2.LongName;
              const type = elementProps2.type;
              const curElProp = {
                id: element_id,
                guid,
                props: {
                  name,
                  typeName,
                  longName,
                  type,
                  elevation: void 0
                },
                sets: [curProp]
              };
              properties[element_id] = curElProp;
              if (type === "IfcBuildingStorey") {
                const elevation = elementProps2.Elevation;
                curElProp.props.elevation = elevation;
              }
            } else {
              const curElProp = {
                id: element_id,
                guid: "null",
                props: {
                  name: "null",
                  typeName: "null",
                  longName: "null",
                  type: "null",
                  elevation: void 0
                },
                sets: [curProp]
              };
              properties[element_id] = curElProp;
            }
          } else {
            properties[element_id].sets.push(curProp);
          }
        }
      }
    }
    for (const id of ids) {
      this.context.context?.loadingProgressUtils.updateLoadingState(
        "Parsing properties"
      );
      if (properties[id]) {
        continue;
      }
      const elementProps2 = await this.getItemProperty(modelID, id);
      if (elementProps2) {
        const guid = elementProps2.GlobalId;
        const name = elementProps2.Name;
        const typeName = elementProps2.ObjectType;
        const longName = elementProps2.LongName;
        const type = elementProps2.type;
        const curElProp = {
          id,
          guid,
          props: {
            name,
            typeName,
            longName,
            type,
            elevation: void 0
          },
          sets: []
        };
        properties[id] = curElProp;
      } else {
        const curElProp = {
          id,
          guid: "null",
          props: {
            name: "null",
            typeName: "null",
            longName: "null",
            type: "null",
            elevation: void 0
          },
          sets: []
        };
        properties[id] = curElProp;
      }
    }
    this.context.context?.loadingProgressUtils.endLoading(
      "Parsing properties"
    );
    return properties;
  }
  async getItemProperty(modelID, id, flatten = false) {
    try {
      const props = await this.context._parser.GetLine(
        modelID,
        id,
        flatten
      );
      if (!props) return null;
      if (props.type) {
        props.type = this.context._parser.GetNameFromTypeCode(
          props.type
        );
      }
      this.formatItemProperties(props);
      return props;
    } catch (e2) {
      console.log(
        `There was a problem getting the properties of the item with ID ${id}, ${e2}`
      );
      return null;
    }
  }
  async getElementsAssembly(modelID) {
    const chunks = await this.getSpatialTreeChunks(modelID);
    const allLines = await this.context._parser.GetLineIDsWithType(
      modelID,
      webIfc.IFCELEMENTASSEMBLY
    );
    const dict = {};
    const ids = [];
    for (let i = 0; i < allLines.size(); i++) {
      const element_id = allLines.get(i);
      ids.push(element_id);
      const assembly = this.newIfcProject(element_id);
      await this.getSpatialNode(modelID, assembly, chunks, false);
      assembly.children.forEach((e2) => {
        const curId = e2.expressID !== void 0 ? e2.expressID : e2.id;
        if (e2.type === "IfcMechanicalFastener") {
          dict[curId] = curId;
          return;
        }
        dict[curId] = element_id;
      });
    }
    return { dict, ids };
  }
  formatItemProperties(props) {
    if (!props) return props;
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (value && value.value !== void 0) props[key] = value.value;
      else if (Array.isArray(value))
        props[key] = value.map((item) => {
          if (item && item.value) return item.value;
          return item;
        });
    });
  }
  // private async initializePropertiesObject(modelID: number) {
  //     return {
  //         coordinationMatrix:
  //             await this.context._parser!.GetCoordinationMatrix(modelID),
  //         globalHeight: await this.getBuildingHeight(modelID),
  //     };
  // }
  // private async getBuildingHeight(modelID: number) {
  //     const building = await this.getBuilding(modelID);
  //     let placement;
  //     const siteReference = building.ObjectPlacement.PlacementRelTo;
  //     if (siteReference) placement = siteReference.RelativePlacement.Location;
  //     else placement = building.ObjectPlacement.RelativePlacement.Location;
  //     const transform = placement.Coordinates.map(
  //         (coord: any) => coord.value
  //     );
  //     return transform[2];
  // }
  // private async getBuilding(modelID: number) {
  //     const allBuildingsIDs = await this.context._parser!.GetLineIDsWithType(
  //         modelID,
  //         IFCBUILDING
  //     );
  //     const buildingID = allBuildingsIDs.get(0);
  //     return this.context._parser!.GetLine(modelID, buildingID, true);
  // }
  // async getAllGeometriesIDs(modelID: number) {
  //     const geometriesIDs: Set<number> = new Set();
  //     const geomTypesArray: number[] = Array.from(this.geometryTypes);
  //     for (let i = 0; i < geomTypesArray.length; i++) {
  //         const category: number = geomTypesArray[i];
  //         const ids = await this.context._parser!.GetLineIDsWithType(
  //             modelID,
  //             category
  //         );
  //         const idsSize = ids.size();
  //         for (let j = 0; j < idsSize; j++) {
  //             geometriesIDs.add(ids.get(j));
  //         }
  //     }
  //     return geometriesIDs;
  // }
  async getAllRelDefinesByProps(modelID) {
    const relDefineByProps = await this.context._parser.GetLineIDsWithType(
      modelID,
      webIfc.IFCRELDEFINESBYPROPERTIES
    );
    const relDefineByPropsSet = /* @__PURE__ */ new Set();
    const idsSize = relDefineByProps.size();
    for (let j = 0; j < idsSize; j++) {
      relDefineByPropsSet.add(relDefineByProps.get(j));
    }
    return relDefineByPropsSet;
  }
  async getSpatialStructure(modelID, includeProperties = false) {
    const chunks = await this.getSpatialTreeChunks(modelID);
    const allLines = await this.context._parser.GetLineIDsWithType(
      modelID,
      webIfc.IFCPROJECT
    );
    const projectID = allLines.get(0);
    const projectData = await this.context._parser.GetLine(
      modelID,
      projectID
    );
    const project = this.newIfcProject(projectData);
    await this.getSpatialNode(modelID, project, chunks, includeProperties);
    return project;
  }
  async getRelatedProperties(modelID, elementID, propsName, recursive = false) {
    const result = [];
    let rels = null;
    if (elementID !== 0)
      rels = await this.context._parser.GetLine(
        modelID,
        elementID,
        false,
        true,
        propsName.key
      )[propsName.key];
    else {
      let vec = this.context._parser.GetLineIDsWithType(
        modelID,
        propsName.name
      );
      rels = [];
      for (let i = 0; i < vec.size(); ++i)
        rels.push({ value: vec.get(i) });
    }
    if (rels == null) return result;
    if (!Array.isArray(rels)) rels = [rels];
    for (let i = 0; i < rels.length; i++) {
      let propSetIds = await this.context._parser.GetLine(
        modelID,
        rels[i].value,
        false,
        false
      )[propsName.relating];
      if (propSetIds == null) continue;
      if (!Array.isArray(propSetIds)) propSetIds = [propSetIds];
      for (let x = 0; x < propSetIds.length; x++) {
        result.push(
          await this.context._parser.GetLine(
            modelID,
            propSetIds[x].value,
            recursive
          )
        );
      }
    }
    return result;
  }
  async getChunks(modelID, chunks, propNames) {
    const relation = await this.context._parser.GetLineIDsWithType(
      modelID,
      propNames.name,
      true
    );
    for (let i = 0; i < relation.size(); i++) {
      const rel = await this.context._parser.GetLine(
        modelID,
        relation.get(i),
        false
      );
      this.saveChunk(chunks, propNames, rel);
    }
  }
  getValue(value) {
    return value && value.value !== void 0 ? value.value : value;
  }
  newIfcProject(data) {
    return {
      id: data.expressID,
      type: "IFCPROJECT",
      name: this.getValue(data.Name),
      children: []
    };
  }
  async getSpatialNode(modelID, node, treeChunks, includeProperties) {
    await this.getChildren(
      modelID,
      node,
      treeChunks,
      this.PropsNames.aggregates,
      includeProperties
    );
    await this.getChildren(
      modelID,
      node,
      treeChunks,
      this.PropsNames.spatial,
      includeProperties
    );
  }
  async getChildren(modelID, node, treeChunks, propNames, includeProperties) {
    const children = treeChunks[node.id];
    if (children == void 0) return;
    const prop = propNames.key;
    const nodes = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      let node2 = this.newNode(
        child,
        this.context._parser.GetLine(modelID, child)
      );
      if (includeProperties) {
        const properties = await this.getItemProperty(
          modelID,
          node2.id
        );
        node2 = { ...properties, ...node2 };
      }
      await this.getSpatialNode(
        modelID,
        node2,
        treeChunks,
        includeProperties
      );
      nodes.push(node2);
    }
    node[prop] = nodes;
  }
  newNode(id, data) {
    return {
      id,
      type: this.context._parser.GetNameFromTypeCode(data.type),
      name: this.getValue(data.Name),
      children: []
    };
  }
  async getSpatialTreeChunks(modelID) {
    const treeChunks = {};
    await this.getChunks(modelID, treeChunks, this.PropsNames.aggregates);
    await this.getChunks(modelID, treeChunks, this.PropsNames.spatial);
    return treeChunks;
  }
  saveChunk(chunks, propNames, rel) {
    const relating = rel[propNames.relating].value;
    const related = rel[propNames.related].map((r) => r.value);
    if (chunks[relating] == void 0) {
      chunks[relating] = related;
    } else {
      chunks[relating] = chunks[relating].concat(related);
    }
  }
};

// src/Viewer/Loaders/IFCLoader/IfcGrid.ts
var Grid = class {
  constructor(parser, modelID, grid) {
    this.parser = parser;
    this.grid = grid;
    this.modelID = modelID;
    this.init();
  }
  getCurValue(prop) {
    return prop && prop.value ? prop.value : prop;
  }
  async init() {
    const res = {
      u: {},
      v: {}
    };
    const gridDict = {};
    const gridProps = await this.parser.GetLine(this.modelID, this.grid);
    if (!gridProps) {
      return;
    }
    const gridPlacementId = this.getCurValue(gridProps.ObjectPlacement);
    const gridPlacement = await this.parser.GetLine(
      this.modelID,
      gridPlacementId
    );
    const relativePlacementId = this.getCurValue(
      gridPlacement.RelativePlacement
    );
    const relativePlacement = await this.parser.GetLine(
      this.modelID,
      relativePlacementId
    );
    const locationID = this.getCurValue(relativePlacement.Location);
    const location = await this.parser.GetLine(this.modelID, locationID);
    const locCoordinates = location.Coordinates;
    const uAxes = gridProps.UAxes;
    const vAxes = gridProps.VAxes;
    for (const uAxis of uAxes) {
      const uAxeId = this.getCurValue(uAxis);
      const uAxisProps = await this.parser.GetLine(this.modelID, uAxeId);
      let name = this.getCurValue(uAxisProps.AxisTag);
      if (!name) {
        name = ".";
      }
      const splited = name.split("/");
      const shortName = splited.length > 1 ? splited.pop() : name;
      if (gridDict[name]) {
        continue;
      }
      gridDict[name] = 1;
      const curve = this.getCurValue(uAxisProps.AxisCurve);
      const curveProps = await this.parser.GetLine(this.modelID, curve);
      let points = curveProps.Points;
      if (!points) {
        continue;
      }
      if (points.value) {
        points = [curveProps.Points];
      }
      const linePoints = [];
      for (const point of points) {
        const pointId = this.getCurValue(point);
        const pointProps = await this.parser.GetLine(
          this.modelID,
          pointId
        );
        const cords = pointProps.Coordinates;
        if (!cords) {
          continue;
        }
        linePoints.push({
          x: this.getCurValue(cords[0]) / 1e3,
          y: 0,
          z: -this.getCurValue(cords[1]) / 1e3
        });
      }
      if (linePoints.length) {
        res["u"][shortName] = linePoints;
      }
    }
    for (const vAxis of vAxes) {
      const vAxeId = this.getCurValue(vAxis);
      const vAxisProps = await this.parser.GetLine(this.modelID, vAxeId);
      let name = this.getCurValue(vAxisProps.AxisTag);
      if (!name) {
        name = ".";
      }
      const splited = name.split("/");
      const shortName = splited.length > 1 ? splited.pop() : name;
      if (gridDict[name]) {
        continue;
      }
      gridDict[name] = 1;
      const curve = this.getCurValue(vAxisProps.AxisCurve);
      const curveProps = await this.parser.GetLine(this.modelID, curve);
      let points = curveProps.Points;
      if (!points) {
        continue;
      }
      if (points.value) {
        points = [curveProps.Points];
      }
      const linePoints = [];
      for (const point of points) {
        const pointId = this.getCurValue(point);
        const pointProps = await this.parser.GetLine(
          this.modelID,
          pointId
        );
        const cords = pointProps.Coordinates;
        if (!cords) {
          continue;
        }
        linePoints.push({
          x: this.getCurValue(cords[0]) / 1e3,
          y: 0,
          z: -this.getCurValue(cords[1]) / 1e3
        });
      }
      if (linePoints.length) {
        res["v"][shortName] = linePoints;
      }
    }
    const gridData = {
      loc: { x: 0, y: 0, z: 0 },
      points: {
        u: {},
        v: {}
      }
    };
    gridData["loc"] = {
      x: this.getCurValue(locCoordinates[0]) / 1e3,
      y: this.getCurValue(locCoordinates[2]) / 1e3,
      z: -this.getCurValue(locCoordinates[1]) / 1e3
    };
    gridData["points"] = res;
    return gridData;
  }
};

// src/Viewer/Loaders/IFCLoader/IFCLoader.ts
var IFCLoader = class {
  constructor(context) {
    this.context = context;
    this.useIfcElemetAssembly = false;
    this.useIfcColors = false;
    this._wasmPath = "./";
    this.chunk = 1e3;
    this.curModelId = -1;
    this.parser = new webIfc.IfcAPI();
    this.parser.SetWasmPath(this._wasmPath, false);
    this.propertySerializer = new PropertySerializer(this);
  }
  getPath(path, dir) {
    return "ifc-parser.wasm";
  }
  async initParser(func) {
    await this.parser.Init(func);
    this.parser.SetLogLevel(4);
  }
  set wasmPath(path) {
    this._wasmPath = path;
  }
  get _parser() {
    return this.parser;
  }
  set _parser(parser) {
    this.parser = parser;
  }
  async loadModel(path, fitToView, onLoadCallback) {
    if (this.context.context instanceof BimatterConverter) {
      return;
    }
    await this.initParser(this.getPath);
    this.context.loadingProgressUtils.setOnLoadCallback(onLoadCallback);
    const startTime = Date.now();
    const { structure, propsData, group, modelID, grids } = await this.getModelData(path);
    this.context.loadingProgressUtils.initializeLoadingState(
      "Preparing...",
      0
    );
    const model = new Model(
      this.context.context,
      modelID,
      fitToView,
      group,
      propsData,
      structure,
      void 0,
      void 0,
      void 0,
      void 0,
      startTime
    );
    model.setupGrids(grids);
    console.log(`Loaded by ${Date.now() - startTime} ms`);
    return model;
  }
  getModelData(path) {
    return new Promise((resolve, reject) => {
      fetch(path).then((response) => response.arrayBuffer()).then(async (file) => {
        if (this.parser) {
          const res = await this.getModelDataFromBuffer(file);
          if (res) {
            resolve(res);
          } else {
            reject("model loading error");
          }
        }
        reject("model loading error");
      }).catch((e2) => {
        console.log(e2);
        reject("model loading error");
      });
    });
  }
  async getModelDataFromBuffer(file) {
    const start = Date.now();
    let ifcModelID = -1;
    try {
      ifcModelID = this.parser.OpenModel(new Uint8Array(file), {
        COORDINATE_TO_ORIGIN: !this.context.coordinationMatrix,
        //@ts-ignore
        OPTIMIZE_PROFILES: true,
        USE_FAST_BOOLS: true
      });
    } catch (e2) {
      console.log(e2);
    }
    console.log("spend to read ifc file: ", Date.now() - start, "ms");
    if (ifcModelID === -1) {
      console.error("Model loading error");
      return false;
    }
    if (this.context.coordinationMatrix) {
      this.parser.SetGeometryTransformation(
        ifcModelID,
        this.context.coordinationMatrix.toArray()
      );
    }
    const ifcParser = new IfcParser(
      this.parser,
      ifcModelID,
      this.context.loadingProgressUtils
    );
    const schema = this.parser.GetModelSchema(ifcModelID);
    console.log("Parsing", schema, "model");
    const allIds = /* @__PURE__ */ new Set();
    let elementsAssembly = this.useIfcElemetAssembly ? await this.propertySerializer.getElementsAssembly(ifcModelID) : null;
    const group = ifcParser.parseData(allIds, elementsAssembly);
    const grids = this.parser.GetLineIDsWithType(ifcModelID, webIfc.IFCGRID);
    const gridsProps = {};
    if (grids && grids.size()) {
      for (let i = 0; i < grids.size(); i++) {
        const grid = grids.get(i);
        const gridObj = new Grid(this.parser, ifcModelID, grid);
        const gridProps = await gridObj.init();
        if (gridProps) gridsProps[grid] = gridProps;
      }
    }
    const modelIds = Object.keys(this.context.context.models).map(
      (p) => Number(p)
    );
    const modelID = modelIds.length ? Math.max(...modelIds) + 1 : 0;
    const propsData = await this.propertySerializer.serializeAllProperties(
      ifcModelID,
      allIds
    );
    const structure = await this.propertySerializer.getSpatialStructure(
      ifcModelID,
      false
    );
    if (!this.context.coordinationMatrix) {
      const matrixArr = this.parser.GetCoordinationMatrix(ifcModelID);
      const matrix = new THREE2.Matrix4().fromArray(matrixArr);
      this.context.coordinationMatrix = matrix;
    }
    this.parser.CloseModel(ifcModelID);
    return { structure, propsData, group, modelID, grids: gridsProps };
  }
};
var IfcParser = class {
  constructor(parser, ifcModelID, progressUtils) {
    this.parser = parser;
    this.ifcModelID = ifcModelID;
    this.progressUtils = progressUtils;
    this.materials = {};
    this.elementsAssembly = null;
  }
  parseData(allIds, elementsAssembly) {
    this.elementsAssembly = elementsAssembly;
    const matMap = {};
    const group = new THREE2.Group();
    const shapes = this.parser.GetLineIDsWithType(
      this.ifcModelID,
      webIfc.IFCPRODUCTDEFINITIONSHAPE
    );
    this.progressUtils?.initializeLoadingState(
      "Parsing geometry",
      shapes.size()
    );
    this.parser.StreamAllMeshes(this.ifcModelID, (mesh) => {
      const placedGeometries = mesh.geometries;
      this.progressUtils?.updateLoadingState("Parsing geometry");
      for (let i = 0; i < placedGeometries.size(); i++) {
        const placedGeometry = placedGeometries.get(i);
        const placedGeomResult = this.getPlacedGeometry(
          placedGeometry,
          mesh.expressID
        );
        if (!placedGeomResult) {
          continue;
        }
        const [placedMesh, material] = placedGeomResult;
        let geometry = placedMesh.geometry.applyMatrix4(
          placedMesh.matrix
        );
        if (elementsAssembly) {
          let curId = elementsAssembly.dict[mesh.expressID];
          allIds.add(curId ? curId : mesh.expressID);
        } else {
          allIds.add(mesh.expressID);
        }
        if (matMap[material.name]) {
          matMap[material.name].push(geometry);
        } else {
          matMap[material.name] = [geometry];
        }
      }
    });
    this.progressUtils?.endLoading("Parsing geometry");
    this.progressUtils?.initializeLoadingState(
      "Building geometry",
      Object.keys(matMap).length
    );
    let materialId = 0;
    Object.entries(matMap).forEach(([matId, geomArr]) => {
      function addGeom(geom, material) {
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
        const mesh = new THREE2.Mesh(geom, material);
        mesh.name = materialId.toString();
        group.add(mesh);
      }
      function mergeGeom(arr, material) {
        const geom = BufferGeometryUtils.mergeGeometries(arr);
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
        const mesh = new THREE2.Mesh(geom, material);
        mesh.name = materialId.toString();
        group.add(mesh);
      }
      function getGeomByChuncks(materials, div = 2) {
        console.log(
          `try to slice geom arr with ${geomArr.length} geoms`
        );
        let tryIter = 0;
        let chunkDiv = div;
        let curArr = geomArr;
        let successed = 0;
        while (true) {
          console.log("try to slice geom arr with div ", chunkDiv);
          let check = true;
          const chunk = Math.floor(curArr.length / chunkDiv);
          let endIndex = 0;
          for (let i = 0; i < curArr.length; i += chunk) {
            try {
              const cChunk = curArr.slice(i, i + chunk);
              if (cChunk.length === 1) {
                addGeom(cChunk[0], materials[matId]);
              } else {
                mergeGeom(cChunk, materials[matId]);
              }
              endIndex = i + chunk;
              materialId++;
              successed += cChunk.length;
            } catch {
              check = false;
              break;
            }
          }
          if (check) {
            console.log(
              `slice geom arr success ${successed} geoms`
            );
            break;
          } else {
            curArr = curArr.slice(endIndex);
          }
          tryIter++;
          chunkDiv *= 4;
          if (tryIter > 20) {
            console.error("tryIter > 10");
            break;
          }
        }
      }
      try {
        const curMat = this.materials[matId];
        mergeGeom(geomArr, curMat);
        materialId++;
      } catch {
        getGeomByChuncks(this.materials);
      }
      geomArr.forEach((geom) => {
        geom.dispose();
      });
      this.progressUtils?.updateLoadingState("Building geometry");
    });
    this.progressUtils?.endLoading("Building geometry");
    return group;
  }
  getPlacedGeometry(placedGeometry, elementId) {
    const geometry = this.getBufferGeometry(placedGeometry, elementId);
    if (!geometry) {
      return null;
    }
    let color = placedGeometry.color;
    if (color.w === 1 && color.x === 0 && color.y === 0 && color.z === 0) {
      color = { x: 178 / 255, y: 178 / 255, z: 178 / 255, w: 1 };
    }
    const material = this.getMeshMaterial(color);
    const mesh = new THREE2.Mesh(geometry);
    mesh.matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
    mesh.matrixAutoUpdate = false;
    return [mesh, material];
  }
  getBufferGeometry(placedGeometry, elementId) {
    const geometry = this.parser.GetGeometry(
      this.ifcModelID,
      placedGeometry.geometryExpressID
    );
    if (geometry.GetVertexDataSize() === 0) {
      geometry.delete();
      return;
    }
    const verts = this.parser.GetVertexArray(
      geometry.GetVertexData(),
      geometry.GetVertexDataSize()
    );
    const indices = this.parser.GetIndexArray(
      geometry.GetIndexData(),
      geometry.GetIndexDataSize()
    );
    const bufferGeometry = this.ifcGeometryToBuffer(
      verts,
      elementId,
      indices
    );
    geometry.delete();
    return bufferGeometry;
  }
  getMeshMaterial(color) {
    const col = new THREE2.Color(color.x, color.y, color.z);
    let colID = col.getHex().toString();
    if (this.materials[colID]) {
      return this.materials[colID];
    }
    const material = new THREE2.MeshLambertMaterial({
      color: col,
      premultipliedAlpha: true,
      name: colID,
      side: THREE2.DoubleSide
    });
    material.transparent = color.w !== 1;
    if (material.transparent) material.opacity = color.w;
    this.materials[colID] = material;
    return material;
  }
  getMeshMatrix(matrix) {
    const mat = new THREE2.Matrix4();
    mat.fromArray(matrix);
    return mat;
  }
  ifcGeometryToBuffer(vertexData, id, indexData) {
    const geometry = new THREE2.BufferGeometry();
    const posFloats = new Float32Array(vertexData.length / 2);
    const normFloats = new Float32Array(vertexData.length / 2);
    const idAttribute = new Uint32Array(vertexData.length / 6);
    let curID = id;
    if (this.elementsAssembly) {
      curID = this.elementsAssembly.dict[id];
      if (curID === void 0) {
        curID = id;
      }
    }
    for (let i = 0; i < vertexData.length; i += 6) {
      let posx = vertexData[i];
      let posy = vertexData[i + 1];
      let posz = vertexData[i + 2];
      const normx = vertexData[i + 3];
      const normy = vertexData[i + 4];
      const normz = vertexData[i + 5];
      posFloats[i / 2] = posx ? posx : 0;
      posFloats[i / 2 + 1] = posy ? posy : 0;
      posFloats[i / 2 + 2] = posz ? posz : 0;
      normFloats[i / 2] = normx ? normx : 0;
      normFloats[i / 2 + 1] = normy ? normy : 0;
      normFloats[i / 2 + 2] = normz ? normz : 0;
      idAttribute[i / 6] = curID;
    }
    geometry.setAttribute("position", new THREE2.BufferAttribute(posFloats, 3));
    geometry.setAttribute("normal", new THREE2.BufferAttribute(normFloats, 3));
    geometry.setAttribute("ids", new THREE2.BufferAttribute(idAttribute, 1));
    geometry.setIndex(new THREE2.BufferAttribute(indexData, 1));
    return geometry;
  }
};

// src/Viewer/Loaders/LoadingProgressUtils/LoadingProgressUtils.ts
var LoadingProgressUtils = class {
  constructor(context) {
    this.context = context;
    this.progressStep = 0.05;
    this.loadingState = {
      total: 0,
      current: 0,
      step: 0.01,
      type: ""
    };
  }
  setContainer(htmlElement) {
    this.htmlElement = htmlElement;
  }
  setOnLoadCallback(onLoadCallback) {
    this.onLoadCallback = onLoadCallback;
  }
  initializeLoadingState(type, total) {
    if (!this.onLoadCallback) return;
    this.loadingState = {
      total: total ? total : 0,
      current: 0,
      step: this.progressStep,
      type
    };
    if (this.htmlElement) {
      this.htmlElement.innerHTML = `${this.loadingState.type} ${this.loadingState.current * 100 / this.loadingState.total}%`;
      this.htmlElement.style.display = "none";
      this.htmlElement.style.display = "block";
    }
    this.onLoadCallback({ ...this.loadingState, type });
  }
  async updateLoadingState(type) {
    if (!this.onLoadCallback) return;
    const realCurrentItem = Math.min(
      this.loadingState.current++,
      this.loadingState.total
    );
    if (realCurrentItem / this.loadingState.total >= this.loadingState.step) {
      if (this.htmlElement) {
        this.htmlElement.innerHTML = `${this.loadingState.type} ${this.loadingState.current * 100 / this.loadingState.total}%`;
      }
      this.onLoadCallback({
        ...this.loadingState,
        type
      });
      this.loadingState.step += this.progressStep;
    }
  }
  endLoading(type) {
    if (!this.onLoadCallback) return;
    this.loadingState.current = this.loadingState.total;
    if (this.htmlElement) {
      this.htmlElement.innerHTML = `${this.loadingState.type}`;
    }
    this.onLoadCallback({
      ...this.loadingState,
      type
    });
  }
};

// src/Viewer/Utils/BinaryReader.ts
var BinaryReader = class {
  constructor(buffer) {
    this.offset = 0;
    this.view = new DataView(buffer);
  }
  readUint8() {
    return this.view.getUint8(this.offset++);
  }
  readUint32() {
    const v2 = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v2;
  }
  readBytes(length) {
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;
    return bytes;
  }
  eof() {
    return this.offset >= this.view.byteLength;
  }
};

// src/Viewer/Loaders/BMTLoader/BMTLoader.ts
var BMTLoader = class {
  constructor(context) {
    this.context = context;
    this.curMatrix = new THREE2.Matrix4();
    this.textDecoder = new TextDecoder("utf-8");
  }
  async streamToBlob(data, start) {
    const ds = new DecompressionStream("gzip");
    const stream = data.stream().pipeThrough(ds);
    const reader = stream.getReader();
    let done = false;
    const resData = [];
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        resData.push(result.value);
      }
    }
    return new Blob(resData);
  }
  async loadModel(path, fitToView) {
    if (this.context.context instanceof BimatterConverter) {
      return;
    }
    const response = await fetch(path);
    const data = await response.blob();
    const start = Date.now();
    console.log("Parsing BMT model");
    try {
      const buffer = await data.arrayBuffer();
      const modelIds = Object.keys(this.context.context.models).map(
        (p) => Number(p)
      );
      const modelID = modelIds.length ? Math.max(...modelIds) + 1 : 0;
      if (this.context.context.utils.stats) {
        console.log("decoding:", Date.now() - start, "ms");
      }
      const group = new THREE2.Group();
      const idsState = {};
      const indState = {};
      const defIdsState = {};
      const defIndState = {};
      let modelData = await this.parseBinaryFile(
        buffer,
        group,
        idsState,
        indState,
        defIdsState,
        defIndState,
        start
      );
      if (this.context.context.utils.stats) {
        console.log("parsing file:", Date.now() - start, "ms");
      }
      if (this.context.context.utils.stats) {
        console.log("parsing geometry:", Date.now() - start, "ms");
      }
      const model = new Model(
        this.context.context,
        modelID,
        fitToView,
        group,
        modelData[0],
        modelData[2],
        indState,
        idsState,
        defIndState,
        defIdsState,
        start
      );
      if (modelData[3]) {
        model.setupGrids(modelData[3]);
      }
      console.log(`Loaded by ${Date.now() - start} ms`);
      return model;
    } catch (e2) {
      console.log(e2);
      throw new Error(e2);
    }
  }
  decodeBuffer(buffer) {
    return this.textDecoder.decode(decoder__namespace.inflate(buffer));
  }
  parseMesh(data) {
    const view = new DataView(data.buffer, data.byteOffset);
    let offset = 0;
    const readChunk = () => {
      const len = view.getUint32(offset, true);
      offset += 4;
      const arr = new Uint8Array(
        data.buffer,
        data.byteOffset + offset,
        len
      );
      offset += len;
      return arr;
    };
    const readChunkIndex = () => {
      const len = view.getUint32(offset, true);
      offset += 4;
      const type = view.getUint32(offset, true);
      offset += 4;
      const arr = new Uint8Array(
        data.buffer,
        data.byteOffset + offset,
        len
      );
      offset += len;
      return {
        data: arr,
        type
      };
    };
    const readChunkColor = () => {
      const r = view.getUint8(offset++) / 255;
      const g = view.getUint8(offset++) / 255;
      const b = view.getUint8(offset++) / 255;
      const opacity = view.getUint8(offset++) / 255;
      const name = view.getUint32(offset, true);
      offset += 4;
      return {
        r,
        g,
        b,
        opacity,
        name
      };
    };
    const pos = readChunk();
    const ids = readChunk();
    const ind = readChunkIndex();
    const colorId = readChunkColor();
    return { pos, ids, ind, colorId };
  }
  async parseBinaryFile(data, group, idsState, indState, defIdsState, defIndState, start) {
    let gridsData;
    const reader = new BinaryReader(data);
    const magic = new TextDecoder().decode(reader.readBytes(3));
    if (magic !== "BMT") {
      throw new Error("Invalid file");
    }
    reader.readUint8();
    const propsData = {};
    const posData = {};
    let structure = { id: 1, type: "none", children: [] };
    const materialState = {};
    const inflate2 = (data2) => this.context.context.utils.decoder.inflate(data2);
    let materialId = 0;
    while (!reader.eof()) {
      const type = reader.readUint8();
      const length = reader.readUint32();
      const data2 = reader.readBytes(length);
      switch (type) {
        case 2 /* MESH */:
          let meshData = this.parseMesh(data2);
          let pos = inflate2(meshData.pos);
          let ids = inflate2(meshData.ids);
          let ind = inflate2(meshData.ind.data);
          const opacity = meshData.colorId.opacity;
          let chunkName = meshData.colorId.name?.toString();
          const colorId = `${meshData.colorId.r},${meshData.colorId.g},${meshData.colorId.b},${opacity}`;
          if (!materialState[colorId]) {
            materialId++;
            materialState[colorId] = {
              id: materialId.toString(),
              material: new THREE2.MeshLambertMaterial({
                color: new THREE2.Color(
                  meshData.colorId.r,
                  meshData.colorId.g,
                  meshData.colorId.b
                ),
                transparent: Number(opacity) < 1,
                opacity: Number(opacity),
                premultipliedAlpha: true,
                name: chunkName ? chunkName : materialId.toString(),
                // vertexColors: true,
                side: THREE2.DoubleSide
              })
            };
          }
          const curMaterial = materialState[colorId];
          if (!chunkName) {
            chunkName = curMaterial.id;
          }
          const geom = new THREE2.BufferGeometry();
          geom.setAttribute(
            "position",
            new THREE2.BufferAttribute(new Float32Array(pos.buffer), 3)
          );
          geom.setAttribute(
            "ids",
            new THREE2.BufferAttribute(new Uint32Array(ids.buffer), 1)
          );
          let indexArr;
          if (ind && ind.length) {
            indexArr = meshData.ind.type === 0 ? new Uint16Array(
              ind.buffer,
              ind.byteOffset,
              ind.byteLength / 2
            ) : new Uint32Array(
              ind.buffer,
              ind.byteOffset,
              ind.byteLength / 4
            );
          } else {
            indexArr = new Uint32Array(
              Array.from(Array(pos.length).keys())
            );
          }
          const uint32 = new Uint32Array(indexArr);
          indState[chunkName] = uint32;
          defIndState[chunkName] = uint32;
          geom.setIndex(new THREE2.BufferAttribute(uint32, 1));
          geom.computeVertexNormals();
          geom.computeBoundingBox();
          const idsAttr = geom.attributes.ids;
          const indAttr = geom.index;
          for (let i = 0; i < (indAttr ? indAttr.count : idsAttr.count); i++) {
            const index = indAttr ? indAttr.getX(i) : i;
            const element = idsAttr.getX(index);
            const elData = idsState[element];
            if (elData) {
              const elMatData = elData[chunkName];
              if (elMatData) {
                elMatData.push(index);
                defIdsState[element][chunkName].push(index);
              } else {
                elData[chunkName] = [index];
                defIdsState[element][chunkName] = [index];
              }
            } else {
              idsState[element] = { [chunkName]: [index] };
              defIdsState[element] = { [chunkName]: [index] };
            }
          }
          if (this.context.context instanceof BimatterViewer && Object.keys(this.context.context.models).length && this.context.coordinationMatrix) {
            geom.applyMatrix4(this.curMatrix);
            geom.applyMatrix4(this.context.coordinationMatrix);
          }
          const mesh = new THREE2.Mesh(geom, curMaterial.material);
          mesh.name = chunkName.toString();
          group.add(mesh);
          meshData = null;
          pos = null;
          ind = null;
          ids = null;
          break;
        case 1 /* PROP */:
          const prop = JSON.parse(this.decodeBuffer(data2));
          propsData[prop.id] = prop;
          break;
        case 3 /* STRUCTURE */:
          structure = JSON.parse(this.decodeBuffer(data2));
          break;
        case 4 /* GRIDS */:
          gridsData = JSON.parse(this.decodeBuffer(data2));
          break;
        case 5 /* MATRIX */:
          if (length) {
            const matrixArr = JSON.parse(this.decodeBuffer(data2));
            this.curMatrix = new THREE2.Matrix4().fromArray(matrixArr).invert();
            if (!this.context.coordinationMatrix) {
              this.context.coordinationMatrix = this.curMatrix.clone().invert();
            }
          }
          break;
      }
    }
    return [propsData, posData, structure, gridsData];
  }
};

// src/Viewer/Loaders/BMTConverter/BMTConverter.ts
var BMTConverter = class {
  constructor(context) {
    this.context = context;
  }
  async convertIfcToBmt(data, useMinVersion, wasmPath) {
    const start = Date.now();
    console.log("start converting");
    function getPath(path, dir) {
      if (wasmPath) {
        return wasmPath;
      }
      return "ifc-parser.wasm";
    }
    await this.context.ifcLoader.initParser(getPath);
    const dataFromBuffer = await this.context.ifcLoader.getModelDataFromBuffer(data);
    if (!dataFromBuffer) {
      return;
    }
    const { propsData, group, structure, grids } = dataFromBuffer;
    return await this.exportBMT({
      propsData,
      group,
      structure,
      start,
      minVersion: useMinVersion,
      grids
    });
  }
  jsonStringifySync(data) {
    return new Promise((resolve) => {
      resolve(JSON.stringify(data));
    });
  }
  async exportIfcModel(modelID, activeView, minVersion, fileName, grids) {
    const start = Date.now();
    return await this.exportBMT({
      modelID,
      activeView,
      minVersion,
      start,
      fileName,
      grids
    });
  }
  writeUint32(value) {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, value, true);
    return buf;
  }
  writeChunk(type, data) {
    const header = new Uint8Array(5);
    header[0] = type;
    new DataView(header.buffer).setUint32(1, data.byteLength, true);
    return [header, data];
  }
  async exportBMT(config) {
    const enc = new TextEncoder();
    const deflate = (d) => this.context.context.utils.decoder.deflate(d);
    const model = config.modelID !== void 0 && this.context.context instanceof BimatterViewer ? this.context.context.models[config.modelID] : {
      properties: {
        data: config.propsData,
        structure: config.structure
      },
      threeGeometry: config.group
    };
    const parts = [];
    const write = (chunk) => {
      parts.push(chunk);
    };
    write(enc.encode("BMT"));
    write(new Uint8Array([1]));
    const writeChunkDirect = (type, data) => {
      const [header, body] = this.writeChunk(type, data);
      write(header);
      write(body);
    };
    const matrix = this.context.context.loaders.coordinationMatrix ? this.context.context.loaders.coordinationMatrix.toArray() : null;
    const matrixBin = deflate(enc.encode(JSON.stringify(matrix)));
    writeChunkDirect(5 /* MATRIX */, matrixBin);
    if (!config.minVersion) {
      const elementIds = Object.keys(model.properties.data);
      for (let i = 0; i < elementIds.length; i++) {
        let data = model.properties.data[Number(elementIds[i])];
        const str = await this.jsonStringifySync(data);
        const compressed = deflate(enc.encode(str));
        writeChunkDirect(1 /* PROP */, compressed);
        data = null;
        if (i % 500 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }
    if (config.grids) {
      const str = await this.jsonStringifySync(config.grids);
      const compressed = deflate(enc.encode(str));
      writeChunkDirect(4 /* GRIDS */, compressed);
    }
    const state = model instanceof Model ? model.defaultState : void 0;
    for (const child of model.threeGeometry.children) {
      const mesh = child;
      const pos = mesh.geometry.attributes.position.array;
      const ids = mesh.geometry.attributes.ids.array;
      const ind = config.activeView || !state ? mesh.geometry.index.array : state.indMap[Number(mesh.name)];
      let posDef = deflate(new Uint8Array(pos.buffer));
      let idsDef = deflate(new Uint8Array(ids.buffer));
      const indBytes = new Uint8Array(
        ind.buffer,
        ind.byteOffset,
        ind.byteLength
      );
      let indDef = deflate(indBytes);
      const indexType = ind instanceof Uint32Array ? 1 : 0;
      const color = mesh.material.color;
      const opacity = mesh.material.opacity;
      const totalSize = 4 + posDef.byteLength + 4 + idsDef.byteLength + 8 + indDef.byteLength + 4 + 4;
      const buffer = new Uint8Array(totalSize);
      const view = new DataView(buffer.buffer);
      let offset = 0;
      view.setUint32(offset, posDef.byteLength, true);
      offset += 4;
      buffer.set(posDef, offset);
      offset += posDef.byteLength;
      view.setUint32(offset, idsDef.byteLength, true);
      offset += 4;
      buffer.set(idsDef, offset);
      offset += idsDef.byteLength;
      view.setUint32(offset, indDef.byteLength, true);
      offset += 4;
      view.setUint32(offset, indexType, true);
      offset += 4;
      buffer.set(indDef, offset);
      offset += indDef.byteLength;
      view.setUint8(offset++, Math.round(color.r * 255));
      view.setUint8(offset++, Math.round(color.g * 255));
      view.setUint8(offset++, Math.round(color.b * 255));
      view.setUint8(offset++, Math.round(opacity * 255));
      view.setUint32(offset, Number(mesh.name), true);
      offset += 4;
      writeChunkDirect(2 /* MESH */, buffer);
      posDef = idsDef = indDef = null;
      await new Promise((r) => setTimeout(r, 0));
    }
    if (!config.minVersion) {
      const structureStr = await this.jsonStringifySync(
        model.properties.structure
      );
      const structureBin = deflate(enc.encode(structureStr));
      writeChunkDirect(3 /* STRUCTURE */, structureBin);
    }
    let json;
    if (config.minVersion) {
      json = await this.jsonStringifySync({
        props: model.properties.data,
        structure: model.properties.structure
      });
    }
    return {
      data: new Blob(parts, { type: "application/octet-stream" }),
      props: json
    };
  }
};

// src/Viewer/Loaders/Loaders.ts
var Loaders = class {
  constructor(context) {
    this.context = context;
    this.bmtLoader = new BMTLoader(this);
    this.ifcLoader = new IFCLoader(this);
    this.bmtConverter = new BMTConverter(this);
    this.loadingProgressUtils = new LoadingProgressUtils(this);
  }
};
var Selection = class {
  constructor(context) {
    this.context = context;
    this._active = true;
    this._useSelectBind = this.useSelect.bind(this);
    this._activeFace = -1;
    this._activeElement = -1;
    this._selectionCallback = null;
    this.state = {};
    this.resetModelSelection = (modelID) => {
      this.context.selectedElements[modelID] = /* @__PURE__ */ new Set();
      for (const matId of Object.keys(this.state[modelID])) {
        this.state[modelID][Number(matId)].setIndex([]);
      }
    };
    this.resetSelect = (full = true) => {
      if (full) {
        for (const modelID of Object.keys(this.state)) {
          this.resetModelSelection(Number(modelID));
        }
        this.context.isSelected = false;
      }
      this._activeFace = -1;
      this._activeElement = -1;
      const _propsUtils = this.context.context.utils.propsUtils;
      _propsUtils.getPropertiesById();
      if (_propsUtils.propConteiner) {
        _propsUtils.propConteiner.replaceChildren();
      }
      if (this._selectionCallback) {
        this._selectionCallback();
      }
    };
    this.selectAll = () => {
      const start = Date.now();
      this.selectByIds(
        0,
        Object.keys(this.context.context.models[0].state.idsMap).map(
          (p) => Number(p)
        )
      );
      console.log("selection time:", Date.now() - start, "ms");
    };
    this.selectByIds = (modelID, ids, removePrevious = true) => {
      const _context = this.context.context;
      _context.context.renderer.needUpdate = false;
      const start = Date.now();
      const curModel = _context.models[modelID];
      const curState = this.state[modelID];
      if (!curState) {
        console.warn("wrong model id");
        return;
      }
      if (removePrevious) {
        this.resetSelect(false);
        this.resetModelSelection(modelID);
        this.context.selectedElements[modelID] = /* @__PURE__ */ new Set();
        if (ids.length === 1) {
          _context.utils.propsUtils.getPropertiesById(modelID, ids[0]);
        } else {
          _context.utils.propsUtils.getPropertiesById();
        }
      } else {
        _context.utils.propsUtils.getPropertiesById();
      }
      for (const id of ids) {
        if (!curModel.activeElements.has(id)) {
          continue;
        }
        this.context.selectedElements[modelID].add(id);
        const vertIndexes = curModel.defaultState.idsMap[id];
        if (!vertIndexes) continue;
        for (const matId of Object.keys(vertIndexes)) {
          const indexes = vertIndexes[Number(matId)];
          const exArr = curState[Number(matId)].index;
          const newIndexArr = new THREE2.BufferAttribute(
            new Uint32Array(exArr.count + indexes.length),
            1
          );
          newIndexArr.set(exArr.array);
          newIndexArr.set(indexes, exArr.count);
          curState[Number(matId)].setIndex(newIndexArr);
        }
      }
      this.context.isSelected = true;
      _context.context.renderer.needUpdate = true;
      _context.context.renderer.render();
      if (this._selectionCallback) {
        this._selectionCallback();
      }
      console.log("select by id: ", Date.now() - start, "ms");
    };
    this.removeSelectByIds = (modelID, ids) => {
      const curSelection = this.context.selectedElements[modelID];
      if (!curSelection || !curSelection.size) {
        return;
      }
      for (const id of ids) {
        curSelection.delete(id);
      }
      this.selectByIds(modelID, Array.from(curSelection), true);
      return;
    };
    if (this._active) {
      this.context.context.context.domElement.addEventListener(
        "click",
        this._useSelectBind
      );
    }
    this._selectedMesh = new THREE2.Group();
    this._selectedMesh.frustumCulled = false;
    this._selectedMesh.renderOrder = 2;
    this.context.context.context.scene.threeScene.add(this._selectedMesh);
  }
  get selectionCallback() {
    return this._selectionCallback;
  }
  set selectionCallback(func) {
    this._selectionCallback = func;
  }
  get selectedMesh() {
    return this._selectedMesh;
  }
  get active() {
    return this._active;
  }
  set active(active) {
    if (this._active !== active) {
      this._active = active;
      const _domElement = this.context.context.context.domElement;
      if (active) {
        _domElement.addEventListener("click", this._useSelectBind);
      } else {
        _domElement.removeEventListener("click", this._useSelectBind);
        this.resetSelect();
      }
    }
  }
  useSelect(e2) {
    const _context = this.context.context;
    const isRemoveSelect = _context.utils.keysUtils.isRemoveSelectionKey(e2);
    const isMultySelect = _context.utils.keysUtils.isMultySelect(e2);
    if (_context.context.controls.moving || this.context.selectionBox.dragging) {
      return;
    }
    if (this.context.preSelection.active && this.context.preSelection.preSelectElement && !isMultySelect && !isRemoveSelect) {
      this.resetSelect(true);
      const modelID = structuredClone(
        this.context.preSelection.preSelectElement.modelID
      );
      for (const curModelId of Object.keys(
        this.context.preSelection.state
      )) {
        for (const matId of Object.keys(
          this.context.preSelection.state[Number(curModelId)]
        )) {
          this.state[Number(curModelId)][Number(matId)].setIndex(
            this.context.preSelection.state[Number(curModelId)][Number(matId)].index
          );
          if (modelID === Number(curModelId)) {
            this.context.selectedElements[modelID] = /* @__PURE__ */ new Set([
              this._activeElement
            ]);
          } else {
            this.context.selectedElements[Number(curModelId)] = /* @__PURE__ */ new Set([]);
          }
        }
      }
      this._activeElement = this.context.preSelection.preSelectElement.elementID;
      _context.utils.propsUtils.getPropertiesById(
        modelID,
        this._activeElement
      );
      this.context.selectedElements[modelID] = /* @__PURE__ */ new Set([
        this._activeElement
      ]);
      this.context.isSelected = true;
    } else {
      const intersects = _context.context.controls.getIntersects();
      if (!intersects) return;
      let curElementId;
      let modelID;
      let ind;
      for (const intersect of intersects) {
        const curModelMesh = intersect.object;
        modelID = Number(curModelMesh.parent.name);
        ind = intersect.faceIndex * 3;
        if (this._activeFace === ind) {
          return;
        }
        const allIds = curModelMesh.geometry.attributes.ids;
        const indexes = curModelMesh.geometry.index;
        const curInd = indexes ? indexes.getX(ind) : ind;
        curElementId = allIds.getX(curInd);
        if (_context.models[modelID].activeElements.has(curElementId)) {
          break;
        }
        curElementId = void 0;
      }
      if (modelID === void 0 || ind === void 0 || !curElementId) {
        return this.resetSelect();
      }
      const selectedElements = this.context.selectedElements;
      if (selectedElements[modelID].has(curElementId) && !isRemoveSelect) {
        return;
      }
      if (isRemoveSelect) {
        selectedElements[modelID].delete(curElementId);
      } else if (isMultySelect) {
        selectedElements[modelID].add(curElementId);
      } else {
        this.resetSelect(true);
        for (const keyModelID of Object.keys(this.state)) {
          if (modelID === Number(keyModelID)) {
            selectedElements[modelID] = /* @__PURE__ */ new Set([curElementId]);
            const inds = _context.models[Number(modelID)].defaultState.idsMap[curElementId];
            for (const matId of Object.keys(inds)) {
              this.state[Number(modelID)][Number(matId)].setIndex(
                inds[Number(matId)]
              );
            }
          } else {
            for (const matId of Object.keys(
              this.state[Number(modelID)]
            )) {
              this.state[Number(modelID)][Number(matId)].setIndex(
                []
              );
            }
            selectedElements[Number(keyModelID)] = /* @__PURE__ */ new Set();
          }
        }
      }
      this.selectByIds(
        modelID,
        Array.from(selectedElements[modelID]),
        false
      );
      this._activeFace = ind;
      this.context.isSelected = true;
      this._activeElement = curElementId;
    }
  }
};
var PreSelection = class {
  constructor(context) {
    this.context = context;
    this._active = true;
    this._usePreSelectBind = this.usePreSelect.bind(this);
    this._activeElement = -1;
    this._activeFace = -1;
    this._activePoint = new THREE2.Vector3();
    this._activeModelID = 0;
    this._intersectLength = 0;
    this._intersectDistance = 0;
    this._needUpdate = 0;
    this.deep = 0;
    this.state = {};
    this.resetPreselect = () => {
      this._preSelectMesh.children.forEach((ch) => {
        ch.children.forEach((ch2) => {
          ch2.geometry.setIndex([]);
        });
      });
      this._activeFace = -1;
      this._activeElement = -1;
      this._intersectLength = 0;
      this._intersectDistance = 0;
      this.deep = 0;
    };
    const _context = this.context.context.context;
    if (this._active) {
      _context.renderer.addCallback(this._usePreSelectBind);
    }
    this._preSelectMesh = new THREE2.Group();
    this._preSelectMesh.frustumCulled = false;
    this._preSelectMesh.renderOrder = 1;
    _context.scene.threeScene.add(this._preSelectMesh);
  }
  get preSelectElement() {
    if (this._activeElement > 0) {
      return {
        mesh: this._preSelectMesh,
        elementID: this._activeElement,
        modelID: this._activeModelID,
        point: this._activePoint,
        distance: this._intersectDistance
      };
    }
    return null;
  }
  get setDeep() {
    this.deep = (this.deep + 1) % this._intersectLength;
    return this.deep;
  }
  usePreSelect() {
    const _context = this.context.context;
    const _control = _context.context.controls;
    if (_control.moving) {
      this.resetPreselect();
      return;
    }
    const intersects = _control.getIntersects();
    let curElementId;
    let curModel;
    let ind;
    let point;
    let distance;
    let curModelMesh;
    let i = 0;
    for (const intersect of intersects) {
      curModelMesh = intersect.object;
      const modelID = Number(curModelMesh.parent.name);
      curModel = _context.models[modelID];
      ind = intersect.faceIndex * 3;
      point = intersect.point;
      distance = intersect.distance;
      const allIds = curModelMesh.geometry.attributes.ids;
      const indexes = curModelMesh.geometry.index;
      const curInd = indexes ? indexes.getX(ind) : ind;
      curElementId = allIds.getX(curInd);
      if (i === this.deep) {
        break;
      }
      i++;
    }
    if (this._activeElement === curElementId || this._activeFace === ind) {
      return;
    }
    this._needUpdate++;
    if (this._needUpdate > this.deep) {
      this.deep = 0;
      this._needUpdate = 0;
    }
    if (!curElementId || !curModel || ind === void 0 || !point || !distance || !curModelMesh) {
      return this.resetPreselect();
    }
    const vertIndexes = curModel.defaultState.idsMap[curElementId];
    if (!vertIndexes) return;
    Object.keys(this.state).forEach((curModelId) => {
      Object.keys(this.state[Number(curModelId)]).forEach((matId) => {
        const geom = this.state[Number(curModelId)][Number(matId)];
        if (!geom) return;
        if (curModel.modelID === Number(curModelId) && vertIndexes[Number(matId)]) {
          geom.setIndex(vertIndexes[Number(matId)]);
        } else {
          geom.setIndex([]);
        }
      });
    });
    this._activeModelID = curModel.modelID;
    this._activeFace = ind;
    this._activeElement = curElementId;
    this._activePoint = point;
    this._intersectDistance = distance;
  }
  get active() {
    return this._active;
  }
  set active(active) {
    if (this._active !== active) {
      const _renderer = this.context.context.context.renderer;
      this._active = active;
      if (active) {
        _renderer.addCallback(this._usePreSelectBind);
      } else {
        _renderer.removeCallback(this._usePreSelectBind);
        this.resetPreselect();
      }
    }
  }
};
var SelectionBox = class {
  constructor(context, cssClassName) {
    this.context = context;
    this.params = {
      toolMode: "box",
      selectionMode: "intersection",
      liveUpdate: false,
      resetPrevous: false
    };
    this.isMouseDown = false;
    this.isAdd = true;
    this.isFullElementInside = true;
    this.selectionPoints = [];
    this.dragging = false;
    this.selectionShapeNeedsUpdate = false;
    this.selectionNeedsUpdate = false;
    this.invWorldMatrix = new THREE2.Matrix4();
    this.camLocalPosition = new THREE2.Vector3();
    this.tempRay = new THREE2.Ray();
    this.centroid = new THREE2.Vector3();
    this.screenCentroid = new THREE2.Vector3();
    this.faceNormal = new THREE2.Vector3();
    this.toScreenSpaceMatrix = new THREE2.Matrix4();
    //@ts-ignore
    this.boxPoints = new Array(8).fill().map(() => new THREE2.Vector3());
    //@ts-ignore
    this.boxLines = new Array(12).fill().map(() => new THREE2.Line3());
    this.lassoSegments = [];
    this.perBoundsSegments = [];
    this.renderSelectionBind = this.renderSelection.bind(this);
    this.usePreselectionState = this.context.usePreSelection;
    this.selectionShape = new THREE2.Line(
      new THREE2.BufferGeometry(),
      new THREE2.LineBasicMaterial({ linewidth: 3 })
    );
    const _context = this.context.context.context;
    this.selectionShape.material.color.set(16750592).convertSRGBToLinear();
    this.selectionShape.renderOrder = 1;
    this.selectionShape.position.z = -0.2;
    this.selectionShape.scale.setScalar(10);
    _context.camera.threeCamera.add(this.selectionShape);
    this.helper = document.createElement("div");
    this.helper.style.pointerEvents = "none";
    if (cssClassName) {
      this.helper.classList.add(cssClassName);
    } else {
      this.helper.classList.add("selectionBox_tech");
    }
    this.helper.hidden = true;
    let startX = -Infinity;
    let startY = -Infinity;
    let prevX = -Infinity;
    let prevY = -Infinity;
    let helperStartX = -Infinity;
    let helperStartY = -Infinity;
    const tempVec0 = new THREE2.Vector2();
    const tempVec1 = new THREE2.Vector2();
    const tempVec2 = new THREE2.Vector2();
    const renderer = _context.renderer.threeRenderer;
    renderer.domElement.parentElement.appendChild(this.helper);
    _context.renderer.addCallback(this.renderSelectionBind);
    window.addEventListener("keydown", (e2) => {
      const isRemoveSelect = this.context.context.utils.keysUtils.isRemoveSelectionKey(e2);
      const isBoxSelect = this.context.context.utils.keysUtils.isBoxSelect(e2);
      if (isBoxSelect) {
        this.isPlus(true);
      } else if (isRemoveSelect) {
        this.isPlus(false);
      }
    });
    renderer.domElement.addEventListener("pointerdown", (e2) => {
      const isRemoveSelect = this.context.context.utils.keysUtils.isRemoveSelectionKey(e2);
      const isBoxSelect = this.context.context.utils.keysUtils.isBoxSelect(e2);
      if (!isBoxSelect && !isRemoveSelect) return;
      prevX = _context.mouse.cords.x;
      prevY = _context.mouse.cords.y;
      helperStartX = _context.mouse.cords.x;
      helperStartY = _context.mouse.cords.y;
      startX = _context.mouse.position.x;
      startY = _context.mouse.position.y;
      this.selectionPoints.length = 0;
      _context.controls.cameraControl.enabled = false;
      this.usePreselectionState = this.context.usePreSelection;
      this.context.usePreSelection = false;
      this.helper.hidden = true;
      this.isMouseDown = true;
      this.helper.style.left = prevX + "px";
      this.helper.style.top = prevY + "px";
      this.helper.style.width = "0px";
      this.helper.style.height = "0px";
    });
    renderer.domElement.addEventListener("pointerup", () => {
      if (!this.isMouseDown) return;
      this.selectionShape.visible = false;
      if (this.selectionPoints.length) {
        this.selectionNeedsUpdate = true;
      }
      this.isMouseDown = false;
      this.context.usePreSelection = this.usePreselectionState;
      this.context.context.context.controls.cameraControl.enabled = true;
      setTimeout(() => {
        this.dragging = false;
        this.reset();
      }, 100);
      this.helper.hidden = true;
    });
    renderer.domElement.addEventListener("pointermove", (e2) => {
      const _utils = this.context.context.utils;
      const isRemoveSelect = _utils?.keysUtils.isRemoveSelectionKey(e2);
      const isBoxSelect = _utils.keysUtils.isBoxSelect(e2);
      if ((1 & e2.buttons) === 0) {
        return;
      }
      if (isBoxSelect) {
        this.isFullElementInside = true;
      } else if (isRemoveSelect) {
        this.isFullElementInside = false;
      }
      if (Math.abs(helperStartX - e2.clientX) < 5 && Math.abs(helperStartY - e2.clientY) < 5) {
        return;
      }
      if (!this.isMouseDown) {
        return;
      }
      this.dragging = true;
      if (this.params.toolMode === "box") {
        const pointBottomRightX = Math.max(helperStartX, e2.clientX);
        const pointBottomRightY = Math.max(helperStartY, e2.clientY);
        const pointTopLeftX = Math.min(helperStartX, e2.clientX);
        const pointTopLeftY = Math.min(helperStartY, e2.clientY);
        this.helper.hidden = false;
        this.helper.style.left = pointTopLeftX + "px";
        this.helper.style.top = pointTopLeftY + "px";
        this.helper.style.width = pointBottomRightX - pointTopLeftX + "px";
        this.helper.style.height = pointBottomRightY - pointTopLeftY + "px";
        if (helperStartX >= e2.clientX) {
          this.isFullElementInside = false;
          this.helper.classList.add("selectBox_green");
          this.helper.classList.remove("selectBox_blue");
        } else {
          this.isFullElementInside = true;
          this.helper.classList.remove("selectBox_green");
          this.helper.classList.add("selectBox_blue");
        }
      }
      const mouse = this.context.context.context.mouse;
      const ex = mouse.position.x;
      const ey = mouse.position.y;
      const nx = mouse.position.x;
      const ny = mouse.position.y;
      if (this.params.toolMode === "box") {
        this.selectionPoints.length = 3 * 5;
        this.selectionPoints[0] = startX;
        this.selectionPoints[1] = startY;
        this.selectionPoints[2] = 0;
        this.selectionPoints[3] = nx;
        this.selectionPoints[4] = startY;
        this.selectionPoints[5] = 0;
        this.selectionPoints[6] = nx;
        this.selectionPoints[7] = ny;
        this.selectionPoints[8] = 0;
        this.selectionPoints[9] = startX;
        this.selectionPoints[10] = ny;
        this.selectionPoints[11] = 0;
        this.selectionPoints[12] = startX;
        this.selectionPoints[13] = startY;
        this.selectionPoints[14] = 0;
        if (ex !== prevX || ey !== prevY) {
          this.selectionShapeNeedsUpdate = true;
        }
        prevX = ex;
        prevY = ey;
        this.selectionShape.visible = true;
        if (this.params.liveUpdate) {
          this.selectionNeedsUpdate = true;
        }
      } else {
        this.isFullElementInside = true;
        if (Math.abs(ex - prevX) >= 3 || Math.abs(ey - prevY) >= 3) {
          const i = this.selectionPoints.length / 3 - 1;
          const i3 = i * 3;
          let doReplace = false;
          if (this.selectionPoints.length > 3) {
            tempVec0.set(
              this.selectionPoints[i3 - 3],
              this.selectionPoints[i3 - 3 + 1]
            );
            tempVec1.set(
              this.selectionPoints[i3],
              this.selectionPoints[i3 + 1]
            );
            tempVec1.sub(tempVec0).normalize();
            tempVec0.set(
              this.selectionPoints[i3],
              this.selectionPoints[i3 + 1]
            );
            tempVec2.set(nx, ny);
            tempVec2.sub(tempVec0).normalize();
            const dot = tempVec1.dot(tempVec2);
            doReplace = dot > 0.99;
          }
          if (doReplace) {
            this.selectionPoints[i3] = nx;
            this.selectionPoints[i3 + 1] = ny;
          } else {
            this.selectionPoints.push(nx, ny, 0);
          }
          this.selectionShapeNeedsUpdate = true;
          this.selectionShape.visible = true;
          prevX = ex;
          prevY = ey;
          if (this.params.liveUpdate) {
            this.selectionNeedsUpdate = true;
          }
        }
      }
    });
  }
  reset() {
    this.invWorldMatrix = new THREE2.Matrix4();
    this.camLocalPosition = new THREE2.Vector3();
    this.tempRay = new THREE2.Ray();
    this.centroid = new THREE2.Vector3();
    this.screenCentroid = new THREE2.Vector3();
    this.faceNormal = new THREE2.Vector3();
    this.toScreenSpaceMatrix = new THREE2.Matrix4();
    this.boxPoints = new Array(8).fill().map(() => new THREE2.Vector3());
    this.boxLines = new Array(12).fill().map(() => new THREE2.Line3());
    this.lassoSegments = [];
    this.perBoundsSegments = [];
  }
  isPlus(isPlus) {
    this.isAdd = isPlus;
    if (isPlus) {
      this.helper.classList.add("selectBox_plus");
      this.helper.classList.remove("selectBox_minus");
    } else {
      this.helper.classList.add("selectBox_minus");
      this.helper.classList.remove("selectBox_plus");
    }
  }
  renderSelection() {
    const _context = this.context.context;
    const camera = _context.context.camera.threeCamera;
    if (this.selectionShapeNeedsUpdate) {
      if (this.params.toolMode === "lasso") {
        const ogLength = this.selectionPoints.length;
        this.selectionPoints.push(
          this.selectionPoints[0],
          this.selectionPoints[1],
          this.selectionPoints[2]
        );
        this.selectionShape.geometry.setAttribute(
          "position",
          new THREE2.Float32BufferAttribute(this.selectionPoints, 3, false)
        );
        this.selectionPoints.length = ogLength;
      } else {
        this.selectionShape.geometry.setAttribute(
          "position",
          new THREE2.Float32BufferAttribute([], 3, false)
        );
      }
      this.selectionShape.geometry.attributes.position.needsUpdate = true;
      this.selectionShape.frustumCulled = false;
      this.selectionShapeNeedsUpdate = false;
    }
    if (this.selectionNeedsUpdate) {
      this.selectionNeedsUpdate = false;
      if (this.selectionPoints.length > 0) {
        const selectorModels = _context.selector.selectorModels;
        const models = _context.models;
        for (let modelID = 0; modelID < Object.keys(selectorModels).length; modelID++) {
          const mesh = selectorModels[modelID];
          const selectedIds = /* @__PURE__ */ new Set();
          mesh.forEach((ch) => {
            this.updateSelection(
              ch,
              models[modelID].state,
              selectedIds
            );
            this.params.resetPrevous = false;
          });
          const arr = Array.from(selectedIds);
          if (this.isAdd) {
            this.context.selection.selectByIds(
              modelID,
              arr,
              this.params.resetPrevous || this.params.liveUpdate
            );
          } else {
            this.context.selection.removeSelectByIds(modelID, arr);
          }
        }
      }
    }
    if (camera instanceof THREE2.PerspectiveCamera) {
      const yScale = Math.tan(THREE2.MathUtils.DEG2RAD * camera.fov / 2) * this.selectionShape.position.z;
      this.selectionShape.scale.set(-yScale * camera.aspect, -yScale, 1);
    }
  }
  updateSelection(mesh, state, set) {
    window.performance.now();
    const selectModel = false;
    const camera = this.context.context.context.camera.threeCamera;
    this.toScreenSpaceMatrix.copy(mesh.matrixWorld).premultiply(camera.matrixWorldInverse).premultiply(camera.projectionMatrix);
    while (this.lassoSegments.length < this.selectionPoints.length) {
      this.lassoSegments.push(new THREE2.Line3());
    }
    this.lassoSegments.length = this.selectionPoints.length;
    for (let s = 0, l = this.selectionPoints.length; s < l; s += 3) {
      const line = this.lassoSegments[s];
      const sNext = (s + 3) % l;
      line.start.x = this.selectionPoints[s];
      line.start.y = this.selectionPoints[s + 1];
      line.end.x = this.selectionPoints[sNext];
      line.end.y = this.selectionPoints[sNext + 1];
    }
    this.invWorldMatrix.copy(mesh.matrixWorld).invert();
    this.camLocalPosition.set(0, 0, 0).applyMatrix4(camera.matrixWorld).applyMatrix4(this.invWorldMatrix);
    const isFull = this.isFullElementInside || this.params.toolMode === "lasso";
    const idsDict = {};
    const indexAttr = mesh.geometry.index;
    const idsAttr = mesh.geometry.attributes.ids;
    mesh.geometry.boundsTree.shapecast({
      //@ts-ignore
      intersectsBounds: (box, isLeaf, score, depth) => {
        const { min, max } = box;
        let index = 0;
        let minY = Infinity;
        let maxY = -Infinity;
        let minX = Infinity;
        for (let x = 0; x <= 1; x++) {
          for (let y = 0; y <= 1; y++) {
            for (let z = 0; z <= 1; z++) {
              const v2 = this.boxPoints[index];
              v2.x = x === 0 ? min.x : max.x;
              v2.y = y === 0 ? min.y : max.y;
              v2.z = z === 0 ? min.z : max.z;
              v2.project(camera);
              index++;
              if (v2.y < minY) minY = v2.y;
              if (v2.y > maxY) maxY = v2.y;
              if (v2.x < minX) minX = v2.x;
            }
          }
        }
        const parentSegments = this.perBoundsSegments[depth - 1] || this.lassoSegments;
        const segmentsToCheck = this.perBoundsSegments[depth] || [];
        segmentsToCheck.length = 0;
        this.perBoundsSegments[depth] = segmentsToCheck;
        for (let i = 0, l = parentSegments.length; i < l; i++) {
          const line = parentSegments[i];
          const sx = line.start.x;
          const sy = line.start.y;
          const ex = line.end.x;
          const ey = line.end.y;
          if (sx < minX && ex < minX) continue;
          const startAbove = sy > maxY;
          const endAbove = ey > maxY;
          if (startAbove && endAbove) continue;
          const startBelow = sy < minY;
          const endBelow = ey < minY;
          if (startBelow && endBelow) continue;
          segmentsToCheck.push(line);
        }
        if (segmentsToCheck.length === 0) {
          return threeMeshBvh.NOT_INTERSECTED;
        }
        const hull = this.getConvexHull(this.boxPoints);
        const lines = hull.map((p, i) => {
          const nextP = hull[(i + 1) % hull.length];
          const line = this.boxLines[i];
          line.start.copy(p);
          line.end.copy(nextP);
          return line;
        });
        if (this.pointRayCrossesSegments(
          segmentsToCheck[0].start,
          lines
        ) % 2 === 1) {
          return threeMeshBvh.INTERSECTED;
        }
        let crossings = 0;
        for (let i = 0, l = hull.length; i < l; i++) {
          const v2 = hull[i];
          const pCrossings = this.pointRayCrossesSegments(
            v2,
            segmentsToCheck
          );
          if (i === 0) {
            crossings = pCrossings;
          }
          if (crossings !== pCrossings) {
            return threeMeshBvh.INTERSECTED;
          }
        }
        for (let i = 0, l = lines.length; i < l; i++) {
          const boxLine = lines[i];
          for (let s = 0, ls = segmentsToCheck.length; s < ls; s++) {
            if (this.lineCrossesLine(boxLine, segmentsToCheck[s])) {
              return threeMeshBvh.INTERSECTED;
            }
          }
        }
        return crossings % 2 === 0 ? threeMeshBvh.NOT_INTERSECTED : threeMeshBvh.CONTAINED;
      },
      //@ts-ignore
      intersectsTriangle: (tri, index, contained, depth) => {
        const i3 = index * 3;
        const a = i3 + 0;
        const segmentsToCheck = this.perBoundsSegments[depth];
        if (this.params.selectionMode === "centroid" || this.params.selectionMode === "centroid-visible") {
          this.centroid.copy(tri.a).add(tri.b).add(tri.c).multiplyScalar(1 / 3);
          this.screenCentroid.copy(this.centroid).applyMatrix4(this.toScreenSpaceMatrix);
          if (contained || this.pointRayCrossesSegments(
            this.screenCentroid,
            segmentsToCheck
          ) % 2 === 1) {
            if (this.params.selectionMode === "centroid-visible") {
              tri.getNormal(this.faceNormal);
              this.tempRay.origin.copy(this.centroid).addScaledVector(this.faceNormal, 1e-6);
              this.tempRay.direction.subVectors(
                this.camLocalPosition,
                this.centroid
              );
              const res = mesh.geometry.boundsTree.raycastFirst(
                this.tempRay,
                THREE2.DoubleSide
              );
              if (res) {
                return false;
              }
            }
            addId(a);
            return selectModel;
          }
        } else if (this.params.selectionMode === "intersection") {
          if (contained) {
            addId(a);
            return selectModel;
          }
          const vertices = [tri.a, tri.b, tri.c];
          for (let j = 0; j < 3; j++) {
            const v2 = new THREE2.Vector3();
            v2.copy(vertices[j]).applyMatrix4(
              this.toScreenSpaceMatrix
            );
            const crossings = this.pointRayCrossesSegments(
              v2,
              segmentsToCheck
            );
            if (crossings % 2 === 1) {
              addId(a);
              return selectModel;
            }
          }
          const lines = [
            this.boxLines[0],
            this.boxLines[1],
            this.boxLines[2]
          ];
          lines[0].start.copy(tri.a);
          lines[0].end.copy(tri.b);
          lines[1].start.copy(tri.b);
          lines[1].end.copy(tri.c);
          lines[2].start.copy(tri.c);
          lines[2].end.copy(tri.a);
          for (let i = 0; i < 3; i++) {
            const l = lines[i];
            for (let s = 0, sl = segmentsToCheck.length; s < sl; s++) {
              if (this.lineCrossesLine(l, segmentsToCheck[s])) {
                addId(a);
                return selectModel;
              }
            }
          }
        }
        return false;
      }
    });
    function addId(i) {
      const i2 = indexAttr.getX(i);
      const id = idsAttr.getX(i2);
      if (!isFull) {
        set.add(id);
      } else {
        if (idsDict[id]) {
          idsDict[id]++;
        } else {
          idsDict[id] = 1;
        }
      }
    }
    if (isFull) {
      for (const id_str of Object.keys(idsDict)) {
        const id = Number(id_str);
        const curIdState = state.idsMap[id];
        let count = 0;
        for (const matId of Object.keys(curIdState)) {
          const curIdStateVal = curIdState[Number(matId)];
          count += curIdStateVal.length;
        }
        if (idsDict[id] === count / 3) {
          set.add(id);
        }
      }
    }
  }
  getConvexHull(points) {
    function orientation(p, q, r) {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val == 0) {
        return 0;
      }
      return val > 0 ? 1 : 2;
    }
    function distSq(p1, p2) {
      return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }
    function compare(p1, p2) {
      const o = orientation(p0, p1, p2);
      if (o == 0) return distSq(p0, p2) >= distSq(p0, p1) ? -1 : 1;
      return o == 2 ? -1 : 1;
    }
    let lowestY = Infinity;
    let lowestIndex = -1;
    for (let i = 0, l = points.length; i < l; i++) {
      const p = points[i];
      if (p.y < lowestY) {
        lowestIndex = i;
        lowestY = p.y;
      }
    }
    const p0 = points[lowestIndex];
    points[lowestIndex] = points[0];
    points[0] = p0;
    points = points.sort(compare);
    let m = 1;
    const n2 = points.length;
    for (let i = 1; i < n2; i++) {
      while (i < n2 - 1 && orientation(p0, points[i], points[i + 1]) == 0) {
        i++;
      }
      points[m] = points[i];
      m++;
    }
    const hull = [points[0], points[1], points[2]];
    for (let i = 3; i < m; i++) {
      while (orientation(
        hull[hull.length - 2],
        hull[hull.length - 1],
        points[i]
      ) !== 2) {
        hull.pop();
      }
      hull.push(points[i]);
    }
    return hull;
  }
  pointRayCrossesLine(point, line, prevDirection, thisDirection) {
    const { start, end } = line;
    const px = point.x;
    const py = point.y;
    const sy = start.y;
    const ey = end.y;
    if (sy === ey) return false;
    if (py > sy && py > ey) return false;
    if (py < sy && py < ey) return false;
    const sx = start.x;
    const ex = end.x;
    if (px > sx && px > ex) return false;
    const EPS = 1e-6;
    if (Math.abs(py - sy) < EPS) {
      if (py === sy && prevDirection !== thisDirection) {
        return false;
      }
      return true;
    }
    const dx = ex - sx;
    const dy = ey - sy;
    const perpx = dy;
    const perpy = -dx;
    const pdx = px - sx;
    const pdy = py - sy;
    const dot = perpx * pdx + perpy * pdy;
    if (Math.sign(dot) !== Math.sign(perpx)) {
      return true;
    }
    return false;
  }
  pointRayCrossesSegments(point, segments) {
    let crossings = 0;
    const firstSeg = segments[segments.length - 1];
    let prevDirection = firstSeg.start.y > firstSeg.end.y;
    for (let s = 0, l = segments.length; s < l; s++) {
      const line = segments[s];
      const thisDirection = line.start.y > line.end.y;
      if (this.pointRayCrossesLine(
        point,
        line,
        prevDirection,
        thisDirection
      )) {
        crossings++;
      }
      prevDirection = thisDirection;
    }
    return crossings;
  }
  lineCrossesLine(l1, l2) {
    function ccw(A3, B3, C3) {
      return (C3.y - A3.y) * (B3.x - A3.x) > (B3.y - A3.y) * (C3.x - A3.x);
    }
    const A2 = l1.start;
    const B2 = l1.end;
    const C2 = l2.start;
    const D = l2.end;
    return ccw(A2, C2, D) !== ccw(B2, C2, D) && ccw(A2, B2, C2) !== ccw(A2, B2, D);
  }
};
var Selector = class {
  constructor(context) {
    this.context = context;
    this.selMaterial = new THREE2.MeshLambertMaterial({
      color: new THREE2.Color("rgb(17, 148, 189)"),
      clippingPlanes: [],
      side: THREE2.DoubleSide
    });
    this.preSelMaterial = new THREE2.MeshLambertMaterial({
      color: new THREE2.Color("rgb(104, 198, 227)"),
      clippingPlanes: [],
      side: THREE2.DoubleSide
    });
    this.selectedElements = {};
    this.isSelected = false;
    this.selectorModels = {};
    this._usePreSelection = true;
    this._selection = new Selection(this);
    this._preSelection = new PreSelection(this);
    this.selectionBox = new SelectionBox(this);
  }
  get useDoubleSideMaterial() {
    return this.selMaterial.side === THREE2.DoubleSide;
  }
  set useDoubleSideMaterial(bool) {
    this.selMaterial.side = bool ? THREE2.DoubleSide : THREE2.FrontSide;
    this.preSelMaterial.side = bool ? THREE2.DoubleSide : THREE2.FrontSide;
  }
  set usePreSelection(usePreSelection) {
    this._preSelection.active = usePreSelection;
  }
  set useSelection(useSelection) {
    this._selection.active = useSelection;
  }
  get usePreSelection() {
    return this._preSelection.active;
  }
  get useSelection() {
    return this._selection.active;
  }
  get preSelection() {
    return this._preSelection;
  }
  get selection() {
    return this._selection;
  }
};
var GeometryUtils = class {
  constructor(context) {
    this.context = context;
    this.hideSelectedElements = () => {
      const selEls = this.context.context.selector.selectedElements;
      for (const modelIDStr of Object.keys(selEls)) {
        const modelID = Number(modelIDStr);
        const set = selEls[modelID];
        if (set.size === 0) continue;
        this.hideElementsByIds(modelID, Array.from(set));
      }
    };
    this.isolateSelectedElements = () => {
      const selEls = this.context.context.selector.selectedElements;
      const models = this.context.context.models;
      for (const modelIDStr of Object.keys(models)) {
        const modelID = Number(modelIDStr);
        let set = selEls[modelID];
        if (set.size === 0) {
          set = /* @__PURE__ */ new Set();
        }
        this.isolateElementsByIds(modelID, Array.from(set));
      }
      if (this.context.clippingUtils.active) {
        this.context.clippingUtils.updateEdges();
      }
    };
    this.hideElementsByIds = (modelID, ids) => {
      const _context = this.context.context;
      const start = Date.now();
      _context.context.renderer.needUpdate = false;
      const curModel = _context.models[modelID];
      if (!curModel) return;
      const needsUpdate = /* @__PURE__ */ new Set();
      for (const id of ids) {
        curModel.activeElements.delete(id);
        const curData = curModel.state.idsMap[id];
        if (!curData) continue;
        Object.keys(curData).forEach((k) => {
          if (k === "-1") return;
          needsUpdate.add(Number(k));
          curModel.state.needsUpdate.add(Number(k));
        });
      }
      const map = {};
      for (const id of curModel.activeElements) {
        const curData = curModel.state.idsMap[id];
        if (!curData) continue;
        for (const matId of Object.keys(curData)) {
          if (matId === "-1" || !needsUpdate.has(Number(matId))) continue;
          const cur = map[matId];
          if (cur) {
            map[matId].push(curData[Number(matId)]);
          } else {
            map[matId] = [curData[Number(matId)]];
          }
        }
      }
      curModel.threeGeometry.children.forEach((child) => {
        const mesh = child;
        if (needsUpdate.has(Number(mesh.name))) {
          const excludeInd = map[mesh.name];
          if (!excludeInd) {
            mesh.geometry.setIndex([]);
          } else {
            let l = 0;
            excludeInd.forEach((arr) => l += arr.length);
            const newArr = new THREE2.BufferAttribute(new Uint32Array(l), 1);
            let offset = 0;
            excludeInd.forEach((arr) => {
              newArr.set(arr, offset);
              offset += arr.length;
            });
            mesh.geometry.setIndex(newArr);
          }
          _context.bvhManager.update(mesh);
        }
      });
      if (this.context.clippingUtils.active) {
        this.context.clippingUtils.updateEdges();
      }
      this.update(modelID, ids, true);
      if (_context.utils.stats) {
        console.log("hidding: ", Date.now() - start);
      }
    };
    this.isolateElementsByIds = (modelID, ids) => {
      const start = Date.now();
      const _context = this.context.context;
      _context.context.renderer.needUpdate = false;
      const curModel = _context.models[modelID];
      if (!curModel) return;
      const map = /* @__PURE__ */ new Map();
      for (const id of ids) {
        const curData = curModel.state.idsMap[id];
        if (!curData) continue;
        for (const matId of Object.keys(curData)) {
          if (matId === "-1") continue;
          if (map.has(matId)) {
            map.get(matId).push(curData[Number(matId)]);
          } else {
            map.set(matId, [curData[Number(matId)]]);
          }
        }
      }
      curModel.threeGeometry.children.forEach((child) => {
        const mesh = child;
        if (map.has(mesh.name)) {
          const arrs = map.get(mesh.name);
          let l = 0;
          arrs.forEach((arr) => l += arr.length);
          const indexArr = new THREE2.BufferAttribute(new Uint32Array(l), 1);
          let offset = 0;
          arrs.forEach((arr) => {
            indexArr.set(arr, offset);
            offset += arr.length;
          });
          mesh.geometry.setIndex(indexArr);
        } else {
          mesh.geometry.setIndex([]);
        }
        curModel.state.needsUpdate.add(Number(mesh.name));
        _context.bvhManager.update(mesh);
      });
      curModel.activeElements = new Set(ids);
      this.update(modelID, ids);
      if (_context.utils.stats) {
        console.log("isolating: ", Date.now() - start);
      }
    };
    this.showAll = () => {
      const start = Date.now();
      const _context = this.context.context;
      _context.context.renderer.needUpdate = false;
      for (const modelID of Object.keys(_context.models)) {
        const curModel = _context.models[Number(modelID)];
        this.resetModelVisibility(curModel);
        curModel.state.needsUpdate = /* @__PURE__ */ new Set();
      }
      if (this.context.clippingUtils.active) {
        this.context.clippingUtils.updateEdges();
      }
      _context.context.renderer.needUpdate = true;
      if (_context.utils.stats) {
        console.log("showAll: ", Date.now() - start);
      }
    };
    this.createGeometryChunk = (config) => {
      const ids = config.ids;
      const start = Date.now();
      if (!ids.length) {
        return;
      }
      let material;
      material = config.material;
      if (!material) {
        let color = config.color;
        if (!color) {
          color = new THREE2.Color("#484848");
        }
        if (typeof color === "string") {
          color = new THREE2.Color(color);
        }
        material = new THREE2.MeshLambertMaterial({ color });
      }
      config.removePrevious;
      const modelID = config.modelID;
      const _context = this.context.context;
      const model = _context.models[modelID];
      if (!model) {
        return new Error("unknown modelID");
      }
      const modelData = model.state;
      const chunkID = model.threeGeometry.children.length;
      const modelDataIds = modelData.idsMap;
      const dataToRemove = {};
      for (const id of ids) {
        const idData = modelDataIds[id];
        const newData = {
          [chunkID]: []
        };
        for (const matKey of Object.keys(idData)) {
          const indData = idData[Number(matKey)];
          if (Number(matKey) === -1) {
            newData[-1] = indData;
          } else {
            let curExData = dataToRemove[Number(matKey)];
            if (!curExData) {
              dataToRemove[Number(matKey)] = [indData];
            } else {
              dataToRemove[Number(matKey)].push(indData);
            }
          }
        }
        modelDataIds[id] = structuredClone(newData);
      }
      const newPosAttr = [];
      const newIdsAttr = [];
      let newIndex = 0;
      let allIndexOfChunk = [];
      for (const matId_str of Object.keys(dataToRemove)) {
        if (matId_str === "-1") continue;
        const matId = Number(matId_str);
        let curMesh;
        for (const child of model.threeGeometry.children) {
          const mesh2 = child;
          if (mesh2.name === matId_str) {
            curMesh = mesh2;
            break;
          }
        }
        if (!curMesh) return new Error("undefined mesh id");
        const posAttr = curMesh.geometry.attributes.position;
        const idsAttr = curMesh.geometry.attributes.ids;
        const curDataToRemove = [].concat.apply(
          [],
          //@ts-ignore
          dataToRemove[matId]
        );
        curDataToRemove.forEach((ind) => {
          allIndexOfChunk.push(newIndex);
          newPosAttr.push(
            posAttr.getX(ind),
            posAttr.getY(ind),
            posAttr.getZ(ind)
          );
          const curId = idsAttr.getX(ind);
          if (modelDataIds[curId][chunkID]) {
            modelDataIds[curId][chunkID].push(newIndex);
          } else {
            modelDataIds[curId][chunkID] = [newIndex];
          }
          newIdsAttr.push(curId);
          newIndex++;
        });
      }
      const removeMatIds = Object.keys(dataToRemove);
      const map = {};
      for (const curData of Object.values(modelDataIds)) {
        for (const matId of Object.keys(curData)) {
          if (matId === "-1" || !removeMatIds.includes(matId)) continue;
          const cur = map[matId];
          if (cur) {
            map[matId].push(curData[Number(matId)]);
          } else {
            map[matId] = [structuredClone(curData[Number(matId)])];
          }
        }
      }
      model.threeGeometry.children.forEach((child) => {
        const mesh2 = child;
        if (removeMatIds.includes(mesh2.name)) {
          const excludeInd = map[mesh2.name];
          let newIndexes;
          if (!excludeInd) {
            newIndexes = new Uint32Array();
          } else {
            let l = 0;
            excludeInd.forEach((arr) => l += arr.length);
            newIndexes = new Uint32Array(l);
            let offset = 0;
            excludeInd.forEach((arr) => {
              newIndexes.set(arr, offset);
              offset += arr.length;
            });
          }
          mesh2.geometry.setIndex(new THREE2.BufferAttribute(newIndexes, 1));
          _context.bvhManager.update(mesh2);
        }
      });
      const geom = new THREE2.BufferGeometry();
      geom.setAttribute(
        "position",
        new THREE2.BufferAttribute(new Float32Array(newPosAttr), 3)
      );
      geom.setAttribute(
        "ids",
        new THREE2.BufferAttribute(new Uint32Array(newIdsAttr), 1)
      );
      geom.computeVertexNormals();
      geom.setIndex(allIndexOfChunk);
      _context.bvhManager.applyThreeMeshBVH(geom);
      const mesh = new THREE2.Mesh(geom, material);
      model.threeGeometry.add(mesh);
      mesh.name = chunkID.toString();
      if (model.activeElements.size !== Object.keys(modelDataIds).length) {
        this.isolateElementsByIds(
          modelID,
          Array.from(model.activeElements)
        );
      }
      if (_context.utils.stats) {
        console.log("create Chunk: ", Date.now() - start);
      }
    };
  }
  update(modelID, ids, remove) {
    const _context = this.context.context;
    if (_context.selector.isSelected && remove) {
      _context.selector.selection.removeSelectByIds(modelID, ids);
    }
    _context.selector.preSelection.resetPreselect();
    _context.context.renderer.needUpdate = true;
  }
  resetModelVisibility(model) {
    for (const child of model.threeGeometry.children) {
      const mesh = child;
      if (!model.state.needsUpdate.has(Number(mesh.name))) {
        continue;
      }
      let indexArr = model.defaultState.indMap[Number(mesh.name)];
      if (!indexArr) {
        indexArr = null;
      }
      mesh.geometry.setIndex(new THREE2.BufferAttribute(indexArr, 1));
      this.context.context.bvhManager.update(mesh);
    }
    model.activeElements = new Set(
      Object.keys(model.state.idsMap).map((e2) => Number(e2))
    );
  }
  resetAllModelsChunks() {
    for (const model of Object.values(this.context.context.models)) {
      this.resetModelChunks(model.modelID);
    }
  }
  resetModelChunks(modelID) {
    const start = Date.now();
    const _context = this.context.context;
    _context.context.renderer.needUpdate = false;
    const model = _context.models[modelID];
    const modelState = model.state;
    const modelDefState = model.defaultState;
    modelState.idsMap = structuredClone(modelDefState.idsMap);
    modelState.needsUpdate = /* @__PURE__ */ new Set();
    const toRemove = [];
    for (const child of model.threeGeometry.children) {
      const mesh = child;
      if (!modelDefState.indMap[Number(mesh.name)]) {
        toRemove.push(mesh);
      } else {
        modelState.needsUpdate.add(Number(mesh.name));
      }
    }
    toRemove.forEach((m) => m.removeFromParent());
    this.resetModelVisibility(model);
    model.state.needsUpdate = /* @__PURE__ */ new Set();
    _context.context.renderer.needUpdate = true;
    if (_context.utils.stats) {
      console.log("resetModelChunks: ", Date.now() - start);
    }
  }
};

// src/Viewer/Utils/PropsUtils.ts
var PropsUtils = class {
  constructor(context) {
    this.context = context;
    this.useDefaultGetPropertiesById = true;
  }
  getPropertiesById(modelID, elementId) {
    if (this._getPropertiesByIdOveride) {
      const result = this._getPropertiesByIdOveride(modelID, elementId);
      if (result) {
        return result;
      }
    }
    if (elementId === void 0 || modelID === void 0) {
      return;
    }
    if (this.useDefaultGetPropertiesById) {
      const curProp = this.context.context.models[modelID].properties.data[elementId];
      if (!curProp) {
        return;
      }
      if (this.propConteiner) {
        this.generatePropsThree(curProp);
      }
      return curProp;
    }
  }
  setGetParamsByIdOverride(func, returnExSelection = false) {
    this._getPropertiesByIdOveride = func;
    if (func && returnExSelection) {
      let exSelection;
      for (const modelID of Object.keys(
        this.context.context.selector.selectedElements
      )) {
        const elements = this.context.context.selector.selectedElements[Number(modelID)];
        if (elements.size === 1) {
          if (exSelection) {
            exSelection = void 0;
            break;
          }
          exSelection = {
            modelID: Number(modelID),
            element_id: elements.values().next().value
          };
        }
      }
      if (exSelection) {
        func(exSelection.modelID, exSelection.element_id);
      }
    }
  }
  initPropConteiner(conteiner) {
    this.propConteiner = conteiner;
  }
  generatePropsThree(curProp) {
    this.propConteiner?.replaceChildren();
    const params = document.createElement("h4");
    params.innerHTML = "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440\u044B \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430";
    this.propConteiner?.appendChild(params);
    const props = curProp.props;
    const typeProps = curProp.tprops;
    const propSets = curProp.sets;
    const row1 = document.createElement("div");
    row1.style.display = "flex";
    row1.style.justifyContent = "center";
    row1.style.flexDirection = "row";
    const paramNameDiv1 = document.createElement("div");
    const paramValueDiv1 = document.createElement("div");
    row1.appendChild(paramNameDiv1);
    row1.appendChild(paramValueDiv1);
    paramNameDiv1.innerHTML = "guid: ";
    paramNameDiv1.style.marginRight = "5px";
    paramValueDiv1.innerHTML = curProp.guid;
    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.justifyContent = "center";
    row2.style.flexDirection = "row";
    const paramNameDiv2 = document.createElement("div");
    const paramValueDiv2 = document.createElement("div");
    row2.appendChild(paramNameDiv2);
    row2.appendChild(paramValueDiv2);
    paramNameDiv2.innerHTML = "id: ";
    paramNameDiv2.style.marginRight = "5px";
    paramValueDiv2.innerHTML = curProp.id.toString();
    this.propConteiner.appendChild(row1);
    this.propConteiner.appendChild(row2);
    if (props && Object.keys(props).length) {
      const params2 = document.createElement("h4");
      params2.innerHTML = "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u044D\u043A\u0437\u0435\u043C\u043F\u043B\u044F\u0440\u0430";
      this.propConteiner?.appendChild(params2);
      for (const paramName of Object.keys(props)) {
        const paramValue = props[paramName];
        const row = document.createElement("div");
        this.propConteiner.appendChild(row);
        row.style.display = "flex";
        row.style.justifyContent = "center";
        row.style.flexDirection = "row";
        const paramNameDiv = document.createElement("div");
        paramNameDiv.style.marginRight = "5px";
        const paramValueDiv = document.createElement("div");
        row.appendChild(paramNameDiv);
        row.appendChild(paramValueDiv);
        paramNameDiv.innerHTML = paramName + ": ";
        paramValueDiv.innerHTML = paramValue ? paramValue : "";
      }
    }
    if (typeProps && Object.keys(typeProps).length) {
      const params2 = document.createElement("h4");
      params2.innerHTML = "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0442\u0438\u043F\u0430";
      this.propConteiner?.appendChild(params2);
      for (const paramName of Object.keys(typeProps)) {
        const paramValue = typeProps[paramName];
        const row = document.createElement("div");
        this.propConteiner.appendChild(row);
        row.style.display = "flex";
        row.style.justifyContent = "center";
        row.style.flexDirection = "row";
        const paramNameDiv = document.createElement("div");
        paramNameDiv.style.marginRight = "5px";
        const paramValueDiv = document.createElement("div");
        row.appendChild(paramNameDiv);
        row.appendChild(paramValueDiv);
        paramNameDiv.innerHTML = paramName + ": ";
        paramValueDiv.innerHTML = paramValue ? paramValue : "";
      }
    }
    if (propSets && propSets.length) {
      for (const set of propSets) {
        const params2 = document.createElement("h4");
        params2.innerHTML = set.name;
        this.propConteiner?.appendChild(params2);
        for (const param of set.props) {
          const paramName = param.Name;
          let paramValue;
          if (param.isQuantities) {
            if (props.LengthValue) {
              paramValue = Math.round(props.LengthValue * 100) / 100;
            } else if (props.WeightValue) {
              paramValue = Math.round(props.WeightValue * 100) / 100;
            } else if (props.VolumeValue) {
              paramValue = Math.round(props.VolumeValue * 100) / 100;
            } else if (props.AreaValue) {
              paramValue = Math.round(props.AreaValue * 100) / 100;
            }
          } else {
            paramValue = param.NominalValue;
          }
          const row = document.createElement("div");
          this.propConteiner.appendChild(row);
          row.style.display = "flex";
          row.style.justifyContent = "center";
          row.style.flexDirection = "row";
          const paramNameDiv = document.createElement("div");
          paramNameDiv.style.marginRight = "5px";
          const paramValueDiv = document.createElement("div");
          row.appendChild(paramNameDiv);
          row.appendChild(paramValueDiv);
          paramNameDiv.innerHTML = paramName + ": ";
          paramValueDiv.innerHTML = paramValue ? paramValue : "";
        }
      }
    }
  }
};
var PlaneHelper = class extends THREE2.Object3D {
  constructor(context, plane, location, normal) {
    super();
    this.context = context;
    this.plane = plane;
    this.location = location;
    this.helper = new THREE2.Group();
    this.thickness = 0.08;
    this._deltaVector = null;
    this.material = new THREE2.MeshBasicMaterial({
      color: "#858585",
      side: THREE2.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    this.active = context.helpersActive;
    const planeHelper = this.getHelperGeometry();
    this.helper.add(planeHelper);
    this.plane.coplanarPoint(this.helper.position);
    this.helper.lookAt(normal.x, normal.y, normal.z);
    this.helper.position.set(
      this.location.x,
      this.location.y,
      this.location.z
    );
    this.context.heplers.push(this);
    this.dragControl = this.context.context.context.context.controls.createDragControl([
      planeHelper
    ]);
    this.dragControl.defaultActive = false;
    if (this.active) {
      this.hoverOn({ object: planeHelper });
      this.addToView();
    }
  }
  addDragControlEvents() {
    this.dragControl.addEventListener(
      "dragstart",
      this.dragStart.bind(this)
    );
    this.dragControl.addEventListener("drag", this.drag.bind(this));
    this.dragControl.addEventListener("dragend", this.dragEnd.bind(this));
    this.dragControl.addEventListener("hoveron", this.hoverOn.bind(this));
    this.dragControl.addEventListener("hoveroff", this.hoverOff.bind(this));
  }
  removeDragControlEvents() {
  }
  dragStart(e2) {
    this._deltaVector = null;
    this.context.context.context.context.controls.moving = true;
    this.context.context.context.selector.preSelection.resetPreselect();
    this.context.context.context.context.controls.cameraControl.enabled = false;
  }
  drag(e2) {
    const pointTech = e2.point;
    if (!this._deltaVector) {
      if (e2.object.position.z === 0) {
        this._deltaVector = new THREE2.Vector3(0, 0, 0);
      } else {
        const curPos2 = pointTech.clone().applyMatrix4(e2.object.matrixWorld);
        console.log(curPos2);
        console.log(this.helper.position);
        this._deltaVector = new THREE2.Vector3(
          this.helper.position.x - curPos2.x,
          this.helper.position.y - curPos2.y,
          this.helper.position.z - curPos2.z
        );
      }
    }
    const point = new THREE2.Vector3(
      pointTech.x + this._deltaVector.x,
      pointTech.y + this._deltaVector.y,
      pointTech.z + this._deltaVector.z
    );
    const normal = this.plane.normal;
    this.plane.setFromNormalAndCoplanarPoint(normal, point);
    const curPos = this.location.clone();
    const projection1 = point.clone().projectOnVector(normal);
    const projection2 = curPos.clone().projectOnVector(normal);
    let delta;
    const angl = normal.angleTo(point);
    if (angl > Math.PI / 2) {
      delta = projection2.length() - projection1.length();
    } else {
      delta = projection1.length() + projection2.length();
    }
    const newNormalVec = normal.clone().multiplyScalar(delta);
    const normalisedPoint = curPos.add(newNormalVec);
    if (this.context.edgesActive) {
      this.context.updateEdges();
    }
    this.helper.position.set(
      normalisedPoint.x,
      normalisedPoint.y,
      normalisedPoint.z
    );
  }
  dragEnd() {
    setTimeout(() => {
      this.context.context.context.context.controls.moving = false;
    }, 10);
    this.context.context.context.context.controls.cameraControl.enabled = true;
  }
  hoverOn(e2) {
    if (!this.context.context.context.context.controls.moving) {
      this.context.context.context.context.controls.moving = true;
      this.context.context.context.selector.preSelection.resetPreselect();
    }
    this.material.color = new THREE2.Color("#ebeb34");
  }
  hoverOff(e2) {
    this.context.context.context.context.controls.moving = false;
    this.material.color = new THREE2.Color("#858585");
  }
  dispose() {
    this.removeFromView();
    this.helper.children.forEach((p) => p.geometry.dispose());
    this.dragControl.removeEventListener(
      "dragstart",
      this.dragStart.bind(this)
    );
    this.dragControl.removeEventListener("drag", this.drag.bind(this));
    this.dragControl.removeEventListener(
      "dragend",
      this.dragEnd.bind(this)
    );
    this.dragControl.removeEventListener(
      "hoveron",
      this.hoverOn.bind(this)
    );
    this.dragControl.removeEventListener(
      "hoveroff",
      this.hoverOff.bind(this)
    );
  }
  toggle() {
    if (this.active) {
      this.removeFromView();
    } else {
      this.addToView();
    }
    this.active = !this.active;
  }
  removeFromView() {
    this.removeDragControlEvents();
    this.helper.removeFromParent();
  }
  addToView() {
    this.addDragControlEvents();
    this.context.context.context.context.scene.threeScene.add(this.helper);
  }
  getHelperGeometry() {
    const planeHelper = new THREE2.Mesh(new THREE2.PlaneGeometry(3, 3), this.material);
    this.customArrow();
    return planeHelper;
  }
  customArrow() {
    const length = 2;
    const ARROW_BODY = new THREE2.CylinderGeometry(1, 1, 1, 12).rotateX(Math.PI / 2).translate(0, 0, 0.5);
    const ARROW_HEAD = new THREE2.ConeGeometry(1, 1, 12).rotateX(-Math.PI / 2).translate(0, 0, -0.5);
    var body = new THREE2.Mesh(ARROW_BODY, this.material);
    body.scale.set(this.thickness / 2, this.thickness / 2, -length);
    var head = new THREE2.Mesh(ARROW_HEAD, this.material);
    head.position.set(0, 0, -length);
    head.scale.set(
      3 * this.thickness,
      length * this.thickness,
      10 * this.thickness
    );
    this.helper.add(body, head);
  }
};
var ClippingEdges = class extends THREE2.Object3D {
  constructor(context, plane) {
    super();
    this.context = context;
    this.plane = plane;
    this.tempVector = new THREE2.Vector3();
    this.tempVector1 = new THREE2.Vector3();
    this.tempVector2 = new THREE2.Vector3();
    this.tempVector3 = new THREE2.Vector3();
    this.tempLine = new THREE2.Line3();
    this.localPlane = new THREE2.Plane();
    this.active = this.context.edgesActive;
    const clippingPlanes = [];
    for (const edge of context.edges) {
      if (edge.plane !== plane) {
        if (edge.lines) {
          for (const modelID of Object.keys(edge.lines)) {
            for (const matId of Object.keys(
              edge.lines[Number(modelID)]
            )) {
              const line = edge.lines[Number(modelID)][Number(matId)];
              if (line.material.clippingPlanes) {
                line.material.clippingPlanes.push(plane);
              } else {
                line.material.clippingPlanes = [plane];
              }
            }
          }
        }
        clippingPlanes.push(edge.plane);
      }
    }
    this.material = new THREE2.LineBasicMaterial({
      clippingPlanes,
      color: "black"
    });
    this.context.edges.push(this);
  }
  dispose() {
    if (!this.lines) return;
    for (const modelID of Object.keys(this.lines)) {
      for (const matId of Object.keys(this.lines[Number(modelID)])) {
        const line = this.lines[Number(modelID)][Number(matId)];
        line.removeFromParent();
        line.geometry.dispose();
      }
    }
  }
  toggle() {
    if (this.active) {
      this.removeFromView();
    } else {
      this.addToView();
    }
    this.active = !this.active;
  }
  removeFromView() {
    if (!this.lines) return;
    for (const modelID of Object.keys(this.lines)) {
      for (const matId of Object.keys(this.lines[Number(modelID)])) {
        const line = this.lines[Number(modelID)][Number(matId)];
        line.visible = false;
      }
    }
  }
  addToView() {
    if (!this.lines) return;
    for (const modelID of Object.keys(this.lines)) {
      for (const matId of Object.keys(this.lines[Number(modelID)])) {
        const line = this.lines[Number(modelID)][Number(matId)];
        line.visible = true;
      }
    }
  }
  create() {
    this.tempVector = new THREE2.Vector3();
    this.tempVector1 = new THREE2.Vector3();
    this.tempVector2 = new THREE2.Vector3();
    this.tempVector3 = new THREE2.Vector3();
    this.tempLine = new THREE2.Line3();
    this.localPlane = new THREE2.Plane();
    if (!this.lines) {
      this.lines = {};
    }
    const res = new THREE2.Group();
    for (const modelID of Object.keys(
      this.context.context.context.models
    )) {
      this.createByModel(Number(modelID), res);
    }
    return res;
  }
  createByModel(modelID, res) {
    if (!this.lines) return;
    const model = this.context.context.context.models[modelID];
    this.lines[modelID];
    const modelState = {};
    for (const mesh of model.threeGeometry.children) {
      const matId = Number(mesh.name);
      const lineGeometry = new THREE2.BufferGeometry();
      const linePosAttr = new THREE2.BufferAttribute(
        new Float32Array(3e5),
        3,
        false
      );
      linePosAttr.setUsage(THREE2.DynamicDrawUsage);
      lineGeometry.setAttribute("position", linePosAttr);
      const segment = new THREE2.LineSegments(lineGeometry, this.material);
      segment.frustumCulled = false;
      segment.material.color.set("black").convertSRGBToLinear();
      modelState[matId] = segment;
      res?.add(segment);
    }
    this.lines[modelID] = modelState;
  }
  update() {
    if (!this.lines) {
      this.create();
    }
    if (!this.lines) return;
    const clippingPlane = this.plane;
    this.localPlane.copy(clippingPlane);
    for (const modelID of Object.keys(this.lines)) {
      const models = this.context.context.context.models;
      for (const mesh of models[Number(modelID)].threeGeometry.children) {
        const matId = Number(mesh.name);
        const curSegment = this.lines[Number(modelID)][Number(matId)];
        let index = 0;
        const posAttr = curSegment.geometry.attributes.position;
        const curGeom = mesh.geometry;
        const colliderBvh = curGeom.boundsTree;
        if (!colliderBvh) {
          continue;
        }
        colliderBvh.shapecast({
          intersectsBounds: (box) => {
            return this.localPlane.intersectsBox(box);
          },
          intersectsTriangle: (tri, triIndex) => {
            let count = 0;
            this.tempLine.start.copy(tri.a);
            this.tempLine.end.copy(tri.b);
            if (this.localPlane.intersectLine(
              this.tempLine,
              this.tempVector
            )) {
              posAttr.setXYZ(
                index,
                this.tempVector.x,
                this.tempVector.y,
                this.tempVector.z
              );
              index++;
              count++;
            }
            this.tempLine.start.copy(tri.b);
            this.tempLine.end.copy(tri.c);
            if (this.localPlane.intersectLine(
              this.tempLine,
              this.tempVector
            )) {
              posAttr.setXYZ(
                index,
                this.tempVector.x,
                this.tempVector.y,
                this.tempVector.z
              );
              count++;
              index++;
            }
            this.tempLine.start.copy(tri.c);
            this.tempLine.end.copy(tri.a);
            if (this.localPlane.intersectLine(
              this.tempLine,
              this.tempVector
            )) {
              posAttr.setXYZ(
                index,
                this.tempVector.x,
                this.tempVector.y,
                this.tempVector.z
              );
              count++;
              index++;
            }
            if (count === 3) {
              this.tempVector1.fromBufferAttribute(
                posAttr,
                index - 3
              );
              this.tempVector2.fromBufferAttribute(
                posAttr,
                index - 2
              );
              this.tempVector3.fromBufferAttribute(
                posAttr,
                index - 1
              );
              if (this.tempVector3.equals(this.tempVector1) || this.tempVector3.equals(this.tempVector2)) {
                count--;
                index--;
              } else if (this.tempVector1.equals(this.tempVector2)) {
                posAttr.setXYZ(index - 2, this.tempVector3);
                count--;
                index--;
              }
            }
            if (count !== 2) {
              index -= count;
            }
          }
        });
        curSegment.geometry.setDrawRange(0, index);
        curSegment.position.copy(clippingPlane.normal).multiplyScalar(-1e-5);
        posAttr.needsUpdate = true;
      }
    }
  }
};
var ClippingUtils = class {
  constructor(context) {
    this.context = context;
    this.planes = [];
    this.active = false;
    this._edgesActive = true;
    this._helpersActive = true;
    this.edges = [];
    this.heplers = [];
  }
  updateMaterials(modelID) {
    if (modelID !== void 0) {
      this.updateMaterial(this.context.context.models[modelID]);
    } else {
      const models = this.context.context.models;
      for (const model of Object.values(models)) {
        this.updateMaterial(model);
      }
    }
    this.context.context.selector.selMaterial.clippingPlanes = this.planes;
    this.context.context.selector.preSelMaterial.clippingPlanes = this.planes;
    this.context.context.context.camera.threeCamera.updateMatrixWorld();
  }
  updateMaterial(model) {
    model.threeGeometry.children.forEach((ch) => {
      ch.material.clippingPlanes = this.planes;
    });
  }
  createPlane() {
    if (!this.active) {
      this.toggle();
    }
    const models = this.context.context.models;
    const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
    const intersect = this.context.context.context.controls.getIntersects(meshes);
    if (intersect[0]) {
      const plane = new THREE2.Plane();
      const point = intersect[0].point.clone();
      const normal = intersect[0].normal;
      point.add(normal.clone().multiplyScalar(1e-3));
      plane.setFromNormalAndCoplanarPoint(normal.negate(), point);
      this.createPlaneHelper(plane, point, normal);
      this.planes.push(plane);
      if (this.edgesActive) {
        const clippingEdges = new ClippingEdges(this, plane);
        const edges = clippingEdges.create();
        this.context.context.context.scene.threeScene.add(edges);
        clippingEdges.update();
      }
      return plane;
    }
  }
  createPlaneHelper(plane, location, normal) {
    const planeHelper = new PlaneHelper(this, plane, location, normal);
    return planeHelper;
  }
  deleteAllPlanes() {
    this.active = false;
    const models = this.context.context.models;
    for (const helper of this.heplers) {
      helper.dispose();
    }
    for (const edge of this.edges) {
      edge.dispose();
    }
    this.edges = [];
    this.heplers = [];
    this.planes = [];
    for (const model of Object.values(models)) {
      model.threeGeometry.children.forEach((ch) => {
        ch.material.clippingPlanes = this.planes;
      });
    }
    this.context.context.selector.selMaterial.clippingPlanes = this.planes;
    this.context.context.selector.preSelMaterial.clippingPlanes = this.planes;
    this.active = false;
    this.context.context.context.renderer.threeRenderer.localClippingEnabled = false;
  }
  toggle() {
    this.context.context.models;
    this.context.context.context.renderer.threeRenderer.localClippingEnabled = !this.active;
    this.active = !this.active;
    if (this.helpersActive) {
      for (const helper of this.heplers) {
        helper.toggle();
      }
    }
    if (this.edgesActive) {
      for (const edges of this.edges) {
        edges.toggle();
      }
    }
  }
  updateEdges() {
    this.edges.forEach((edge) => {
      edge.update();
    });
  }
  get helpersActive() {
    return this._helpersActive;
  }
  set helpersActive(helpersActive) {
    if (this._helpersActive !== helpersActive) {
      this._helpersActive = helpersActive;
      if (!this.active) return;
      for (const helper of this.heplers) {
        helper.toggle();
      }
    }
  }
  get edgesActive() {
    return this._edgesActive;
  }
  set edgesActive(edgesActive) {
    if (this._edgesActive !== edgesActive) {
      this._edgesActive = edgesActive;
      if (!this.active) return;
      if (this.edges.length !== this.planes.length) {
        this.edges = [];
        for (const plane of this.planes) {
          const clippingEdges = new ClippingEdges(this, plane);
          const edges = clippingEdges.create();
          this.context.context.context.scene.threeScene.add(edges);
          clippingEdges.update();
        }
      }
      for (const edge of this.edges) {
        edge.toggle();
      }
    }
  }
};
var ViewCubeContainer = class {
  constructor(context) {
    this.context = context;
    this._active = true;
    this.boundingSphere = null;
    this.htmlCube = null;
    if (this._active) {
      this.create();
    }
  }
  get active() {
    return this._active;
  }
  set active(bool) {
    if (!bool) {
      if (this.cubeContainer) {
        this.cubeContainer.remove();
      }
    } else {
      if (!this.cubeContainer) {
        this.create();
      }
    }
    this._active = bool;
  }
  epsilon(value) {
    return Math.abs(value) < 1e-10 ? 0 : value;
  }
  getCameraCSSMatrix(matrix) {
    const { elements } = matrix;
    return `matrix3d(
  ${this.epsilon(elements[0])},
  ${this.epsilon(-elements[1])},
  ${this.epsilon(elements[2])},
  ${this.epsilon(elements[3])},
  ${this.epsilon(elements[4])},
  ${this.epsilon(-elements[5])},
  ${this.epsilon(elements[6])},
  ${this.epsilon(elements[7])},
  ${this.epsilon(elements[8])},
  ${this.epsilon(-elements[9])},
  ${this.epsilon(elements[10])},
  ${this.epsilon(elements[11])},
  ${this.epsilon(elements[12])},
  ${this.epsilon(-elements[13])},
  ${this.epsilon(elements[14])},
  ${this.epsilon(elements[15])})`;
  }
  animate() {
    if (!this.htmlCube) {
      return;
    }
    const camera = this.context.context.context.camera.threeCamera;
    const mat = new THREE2.Matrix4();
    const hasModel = Object.keys(
      this.context.context.context.context.context.context.models
    ).length > 0;
    if (this.htmlCube && camera && hasModel) {
      if (this.cubeContainer?.style.getPropertyValue("display") === "none") {
        this.cubeContainer?.style.setProperty("display", "block");
      }
      mat.extractRotation(camera.matrixWorldInverse);
      this.htmlCube.style.transform = `translateZ(-500px) ${this.getCameraCSSMatrix(
        mat
      )}`;
    } else {
      this.cubeContainer?.style.setProperty("display", "none");
    }
    requestAnimationFrame(this.animate.bind(this));
  }
  switchPick(name) {
    const two = 3;
    const zero = 0;
    var r = 40;
    var c = new THREE2.Vector3(zero, zero, zero);
    if (this.boundingSphere) {
      r = this.boundingSphere.radius * two - 40;
      c = this.boundingSphere.center;
    }
    const coords = new THREE2.Vector3(zero, zero, zero);
    switch (name) {
      case "left":
        coords.x = -r + c.x;
        coords.y = c.y;
        coords.z = c.z;
        break;
      case "right":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = c.z;
        break;
      case "top":
        coords.x = c.x;
        coords.y = r + c.y;
        coords.z = c.z;
        break;
      case "bottom":
        coords.x = c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "front":
        coords.x = c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "back":
        coords.x = c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "left_front":
        coords.x = -r + c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "left_back":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "right_front":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "right_back":
        coords.x = -r + c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "top_left":
        coords.x = -r + c.x;
        coords.y = r + c.y;
        coords.z = c.z;
        break;
      case "top_right":
        coords.x = r + c.x;
        coords.y = r + c.y;
        coords.z = c.z;
        break;
      case "top_front":
        coords.x = c.x;
        coords.y = r + c.y;
        coords.z = r + c.z;
        break;
      case "top_back":
        coords.x = c.x;
        coords.y = r + c.y;
        coords.z = -r + c.z;
        break;
      case "bottom_left":
        coords.x = -r + c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "bottom_right":
        coords.x = r + c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "bottom_front":
        coords.x = c.x;
        coords.y = -r + c.y;
        coords.z = r + c.z;
        break;
      case "bottom_back":
        coords.x = c.x;
        coords.y = -r + c.y;
        coords.z = -r + c.z;
        break;
      case "front_left":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "right_left":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "left_right":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "back_left":
        coords.x = -r + c.x;
        coords.y = c.y;
        coords.z = r + c.z;
        break;
      case "front_right":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "back_right":
        coords.x = r + c.x;
        coords.y = c.y;
        coords.z = -r + c.z;
        break;
      case "left_top":
        coords.x = c.x;
        coords.y = r + c.y;
        coords.z = r + c.z;
        break;
      case "right_top":
        coords.x = c.x;
        coords.y = r + c.y;
        coords.z = -r + c.z;
        break;
      case "front_top":
        coords.x = r + c.x;
        coords.y = r + c.y;
        coords.z = c.z;
        break;
      case "back_top":
        coords.x = -r + c.x;
        coords.y = r + c.y;
        coords.z = c.z;
        break;
      case "left_bottom":
        coords.x = c.x;
        coords.y = -r + c.y;
        coords.z = r + c.z;
        break;
      case "right_bottom":
        coords.x = r + c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "front_bottom":
        coords.x = r + c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "back_bottom":
        coords.x = -r + c.x;
        coords.y = -r + c.y;
        coords.z = c.z;
        break;
      case "top_left_front":
        coords.x = -r + c.x;
        coords.y = r + c.y;
        coords.z = r + c.z;
        break;
      case "top_left_back":
        coords.x = r + c.x;
        coords.y = r + c.y;
        coords.z = -r + c.z;
        break;
      case "top_right_front":
        coords.x = r + c.x;
        coords.y = r + c.y;
        coords.z = r + c.z;
        break;
      case "top_right_back":
        coords.x = -r + c.x;
        coords.y = r + c.y;
        coords.z = -r + c.z;
        break;
      case "bottom_left_front":
        coords.x = -r + c.x;
        coords.y = -r + c.y;
        coords.z = r + c.z;
        break;
      case "bottom_left_back":
        coords.x = -r + c.x;
        coords.y = -r + c.y;
        coords.z = -r + c.z;
        break;
      case "bottom_right_front":
        coords.x = r + c.x;
        coords.y = -r + c.y;
        coords.z = r + c.z;
        break;
      case "bottom_right_back":
        coords.x = r + c.x;
        coords.y = -r + c.y;
        coords.z = -r + c.z;
        break;
    }
    const controls = this.context.context.context.controls.cameraControl;
    controls.setPosition(coords.x, coords.y, coords.z, true);
    controls.setLookAt(coords.x, coords.y, coords.z, c.x, c.y, c.z, true);
  }
  hoverFunc(e2) {
    for (let el of e2.target.children) {
      el.style.background = "#7d7d7d";
      el.style.color = "#fff";
    }
  }
  unHoverFunc(e2) {
    for (let el of e2.target.children) {
      el.style.background = "#ddd";
      el.style.color = "#7d7d7d";
    }
  }
  updateBoundingSphere() {
    this.boundingSphere = new THREE2.Sphere().setFromPoints([
      this.context.context.context.sizes.modelSize.max,
      this.context.context.context.sizes.modelSize.min
    ]);
  }
  create(parent) {
    if (!parent) {
      parent = document.body;
    }
    const wrapDiv = document.createElement("div");
    this.cubeContainer = wrapDiv;
    wrapDiv.id = "cube__wrap";
    wrapDiv.classList.add("cube__wrap");
    parent.appendChild(wrapDiv);
    const cube = document.createElement("div");
    cube.id = "cube";
    cube.classList.add("cube");
    wrapDiv.appendChild(cube);
    const cfb = document.createElement("div");
    cfb.classList.add("cube__face");
    cfb.classList.add("cube__face--bottom");
    cfb.addEventListener("click", () => this.switchPick("bottom"));
    cfb.innerHTML = "bot";
    cube.appendChild(cfb);
    const cft = document.createElement("div");
    cft.classList.add("cube__face");
    cft.classList.add("cube__face--top");
    cft.addEventListener("click", () => this.switchPick("top"));
    cft.innerHTML = "top";
    cube.appendChild(cft);
    const cfr = document.createElement("div");
    cfr.classList.add("cube__face");
    cfr.classList.add("cube__face--right");
    cfr.addEventListener("click", () => this.switchPick("right"));
    cfr.innerHTML = "right";
    cube.appendChild(cfr);
    const cfl = document.createElement("div");
    cfl.classList.add("cube__face");
    cfl.classList.add("cube__face--left");
    cfl.addEventListener("click", () => this.switchPick("left"));
    cfl.innerHTML = "left";
    cube.appendChild(cfl);
    const cff = document.createElement("div");
    cff.classList.add("cube__face");
    cff.classList.add("cube__face--front");
    cff.addEventListener("click", () => this.switchPick("front"));
    cff.innerHTML = "front";
    cube.appendChild(cff);
    const cfbk = document.createElement("div");
    cfbk.classList.add("cube__face");
    cfbk.classList.add("cube__face--back");
    cfbk.addEventListener("click", () => this.switchPick("back"));
    cfbk.innerHTML = "back";
    cube.appendChild(cfbk);
    const tl = document.createElement("div");
    tl.classList.add("cube__face__face__edge__wrap");
    tl.addEventListener("click", () => this.switchPick("top_left"));
    tl.addEventListener("mouseenter", this.hoverFunc);
    tl.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tl);
    const tlc1 = document.createElement("div");
    tlc1.classList.add("cube__face__face__edge");
    tlc1.classList.add("cube__face--top--left");
    tl.appendChild(tlc1);
    const tlc2 = document.createElement("div");
    tlc2.classList.add("cube__face__face__edge");
    tlc2.classList.add("cube__face--left--top");
    tl.appendChild(tlc2);
    const tr = document.createElement("div");
    tr.classList.add("cube__face__face__edge__wrap");
    tr.addEventListener("click", () => this.switchPick("top_right"));
    tr.addEventListener("mouseenter", this.hoverFunc);
    tr.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tr);
    const trc1 = document.createElement("div");
    trc1.classList.add("cube__face__face__edge");
    trc1.classList.add("cube__face--top--right");
    tr.appendChild(trc1);
    const trc2 = document.createElement("div");
    trc2.classList.add("cube__face__face__edge");
    trc2.classList.add("cube__face--right--top");
    tr.appendChild(trc2);
    const bl = document.createElement("div");
    bl.classList.add("cube__face__face__edge__wrap");
    bl.addEventListener("click", () => this.switchPick("bottom_left"));
    bl.addEventListener("mouseenter", this.hoverFunc);
    bl.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(bl);
    const blc1 = document.createElement("div");
    blc1.classList.add("cube__face__face__edge");
    blc1.classList.add("cube__face--bottom--left");
    bl.appendChild(blc1);
    const blc2 = document.createElement("div");
    blc2.classList.add("cube__face__face__edge");
    blc2.classList.add("cube__face--left--bottom");
    bl.appendChild(blc2);
    const br = document.createElement("div");
    br.classList.add("cube__face__face__edge__wrap");
    br.addEventListener("click", () => this.switchPick("bottom_right"));
    br.addEventListener("mouseenter", this.hoverFunc);
    br.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(br);
    const brc1 = document.createElement("div");
    brc1.classList.add("cube__face__face__edge");
    brc1.classList.add("cube__face--bottom--right");
    br.appendChild(brc1);
    const brc2 = document.createElement("div");
    brc2.classList.add("cube__face__face__edge");
    brc2.classList.add("cube__face--right--bottom");
    br.appendChild(brc2);
    const bf = document.createElement("div");
    bf.classList.add("cube__face__face__edge__wrap");
    bf.addEventListener("click", () => this.switchPick("bottom_front"));
    bf.addEventListener("mouseenter", this.hoverFunc);
    bf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(bf);
    const bfc1 = document.createElement("div");
    bfc1.classList.add("cube__face__face__edge");
    bfc1.classList.add("cube__face--front--bottom");
    bf.appendChild(bfc1);
    const bfc2 = document.createElement("div");
    bfc2.classList.add("cube__face__face__edge");
    bfc2.classList.add("cube__face--bottom--front");
    bf.appendChild(bfc2);
    const bb = document.createElement("div");
    bb.classList.add("cube__face__face__edge__wrap");
    bb.addEventListener("click", () => this.switchPick("bottom_back"));
    bb.addEventListener("mouseenter", this.hoverFunc);
    bb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(bb);
    const bbc1 = document.createElement("div");
    bbc1.classList.add("cube__face__face__edge");
    bbc1.classList.add("cube__face--back--bottom");
    bb.appendChild(bbc1);
    const bbc2 = document.createElement("div");
    bbc2.classList.add("cube__face__face__edge");
    bbc2.classList.add("cube__face--bottom--back");
    bb.appendChild(bbc2);
    const tf = document.createElement("div");
    tf.classList.add("cube__face__face__edge__wrap");
    tf.addEventListener("click", () => this.switchPick("top_front"));
    tf.addEventListener("mouseenter", this.hoverFunc);
    tf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tf);
    const tfc1 = document.createElement("div");
    tfc1.classList.add("cube__face__face__edge");
    tfc1.classList.add("cube__face--front--top");
    tf.appendChild(tfc1);
    const tfc2 = document.createElement("div");
    tfc2.classList.add("cube__face__face__edge");
    tfc2.classList.add("cube__face--top--front");
    tf.appendChild(tfc2);
    const tb = document.createElement("div");
    tb.classList.add("cube__face__face__edge__wrap");
    tb.addEventListener("click", () => this.switchPick("top_back"));
    tb.addEventListener("mouseenter", this.hoverFunc);
    tb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tb);
    const tbc1 = document.createElement("div");
    tbc1.classList.add("cube__face__face__edge");
    tbc1.classList.add("cube__face--back--top");
    tb.appendChild(tbc1);
    const tbc2 = document.createElement("div");
    tbc2.classList.add("cube__face__face__edge");
    tbc2.classList.add("cube__face--top--back");
    tb.appendChild(tbc2);
    const lb = document.createElement("div");
    lb.classList.add("cube__face__face__edge__wrap");
    lb.addEventListener("click", () => this.switchPick("left_back"));
    lb.addEventListener("mouseenter", this.hoverFunc);
    lb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(lb);
    const lbc1 = document.createElement("div");
    lbc1.classList.add("cube__face__face__edge");
    lbc1.classList.add("cube__face--back--left");
    lb.appendChild(lbc1);
    const lbc2 = document.createElement("div");
    lbc2.classList.add("cube__face__face__edge");
    lbc2.classList.add("cube__face--left--back");
    lb.appendChild(lbc2);
    const rb = document.createElement("div");
    rb.classList.add("cube__face__face__edge__wrap");
    rb.addEventListener("click", () => this.switchPick("right_back"));
    rb.addEventListener("mouseenter", this.hoverFunc);
    rb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(rb);
    const rbc1 = document.createElement("div");
    rbc1.classList.add("cube__face__face__edge");
    rbc1.classList.add("cube__face--back--right");
    rb.appendChild(rbc1);
    const rbc2 = document.createElement("div");
    rbc2.classList.add("cube__face__face__edge");
    rbc2.classList.add("cube__face--right--back");
    rb.appendChild(rbc2);
    const rf = document.createElement("div");
    rf.classList.add("cube__face__face__edge__wrap");
    rf.addEventListener("click", () => this.switchPick("right_front"));
    rf.addEventListener("mouseenter", this.hoverFunc);
    rf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(rf);
    const rfc1 = document.createElement("div");
    rfc1.classList.add("cube__face__face__edge");
    rfc1.classList.add("cube__face--front--right");
    rf.appendChild(rfc1);
    const rfc2 = document.createElement("div");
    rfc2.classList.add("cube__face__face__edge");
    rfc2.classList.add("cube__face--right--front");
    rf.appendChild(rfc2);
    const lf = document.createElement("div");
    lf.classList.add("cube__face__face__edge__wrap");
    lf.addEventListener("click", () => this.switchPick("left_front"));
    lf.addEventListener("mouseenter", this.hoverFunc);
    lf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(lf);
    const lfc1 = document.createElement("div");
    lfc1.classList.add("cube__face__face__edge");
    lfc1.classList.add("cube__face--front--left");
    lf.appendChild(lfc1);
    const lfc2 = document.createElement("div");
    lfc2.classList.add("cube__face__face__edge");
    lfc2.classList.add("cube__face--left--front");
    lf.appendChild(lfc2);
    const tlf = document.createElement("div");
    tlf.classList.add("cube__face__face__edge__wrap");
    tlf.addEventListener("click", () => this.switchPick("top_left_front"));
    tlf.addEventListener("mouseenter", this.hoverFunc);
    tlf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tlf);
    const tlfc1 = document.createElement("div");
    tlfc1.classList.add("cube__face__face__edge");
    tlfc1.classList.add("cube__edge--left--front--top");
    tlf.appendChild(tlfc1);
    const tlfc2 = document.createElement("div");
    tlfc2.classList.add("cube__face__face__edge");
    tlfc2.classList.add("cube__edge--front--left--top");
    tlf.appendChild(tlfc2);
    const tlfc3 = document.createElement("div");
    tlfc3.classList.add("cube__face__face__edge");
    tlfc3.classList.add("cube__edge--top--left--front");
    tlf.appendChild(tlfc3);
    const trf = document.createElement("div");
    trf.classList.add("cube__face__face__edge__wrap");
    trf.addEventListener("click", () => this.switchPick("top_right_front"));
    trf.addEventListener("mouseenter", this.hoverFunc);
    trf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(trf);
    const trfc1 = document.createElement("div");
    trfc1.classList.add("cube__face__face__edge");
    trfc1.classList.add("cube__edge--right--front--top");
    trf.appendChild(trfc1);
    const trfc2 = document.createElement("div");
    trfc2.classList.add("cube__face__face__edge");
    trfc2.classList.add("cube__edge--front--right--top");
    trf.appendChild(trfc2);
    const trfc3 = document.createElement("div");
    trfc3.classList.add("cube__face__face__edge");
    trfc3.classList.add("cube__edge--top--right--front");
    trf.appendChild(trfc3);
    const tlb = document.createElement("div");
    tlb.classList.add("cube__face__face__edge__wrap");
    tlb.addEventListener("click", () => this.switchPick("top_left_back"));
    tlb.addEventListener("mouseenter", this.hoverFunc);
    tlb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(tlb);
    const tlbc1 = document.createElement("div");
    tlbc1.classList.add("cube__face__face__edge");
    tlbc1.classList.add("cube__edge--back--left--top");
    tlb.appendChild(tlbc1);
    const tlbc2 = document.createElement("div");
    tlbc2.classList.add("cube__face__face__edge");
    tlbc2.classList.add("cube__edge--left--back--top");
    tlb.appendChild(tlbc2);
    const tlbc3 = document.createElement("div");
    tlbc3.classList.add("cube__face__face__edge");
    tlbc3.classList.add("cube__edge--top--left--back");
    tlb.appendChild(tlbc3);
    const trb = document.createElement("div");
    trb.classList.add("cube__face__face__edge__wrap");
    trb.addEventListener("click", () => this.switchPick("top_right_back"));
    trb.addEventListener("mouseenter", this.hoverFunc);
    trb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(trb);
    const trbc1 = document.createElement("div");
    trbc1.classList.add("cube__face__face__edge");
    trbc1.classList.add("cube__edge--back--right--top");
    trb.appendChild(trbc1);
    const trbc2 = document.createElement("div");
    trbc2.classList.add("cube__face__face__edge");
    trbc2.classList.add("cube__edge--right--back--top");
    trb.appendChild(trbc2);
    const trbc3 = document.createElement("div");
    trbc3.classList.add("cube__face__face__edge");
    trbc3.classList.add("cube__edge--top--right--back");
    trb.appendChild(trbc3);
    const blf = document.createElement("div");
    blf.classList.add("cube__face__face__edge__wrap");
    blf.addEventListener(
      "click",
      () => this.switchPick("bottom_left_front")
    );
    blf.addEventListener("mouseenter", this.hoverFunc);
    blf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(blf);
    const blfc1 = document.createElement("div");
    blfc1.classList.add("cube__face__face__edge");
    blfc1.classList.add("cube__edge--left--front--bottom");
    blf.appendChild(blfc1);
    const blfc2 = document.createElement("div");
    blfc2.classList.add("cube__face__face__edge");
    blfc2.classList.add("cube__edge--front--left--bottom");
    blf.appendChild(blfc2);
    const blfc3 = document.createElement("div");
    blfc3.classList.add("cube__face__face__edge");
    blfc3.classList.add("cube__edge--bottom--left--front");
    blf.appendChild(blfc3);
    const brf = document.createElement("div");
    brf.classList.add("cube__face__face__edge__wrap");
    brf.addEventListener(
      "click",
      () => this.switchPick("bottom_right_front")
    );
    brf.addEventListener("mouseenter", this.hoverFunc);
    brf.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(brf);
    const brfc1 = document.createElement("div");
    brfc1.classList.add("cube__face__face__edge");
    brfc1.classList.add("cube__edge--right--front--bottom");
    brf.appendChild(brfc1);
    const brfc2 = document.createElement("div");
    brfc2.classList.add("cube__face__face__edge");
    brfc2.classList.add("cube__edge--front--right--bottom");
    brf.appendChild(brfc2);
    const brfc3 = document.createElement("div");
    brfc3.classList.add("cube__face__face__edge");
    brfc3.classList.add("cube__edge--bottom--right--front");
    brf.appendChild(brfc3);
    const brb = document.createElement("div");
    brb.classList.add("cube__face__face__edge__wrap");
    brb.addEventListener(
      "click",
      () => this.switchPick("bottom_right_back")
    );
    brb.addEventListener("mouseenter", this.hoverFunc);
    brb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(brb);
    const brbc1 = document.createElement("div");
    brbc1.classList.add("cube__face__face__edge");
    brbc1.classList.add("cube__edge--back--left--bottom");
    brb.appendChild(brbc1);
    const brbc2 = document.createElement("div");
    brbc2.classList.add("cube__face__face__edge");
    brbc2.classList.add("cube__edge--left--back--bottom");
    brb.appendChild(brbc2);
    const brbc3 = document.createElement("div");
    brbc3.classList.add("cube__face__face__edge");
    brbc3.classList.add("cube__edge--bottom--left--back");
    brb.appendChild(brbc3);
    const blb = document.createElement("div");
    blb.classList.add("cube__face__face__edge__wrap");
    blb.addEventListener(
      "click",
      () => this.switchPick("bottom_left_back")
    );
    blb.addEventListener("mouseenter", this.hoverFunc);
    blb.addEventListener("mouseleave", this.unHoverFunc);
    cube.appendChild(blb);
    const blbc1 = document.createElement("div");
    blbc1.classList.add("cube__face__face__edge");
    blbc1.classList.add("cube__edge--back--right--bottom");
    blb.appendChild(blbc1);
    const blbc2 = document.createElement("div");
    blbc2.classList.add("cube__face__face__edge");
    blbc2.classList.add("cube__edge--right--back--bottom");
    blb.appendChild(blbc2);
    const blbc3 = document.createElement("div");
    blbc3.classList.add("cube__face__face__edge");
    blbc3.classList.add("cube__edge--bottom--right--back");
    blb.appendChild(blbc3);
    this.htmlCube = cube;
    this.animate();
  }
};
var _DimensionLine = class _DimensionLine {
  constructor(context, start, end, lineMaterial, endpointMaterial, endpoint, className, endpointScale) {
    this.context = context;
    this.endpointMeshes = [];
    this.boundingMesh = null;
    this.start = start;
    this.end = end;
    this.lineMaterial = lineMaterial;
    this.endpointMaterial = endpointMaterial;
    this.endpoint = endpoint;
    this.className = className;
    this.root = new THREE2.Group();
    this.root.renderOrder = 3;
    this.boundingSize = 0.05;
    this.context = context;
    this.labelClassName = className;
    this.scale = endpointScale;
    this.length = this.getLength();
    this.center = this.getCenter();
    this.axis = new THREE2.BufferGeometry().setFromPoints([start, end]);
    this.line = new THREE2.Line(this.axis, this.lineMaterial);
    this.root.add(this.line);
    this.addEndpointMeshes();
    this.textLabel = this.newText();
    this.root.renderOrder = 2;
    this.context.context.context.context.scene.threeScene.add(this.root);
    this.context.context.context.context.controls.cameraControl.addEventListener(
      "control",
      this.rescaleObjectsToCameraPosition.bind(this)
    );
    this.rescaleObjectsToCameraPosition();
  }
  dispose() {
    this.removeFromScene();
    if (this.root) this.context.context.disposeMeshRecursively(this.root);
    this.root = null;
    if (this.line) this.context.context.disposeMeshRecursively(this.line);
    this.line = null;
    this.endpointMeshes.forEach(
      (mesh) => this.context.context.disposeMeshRecursively(mesh)
    );
    this.endpointMeshes.length = 0;
    this.axis?.dispose();
    this.axis = null;
    this.endpoint?.dispose();
    this.endpoint = null;
    this.textLabel?.removeFromParent();
    this.textLabel?.element.remove();
    this.textLabel = null;
    this.lineMaterial?.dispose();
    this.lineMaterial = null;
    this.endpointMaterial?.dispose();
    this.endpointMaterial = null;
    if (this.boundingMesh) {
      this.context.context.disposeMeshRecursively(this.boundingMesh);
      this.boundingMesh = null;
    }
  }
  get boundingBox() {
    return this.boundingMesh;
  }
  get text() {
    return this.textLabel;
  }
  set dimensionColor(dimensionColor) {
    if (this.endpointMaterial) this.endpointMaterial.color = dimensionColor;
    if (this.lineMaterial) this.lineMaterial.color = dimensionColor;
  }
  set visibility(visible) {
    if (this.root) this.root.visible = visible;
    if (this.textLabel) this.textLabel.visible = visible;
  }
  set endpointGeometry(geometry) {
    this.endpointMeshes.forEach((mesh) => this.root?.remove(mesh));
    this.endpointMeshes = [];
    this.endpoint = geometry;
    this.addEndpointMeshes();
  }
  set endpointScale(scale) {
    this.scale = scale;
    this.endpointMeshes.forEach(
      (mesh) => mesh.scale.set(scale.x, scale.y, scale.z)
    );
  }
  set endPoint(point) {
    this.end = point;
    if (!this.axis) return;
    const position = this.axis.attributes.position;
    if (!position) return;
    position.setXYZ(1, point.x, point.y, point.z);
    position.needsUpdate = true;
    this.endpointMeshes[1].position.set(point.x, point.y, point.z);
    this.endpointMeshes[1].lookAt(this.start);
    this.endpointMeshes[0].lookAt(this.end);
    this.length = this.getLength();
    this.center = this.getCenter();
    if (this.textLabel) {
      this.textLabel.element.textContent = this.getTextContent();
      this.textLabel.position.set(
        this.center.x,
        this.center.y,
        this.center.z
      );
    }
    if (this.line) this.line.computeLineDistances();
  }
  removeFromScene() {
    if (this.root) {
      this.context.context.context.context.scene.threeScene.remove(
        this.root
      );
      if (this.textLabel) this.root.remove(this.textLabel);
    }
  }
  createBoundingBox() {
    this.boundingMesh = this.newBoundingBox();
    this.setupBoundingBox(this.end);
  }
  rescaleObjectsToCameraPosition() {
    this.endpointMeshes.forEach(
      (mesh) => this.rescaleMesh(mesh, _DimensionLine.scaleFactor)
    );
    if (this.boundingMesh) {
      this.rescaleMesh(
        this.boundingMesh,
        this.boundingSize,
        true,
        true,
        false
      );
    }
  }
  rescaleMesh(mesh, scalefactor = 1, x = true, y = true, z = true) {
    const camera = this.context.context.context.context.camera.threeCamera;
    let scale = new THREE2.Vector3().subVectors(mesh.position, camera.position).length();
    if (camera instanceof THREE2.OrthographicCamera) {
      scale *= 0.1;
    }
    scale *= scalefactor;
    const scaleX = x ? scale : 1;
    const scaleY = y ? scale : 1;
    const scaleZ = z ? scale : 1;
    mesh.scale.set(scaleX, scaleY, scaleZ);
  }
  addEndpointMeshes() {
    this.newEndpointMesh(this.start, this.end);
    this.newEndpointMesh(this.end, this.start);
  }
  newEndpointMesh(position, direction) {
    if (this.endpoint && this.endpointMaterial && this.root) {
      const mesh = new THREE2.Mesh(this.endpoint, this.endpointMaterial);
      mesh.position.set(position.x, position.y, position.z);
      mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
      mesh.lookAt(direction);
      this.endpointMeshes.push(mesh);
      this.root.add(mesh);
    }
  }
  newText() {
    const htmlText = document.createElement("div");
    htmlText.className = this.labelClassName;
    htmlText.textContent = this.getTextContent();
    const label = new CSS2DRenderer.CSS2DObject(htmlText);
    label.position.set(this.center.x, this.center.y, this.center.z);
    this.root?.add(label);
    return label;
  }
  getTextContent() {
    return `${this.length * _DimensionLine.scale} ${_DimensionLine.units}`;
  }
  newBoundingBox() {
    const box = new THREE2.BoxGeometry(1, 1, this.length);
    return new THREE2.Mesh(box);
  }
  setupBoundingBox(end) {
    if (!this.boundingMesh) return;
    this.boundingMesh.position.set(
      this.center.x,
      this.center.y,
      this.center.z
    );
    this.boundingMesh.lookAt(end);
    this.boundingMesh.visible = false;
    this.root?.add(this.boundingMesh);
  }
  getLength() {
    return parseFloat(this.start.distanceTo(this.end).toFixed(2));
  }
  getCenter() {
    let dir = this.end.clone().sub(this.start);
    const len = dir.length() * 0.5;
    dir = dir.normalize().multiplyScalar(len);
    return this.start.clone().add(dir);
  }
};
_DimensionLine.scaleFactor = 0.1;
_DimensionLine.scale = 1;
_DimensionLine.units = "m";
var DimensionLine = _DimensionLine;
var DimensionsUtils = class _DimensionsUtils {
  constructor(context) {
    this.context = context;
    this.currentDimension = null;
    this.curAxis = null;
    this.measureInPros = false;
    this.measureStart = false;
    this.dimensions = [];
    this.labelClassName = "dimension-label";
    this.previewClassName = "dimension-preview";
    this.enabled = false;
    this.preview = false;
    this.dragging = false;
    this.snapDistance = 0.25;
    this.baseScale = new THREE2.Vector3(1, 1, 1);
    this.lineMaterial = new THREE2.LineDashedMaterial({
      color: 0,
      linewidth: 2,
      depthTest: false,
      dashSize: 0.2,
      gapSize: 0.2
    });
    this.endpointsMaterial = new THREE2.MeshBasicMaterial({
      color: 0,
      depthTest: false
    });
    this.startPoint = new THREE2.Vector3();
    this.endPoint = new THREE2.Vector3();
    this.endpoint = _DimensionsUtils.getDefaultEndpointGeometry();
    const htmlPreview = document.createElement("div");
    htmlPreview.className = this.previewClassName;
    this.previewElement = new CSS2DRenderer.CSS2DObject(htmlPreview);
    this.previewElement.visible = true;
    const pivotElement = document.createElement("div");
    pivotElement.className = "camera-pivot-marker";
    this.measureObject = new CSS2DRenderer.CSS2DObject(pivotElement);
    this.measureObject.visible = false;
    this.context.context.context.scene.threeScene.add(this.measureObject);
    this._selectionState = {
      selection: context.context.selector.useSelection,
      preselection: context.context.selector.usePreSelection
    };
    this.drawInProcessEvent_binded = this.drawInProcessEvent.bind(this);
    this.dimensionsClickEventHandle_binded = this.dimentionsClickEventHandle.bind(this);
  }
  dispose() {
    this.dimensions.forEach((dim) => dim.dispose());
    this.dimensions = [];
    this.currentDimension = null;
    this.endpoint?.dispose();
    this.endpoint = null;
    this.previewElement?.removeFromParent();
    this.previewElement?.element.remove();
    this.previewElement = null;
  }
  update() {
    if (this.enabled && this.preview && this.previewElement) {
      const models = this.context.context.models;
      const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
      const intersects = this.context.context.context.controls.getIntersects(meshes)[0];
      this.previewElement.visible = !!intersects;
      if (!intersects) return;
      this.previewElement.visible = true;
      const closest = this.getClosestVertex(intersects);
      this.previewElement.visible = !!closest;
      if (!closest) return;
      this.previewElement.position.set(closest.x, closest.y, closest.z);
      if (this.dragging) {
        this.drawInProcess();
      }
    }
  }
  setPreviewElement(element) {
    this.previewElement = new CSS2DRenderer.CSS2DObject(element);
  }
  get active() {
    return this.enabled;
  }
  get previewActive() {
    return this.preview;
  }
  get previewObject() {
    return this.previewElement;
  }
  set previewActive(state) {
    this.preview = state;
    if (this.previewElement) {
      const scene = this.context.context.context.scene.threeScene;
      if (this.preview) {
        scene.add(this.previewElement);
      } else {
        scene.remove(this.previewElement);
      }
    }
  }
  set active(state) {
    this.enabled = state;
    this.dimensions.forEach((dim) => {
      dim.visibility = state;
    });
  }
  set dimensionsColor(color) {
    this.endpointsMaterial.color = color;
    this.lineMaterial.color = color;
  }
  set dimensionsWidth(width) {
    this.lineMaterial.linewidth = width;
  }
  set endpointGeometry(geometry) {
    this.dimensions.forEach((dim) => {
      dim.endpointGeometry = geometry;
    });
  }
  set endpointScaleFactor(factor) {
    DimensionLine.scaleFactor = factor;
  }
  set endpointScale(scale) {
    this.baseScale = scale;
    this.dimensions.forEach((dim) => {
      dim.endpointScale = scale;
    });
  }
  create() {
    if (!this.enabled) return;
    if (!this.dragging) {
      this.drawStart();
      return;
    }
    this.drawEnd();
  }
  createInPlane(plane) {
    if (!this.enabled) return;
    if (!this.dragging) {
      this.drawStartInPlane(plane);
      return;
    }
    this.drawEnd();
  }
  delete() {
    if (!this.enabled || this.dimensions.length === 0) return;
    const boundingBoxes = this.getBoundingBoxes();
    const intersects = (
      //@ts-ignore
      this.context.context.context.controls.getIntersects(boundingBoxes)
    );
    if (intersects.length === 0) return;
    const selected = this.dimensions.find(
      (dim) => dim.boundingBox === intersects[0].object
    );
    if (!selected) return;
    const index = this.dimensions.indexOf(selected);
    this.dimensions.splice(index, 1);
    selected.removeFromScene();
  }
  deleteAll() {
    this.dimensions.forEach((dim) => {
      dim.removeFromScene();
    });
    this.dimensions = [];
  }
  cancelDrawing() {
    var _a;
    if (!this.currentDimension) return;
    (_a = this.currentDimension) === null || _a === void 0 ? void 0 : _a.removeFromScene();
    this.currentDimension = null;
    this.measureInPros = false;
  }
  setDimensionUnit(units) {
    if (!units) return;
    if (units === "mm") {
      DimensionLine.units = units;
      DimensionLine.scale = 1e3;
    } else if (units === "m") {
      DimensionLine.units = units;
      DimensionLine.scale = 1;
    }
  }
  drawStart() {
    this.dragging = true;
    const models = this.context.context.models;
    const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
    const intersects = this.context.context.context.controls.getIntersects(meshes);
    if (!intersects) return;
    const found = this.getClosestVertex(intersects[0]);
    if (!found) return;
    this.startPoint = found;
  }
  drawStartInPlane(plane) {
    this.dragging = true;
    const intersects = this.context.context.context.controls.getIntersects([
      //@ts-ignore
      plane
    ]);
    if (!intersects || intersects.length < 1) return;
    this.startPoint = intersects[0].point;
  }
  drawInProcess() {
    const models = this.context.context.models;
    const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
    const intersects = this.context.context.context.controls.getIntersects(meshes)[0];
    if (!intersects) return;
    const found = this.getClosestVertex(intersects);
    if (!found) return;
    this.endPoint = found;
    if (!this.currentDimension)
      this.currentDimension = this.drawDimension();
    this.currentDimension.endPoint = this.endPoint;
  }
  drawEnd() {
    if (!this.currentDimension) return;
    this.currentDimension.createBoundingBox();
    this.dimensions.push(this.currentDimension);
    this.currentDimension = null;
    this.dragging = false;
  }
  get getDimensionsLines() {
    return this.dimensions;
  }
  drawDimension() {
    return new DimensionLine(
      this,
      this.startPoint,
      this.endPoint,
      this.lineMaterial,
      this.endpointsMaterial,
      this.endpoint,
      this.labelClassName,
      this.baseScale
    );
  }
  getBoundingBoxes() {
    return this.dimensions.map((dim) => dim.boundingBox).filter((box) => box !== void 0 && box !== null);
  }
  static getDefaultEndpointGeometry(height = 0.1, radius = 0.03) {
    const coneGeometry = new THREE2.ConeGeometry(radius, height);
    coneGeometry.translate(0, -height / 2, 0);
    coneGeometry.rotateX(-Math.PI / 2);
    return coneGeometry;
  }
  getClosestVertex(intersects) {
    let closestVertex = new THREE2.Vector3();
    let vertexFound = false;
    let closestDistance = Number.MAX_SAFE_INTEGER;
    const vertices = this.getVertices(intersects);
    vertices === null || vertices === void 0 ? void 0 : vertices.forEach((vertex) => {
      if (!vertex) return;
      const distance = intersects.point.distanceTo(vertex);
      if (distance > closestDistance || distance > this.snapDistance)
        return;
      vertexFound = true;
      closestVertex = vertex;
      closestDistance = intersects.point.distanceTo(vertex);
    });
    return vertexFound ? closestVertex : intersects.point;
  }
  getVertices(intersects) {
    const mesh = intersects.object;
    if (!intersects.face || !mesh) return null;
    const geom = mesh.geometry;
    return [
      this.getVertex(intersects.face.a, geom),
      this.getVertex(intersects.face.b, geom),
      this.getVertex(intersects.face.c, geom)
    ];
  }
  getVertex(index, geom) {
    if (index === void 0) return null;
    const vertices = geom.attributes.position;
    return new THREE2.Vector3(
      vertices.getX(index),
      vertices.getY(index),
      vertices.getZ(index)
    );
  }
  changeAxes() {
    if (this.measureInPros && this.found) {
      const curFound = new THREE2.Vector3();
      switch (this.curAxis) {
        case "x":
          curFound.x = this.startPoint.x;
          curFound.y = this.found.y;
          curFound.z = this.startPoint.z;
          this.curAxis = "y";
          break;
        case "y":
          curFound.x = this.startPoint.x;
          curFound.y = this.startPoint.y;
          curFound.z = this.found.z;
          this.curAxis = "z";
          break;
        default:
          curFound.x = this.found.x;
          curFound.y = this.startPoint.y;
          curFound.z = this.startPoint.z;
          this.curAxis = "x";
          break;
      }
      this.endPoint = curFound;
      if (!this.currentDimension)
        this.currentDimension = this.drawDimension();
      this.currentDimension.endPoint = this.endPoint;
    }
  }
  drawInProcessEvent(e2) {
    const models = this.context.context.models;
    const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
    const intersects = this.context.context.context.controls.getIntersects(meshes);
    if (!intersects.length) return;
    this.found = this.getClosestVertex(intersects[0]);
    if (!this.found) {
      this.setDimentionVisibility(false);
      return;
    }
    this.measureObject.visible = true;
    const curFound = new THREE2.Vector3();
    if (e2.shiftKey) {
      const xDist = Math.sqrt(
        Math.pow(this.found.y - this.startPoint.y, 2) + Math.pow(this.found.z - this.startPoint.z, 2)
      );
      const yDist = Math.sqrt(
        Math.pow(this.found.x - this.startPoint.x, 2) + Math.pow(this.found.z - this.startPoint.z, 2)
      );
      const zDist = Math.sqrt(
        Math.pow(this.found.y - this.startPoint.y, 2) + Math.pow(this.found.x - this.startPoint.x, 2)
      );
      const minDist = Math.min(xDist, yDist, zDist);
      switch (minDist) {
        case xDist:
          curFound.x = this.found.x;
          curFound.y = this.startPoint.y;
          curFound.z = this.startPoint.z;
          this.curAxis = "x";
          break;
        case yDist:
          curFound.x = this.startPoint.x;
          curFound.y = this.found.y;
          curFound.z = this.startPoint.z;
          this.curAxis = "y";
          break;
        case zDist:
          curFound.x = this.startPoint.x;
          curFound.y = this.startPoint.y;
          curFound.z = this.found.z;
          this.curAxis = "z";
          break;
        default:
          curFound.x = this.found.x;
          curFound.y = this.found.y;
          curFound.z = this.found.z;
          this.curAxis = null;
          break;
      }
    } else {
      curFound.x = this.found.x;
      curFound.y = this.found.y;
      curFound.z = this.found.z;
      this.curAxis = null;
    }
    if (this.measureInPros) {
      this.measureObject.position.set(curFound.x, curFound.y, curFound.z);
      this.endPoint = curFound;
      if (!this.currentDimension)
        this.currentDimension = this.drawDimension();
      this.currentDimension.endPoint = this.endPoint;
      this.setDimentionVisibility(true);
    } else {
      this.measureObject.position.set(
        this.found.x,
        this.found.y,
        this.found.z
      );
    }
  }
  setDimentionVisibility(bool) {
    if (this.currentDimension && this.currentDimension.line) {
      this.currentDimension.line.visible = bool;
      this.currentDimension.endpointMeshes.map((p) => p.visible = bool);
      if (this.currentDimension.textLabel) {
        this.currentDimension.textLabel.visible = bool;
      }
    }
    this.measureObject.visible = bool;
  }
  dimentionsClickEventHandle() {
    if (this.measureStart && !this.context.context.context.controls.moving) {
      const models = this.context.context.models;
      const meshes = Object.values(models).map((m) => m.threeGeometry.children).flat();
      const intersects = this.context.context.context.controls.getIntersects(meshes);
      if (!this.measureInPros) {
        if (intersects[0]) {
          this.drawStart();
          this.measureInPros = true;
        }
      } else {
        this.drawEnd();
        this.measureInPros = false;
      }
    }
  }
  toggleDimentionsActive() {
    this.snapDistance = 1;
    if (!this.measureStart) {
      this.measureStart = true;
      this.active = true;
      this._selectionState = {
        selection: this.context.context.selector.useSelection,
        preselection: this.context.context.selector.usePreSelection
      };
      if (this._selectionState.preselection) {
        this.context.context.selector.usePreSelection = false;
      }
      if (this._selectionState.selection) {
        this.context.context.selector.useSelection = false;
      }
      this.context.context.container.addEventListener(
        "mousemove",
        this.drawInProcessEvent_binded
      );
      this.context.context.container.addEventListener(
        "click",
        this.dimensionsClickEventHandle_binded
      );
    } else {
      this.measureStart = false;
      this.measureInPros = false;
      this.active = false;
      this.context.context.container.removeEventListener(
        "click",
        this.dimensionsClickEventHandle_binded
      );
      this.context.context.container.removeEventListener(
        "mousemove",
        this.drawInProcessEvent_binded
      );
      if (this._selectionState.preselection) {
        this.context.context.selector.usePreSelection = true;
      }
      if (this._selectionState.selection) {
        this.context.context.selector.useSelection = true;
      }
      if (this.currentDimension) {
        this.currentDimension.removeFromScene();
        this.currentDimension = null;
        this.dragging = false;
      }
      this.measureObject.visible = false;
    }
  }
};

// src/Viewer/Utils/OsUtils.ts
var OsUtils = class {
  constructor(context) {
    this.context = context;
    this.OS = this.getOS();
  }
  getOS() {
    let os = "unknown";
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];
    const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
    const iosPlatforms = ["iPhone", "iPad", "iPod"];
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = "Mac";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      this.setMobileSettings();
      os = "IOS";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = "Windows";
    } else if (/Android/.test(userAgent)) {
      this.setMobileSettings();
      os = "Android";
    } else if (os === "unknown" && /Linux/.test(platform)) {
      os = "Linux";
    }
    return os;
  }
  setMobileSettings() {
    this.context.context.selector.usePreSelection = false;
    this.context.context.context.controls.cameraControl.truckSpeed = 1.6;
    this.context.context.context.controls.cameraControl.dollySpeed = 1;
    this.context.context.context.controls.cameraControl.azimuthRotateSpeed = 1;
    this.context.context.context.renderer.removeCallback(
      this.context.context.selector.selectionBox.renderSelectionBind
    );
  }
};

// src/Viewer/Utils/KeysUtils/KeysUtils.ts
var KeysUtils = class {
  constructor(context) {
    this.context = context;
  }
  isRemoveSelectionKey(e2) {
    return e2.ctrlKey || this.context.osUtils.OS === "Mac" && e2.altKey;
  }
  isMultySelect(e2) {
    return e2.shiftKey;
  }
  isBoxSelect(e2) {
    return e2.shiftKey;
  }
};
var Utils = class {
  constructor(context) {
    this.context = context;
    this.propsUtils = new PropsUtils(this);
    this.geometryUtils = new GeometryUtils(this);
    this.clippingUtils = new ClippingUtils(this);
    this.dimentionsUtils = new DimensionsUtils(this);
    this.navigationCubeUtil = new ViewCubeContainer(this);
    this.osUtils = new OsUtils(this);
    this.keysUtils = new KeysUtils(this);
    this.decoder = decoder__namespace;
    this.gui = new GUI__default.default();
    this.gui.hide();
  }
  set useStats(useStats) {
    if (useStats) {
      this.stats = new Stats__default.default();
      this.stats.showPanel(1);
      document.body.appendChild(this.stats.dom);
    } else {
      this.stats?.dom.remove();
      this.stats = void 0;
    }
  }
  disposeMeshRecursively(mesh) {
    mesh.removeFromParent();
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material))
        mesh.material.forEach((mat) => mat.dispose());
      else mesh.material.dispose();
    }
    if (mesh.children && mesh.children.length) {
      mesh.children.forEach(
        (child) => this.disposeMeshRecursively(child)
      );
    }
    mesh.children.length = 0;
  }
};
var BimatterViewer = class {
  constructor(settings) {
    this.models = {};
    this.settings = settings || {};
    if (!this.settings.container) {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.top = "0";
      div.style.bottom = "0";
      div.style.left = "0";
      div.style.right = "0";
      div.style.zIndex = "0";
      document.body.appendChild(div);
      this.container = div;
    } else {
      this.container = this.settings.container;
    }
    this.loaders = new Loaders(this);
    this.context = new Context(this, this.settings);
    this.selector = new Selector(this);
    this.bvhManager = new BvhManager(this);
    this.utils = new Utils(this);
  }
  addEmptyModel(modelID) {
    return new Model(
      this,
      modelID,
      false,
      new THREE2.Group(),
      {},
      { type: "null", id: 1, children: [] },
      void 0,
      void 0,
      void 0,
      void 0,
      Date.now()
    );
  }
  loadModel(arg1, fitToView, onLoadCallback) {
    let path;
    let ext;
    if (!arg1) throw new Error("Need to provide file or path!");
    if (arg1 instanceof File) {
      path = URL.createObjectURL(arg1);
      ext = arg1.name.split(".").pop();
    } else if (typeof arg1 === "string") {
      path = arg1;
      ext = path.split(".").pop();
    }
    if (!path || !ext) throw new Error("Unsupported file!");
    switch (ext.toLowerCase()) {
      case "ifc":
        return this.loaders.ifcLoader.loadModel(
          path,
          fitToView,
          onLoadCallback
        );
      case "bmt":
        return this.loaders.bmtLoader.loadModel(path, fitToView);
      default:
        throw new Error("Unsupported file!");
    }
  }
  removeModel(modelID) {
    const model = this.models[modelID];
    model.threeGeometry.children.forEach((ch) => {
      ch.geometry.dispose();
    });
    model.state.idsMap = {};
    model.defaultState.idsMap = {};
    model.defaultState.indMap = {};
    model.threeGeometry.removeFromParent();
    model.properties.data = {};
    model.properties.structure = { id: 1, type: "", children: [] };
    delete this.models[modelID];
    delete this.selector.selectedElements[modelID];
    if (this.utils.clippingUtils.active) {
      this.utils.clippingUtils.updateEdges();
    }
  }
  dispose() {
    for (const key of Object.keys(this.models)) {
      this.removeModel(Number(key));
    }
    this.context.camera.threeCamera.removeFromParent();
    this.context.scene.threeScene.removeFromParent();
    this.context.controls.cameraControl.dispose();
    this.context.environment.lights.ambientLight.removeFromParent();
    this.context.environment.lights.directionalLight1.removeFromParent();
    this.context.environment.lights.directionalLight2.removeFromParent();
    this.context.renderer.tempRenderer?.dispose();
    this.context.renderer.threeRenderer.dispose();
    this.context.renderer.threeRenderer2D.domElement.remove();
    this.context.renderer.threeRenderer3D.domElement.remove();
    this.container.remove();
    this.utils.propsUtils.propConteiner?.remove();
    this.utils.navigationCubeUtil.cubeContainer?.remove();
  }
};
var BimatterConverter = class {
  constructor() {
    this.loaders = new Loaders(this);
    this.utils = { decoder: decoder__namespace };
    this.models = {};
  }
};
/*!
 * meshwalk
 * https://github.com/[object Object]
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
/*!
 * camera-controls
 * https://github.com/yomotsu/camera-controls
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */

exports.BimatterConverter = BimatterConverter;
exports.BimatterViewer = BimatterViewer;
exports.BvhManager = BvhManager;
exports.Camera = Camera;
exports.ClippingUtils = ClippingUtils;
exports.Context = Context;
exports.Environment = Environment;
exports.KeysUtils = KeysUtils;
exports.Loaders = Loaders;
exports.Model = Model;
exports.OsUtils = OsUtils;
exports.Renderer = Renderer;
exports.Scene = Scene2;
exports.Selector = Selector;
exports.Utils = Utils;
exports.ViewCubeContainer = ViewCubeContainer;
exports.default = BimatterViewer;
