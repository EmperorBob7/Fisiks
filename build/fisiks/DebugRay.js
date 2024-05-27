import { Mat4, Vec3 } from "../lib/TSM.js";
export class DebugRay {
    constructor() {
        this.RADIUS = 0.07;
        this.HEIGHT = 1.0;
        this.setPosition(new Vec3([0, 0, 0]), new Vec3([1, 1, 0]));
    }
    setPosition(startPos, endPos) {
        // console.log("CREATE DEBUG");
        const vertices = [];
        const indices = [];
        const normals = [];
        vertices.push(...startPos.xyz, 0.0);
        vertices.push(...endPos.xyz, 0.0);
        // console.log("Debug Vertices", vertices);
        for (let i = 0; i < 2; i++) {
            indices.push(i);
        }
        this.geometryFlat = new Float32Array(vertices);
        this.indexFlat = new Uint32Array(indices);
        this.normalFlat = new Float32Array(normals);
        this.modelMatrix = new Mat4().setIdentity();
    }
    positionsFlat() {
        return this.geometryFlat;
    }
    indicesFlat() {
        return this.indexFlat;
    }
    normalsFlat() {
        return this.normalFlat;
    }
    getModelMatrix() {
        return this.modelMatrix;
    }
}
//# sourceMappingURL=DebugRay.js.map