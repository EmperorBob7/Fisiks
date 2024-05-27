import { Mat4 } from "../lib/TSM.js";
export class Cylinder {
    constructor() {
        this.RADIUS = 0.07;
        this.HEIGHT = 1.0;
        this.dirty = false;
        this.selectedBone = -1;
        this.setPosition(0, 0, 0);
        this.setDirty();
    }
    setPosition(xPos, yPos, zPos) {
        const segments = 6;
        const vertices = [];
        const indices = [];
        const normals = [];
        const angleStep = (2 * Math.PI) / segments;
        let indexTotal = 0;
        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;
            const x = this.RADIUS * Math.cos(angle) + xPos;
            const nextX = this.RADIUS * Math.cos(nextAngle) + xPos;
            const z = this.RADIUS * Math.sin(angle) + zPos;
            const nextZ = this.RADIUS * Math.sin(nextAngle) + zPos;
            // Vertical Lines
            vertices.push(x, this.HEIGHT + yPos, z, 0.0);
            vertices.push(x, yPos, z, 0.0);
            // Top Cap
            vertices.push(x, this.HEIGHT + yPos, z, 0.0);
            vertices.push(nextX, this.HEIGHT + yPos, nextZ, 0.0);
            // Middle Cap
            vertices.push(x, this.HEIGHT / 2 + yPos, z, 0.0);
            vertices.push(nextX, this.HEIGHT / 2 + yPos, nextZ, 0.0);
            // Bottom Cap
            vertices.push(x, yPos, z, 0.0);
            vertices.push(nextX, yPos, nextZ, 0.0);
            indexTotal += 2 * 4;
        }
        for (let i = 0; i < indexTotal; i++) {
            indices.push(i);
        }
        this.geometryFlat = new Float32Array(vertices);
        this.indexFlat = new Uint32Array(indices);
        this.normalFlat = new Float32Array(normals);
        this.modelMatrix = new Mat4().setIdentity();
    }
    setDirty() {
        this.dirty = true;
    }
    isDirty() {
        return this.dirty;
    }
    setClean() {
        this.dirty = false;
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
    rotate(angleInRadians, axis) {
        // Create a rotation matrix and apply it to the modelMatrix
        const rotationMatrix = new Mat4();
        this.modelMatrix.rotate(angleInRadians, axis, rotationMatrix);
        this.modelMatrix = rotationMatrix;
    }
    translate(translationVec) {
        this.modelMatrix.translate(translationVec);
    }
    getModelMatrix() {
        return this.modelMatrix;
    }
}
//# sourceMappingURL=Cylinder.js.map