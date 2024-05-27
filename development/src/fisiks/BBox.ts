import { Mat4, Quat, Vec3 } from "../lib/TSM.js";

//Class for Bounding Box
export class BBox {
    private geometryFlat: Float32Array;
    private normalFlat: Float32Array;
    private indexFlat: Uint32Array;
    private modelMatrix: Mat4;
    private topLeft: Vec3;
    private bottomRight: Vec3;

    constructor(topLeft: Vec3, bottomRight: Vec3) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;

        const vertices: number[] = [];
        const indices: number[] = [];

        let indexTotal = 0;
        // Top Rectangle
        vertices.push(topLeft.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(topLeft.x, topLeft.y, bottomRight.z, 0.0);
        vertices.push(topLeft.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, bottomRight.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, bottomRight.z, 0.0);
        vertices.push(topLeft.x, topLeft.y, bottomRight.z, 0.0);
        indexTotal += 8;
        // Bottom Rectangle
        vertices.push(topLeft.x, bottomRight.y, topLeft.z, 0.0);
        vertices.push(topLeft.x, bottomRight.y, bottomRight.z, 0.0);
        vertices.push(topLeft.x, bottomRight.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, bottomRight.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, bottomRight.z, 0.0);
        vertices.push(topLeft.x, bottomRight.y, bottomRight.z, 0.0);
        indexTotal += 8;
        // Connecting Lines
        vertices.push(topLeft.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(topLeft.x, bottomRight.y, topLeft.z, 0.0);
        vertices.push(topLeft.x, topLeft.y, bottomRight.z, 0.0);
        vertices.push(topLeft.x, bottomRight.y, bottomRight.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, bottomRight.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, bottomRight.z, 0.0);
        vertices.push(bottomRight.x, topLeft.y, topLeft.z, 0.0);
        vertices.push(bottomRight.x, bottomRight.y, topLeft.z, 0.0);
        indexTotal += 8;

        for (let i = 0; i < indexTotal; i++) {
            indices.push(i);
        }
        this.geometryFlat = new Float32Array(vertices);
        this.indexFlat = new Uint32Array(indices);
        this.modelMatrix = new Mat4().setIdentity();
    }

    public isPositionInside(position: Vec3, radius: number): number[] {
        let inBounds = [0, 0, 0];
        if (position.x - radius < this.getMinX()) {
            inBounds[0] = -1;
        } else if (position.x + radius > this.getMaxX()) {
            inBounds[0] = 1;
        }
        if (position.y - radius < this.getMinY()) {
            inBounds[1] = -1;
        } else if (position.y + radius > this.getMaxY()) {
            inBounds[1] = 1;
        }
        if (position.z - radius < this.getMinZ()) {
            inBounds[2] = -1;
        } else if (position.z + radius > this.getMaxZ()) {
            inBounds[2] = 1;
        }
        return inBounds;
    }
    
    public getTopLeft(): Vec3{
        return this.topLeft;
    }

    public getBottomRight(): Vec3{
        return this.bottomRight;
    }

    public getMinX(): number {
        return Math.min(this.topLeft.x, this.bottomRight.x);
    }

    public getMaxX(): number {
        return Math.max(this.topLeft.x, this.bottomRight.x);
    }

    public getMinY(): number {
        return Math.min(this.topLeft.y, this.bottomRight.y);
    }

    public getMaxY(): number {
        return Math.max(this.topLeft.y, this.bottomRight.y);
    }

    public getMinZ(): number {
        return Math.min(this.topLeft.z, this.bottomRight.z);
    }

    public getMaxZ(): number {
        return Math.max(this.topLeft.z, this.bottomRight.z);
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

    public getModelMatrix(): Mat4 {
        return this.modelMatrix;
    }
}