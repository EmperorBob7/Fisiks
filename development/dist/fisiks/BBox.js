import { Mat4 } from "../lib/TSM.js";
//Class for Bounding Box
export class BBox {
    constructor(topLeft, bottomRight) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
        const vertices = [];
        const indices = [];
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
    isPositionInside(position, radius) {
        let inBounds = [0, 0, 0];
        if (position.x - radius < this.getMinX()) {
            inBounds[0] = -1;
        }
        else if (position.x + radius > this.getMaxX()) {
            inBounds[0] = 1;
        }
        if (position.y - radius < this.getMinY()) {
            inBounds[1] = -1;
        }
        else if (position.y + radius > this.getMaxY()) {
            inBounds[1] = 1;
        }
        if (position.z - radius < this.getMinZ()) {
            inBounds[2] = -1;
        }
        else if (position.z + radius > this.getMaxZ()) {
            inBounds[2] = 1;
        }
        return inBounds;
    }
    getTopLeft() {
        return this.topLeft;
    }
    getBottomRight() {
        return this.bottomRight;
    }
    getMinX() {
        return Math.min(this.topLeft.x, this.bottomRight.x);
    }
    getMaxX() {
        return Math.max(this.topLeft.x, this.bottomRight.x);
    }
    getMinY() {
        return Math.min(this.topLeft.y, this.bottomRight.y);
    }
    getMaxY() {
        return Math.max(this.topLeft.y, this.bottomRight.y);
    }
    getMinZ() {
        return Math.min(this.topLeft.z, this.bottomRight.z);
    }
    getMaxZ() {
        return Math.max(this.topLeft.z, this.bottomRight.z);
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
//# sourceMappingURL=BBox.js.map