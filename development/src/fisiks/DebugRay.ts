import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";

export class DebugRay {
    private geometryFlat: Float32Array;
    private normalFlat: Float32Array;
    private indexFlat: Uint32Array;
    private modelMatrix: Mat4;

    RADIUS = 0.07;
    HEIGHT = 1.0;

    constructor() {
        this.setPosition(new Vec3([0, 0, 0]), new Vec3([1, 1, 0]));
    }

    public setPosition(startPos: Vec3, endPos: Vec3): void {
        // console.log("CREATE DEBUG");
        const vertices: number[] = [];
        const indices: number[] = [];
        const normals: number[] = [];

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

    public positionsFlat(): Float32Array {
        return this.geometryFlat;
    }

    public indicesFlat(): Uint32Array {
        return this.indexFlat;
    }

    public normalsFlat(): Float32Array {
        return this.normalFlat;
    }

    getModelMatrix(): Mat4 {
        return this.modelMatrix;
    }
}