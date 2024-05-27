import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";
import { BBox } from "./BBox.js";
import { Particle } from "./Particle.js";

export class WaterMesh {
    private geometryFlat: Float32Array;
    private normalFlat: Float32Array;
    private indexFlat: Uint32Array;
    private modelMatrix: Mat4;

    public static meshSubdivisions = 10;
    public static numRows = WaterMesh.meshSubdivisions; // X
    public static numCols = WaterMesh.meshSubdivisions; // Z

    constructor() {
        // this.setPosition();
        this.geometryFlat = new Float32Array([]);
        this.normalFlat = new Float32Array([]);
        this.indexFlat = new Uint32Array([]);
        this.modelMatrix = new Mat4().setIdentity();
    }

    public setPosition(bbox: BBox, particleBuckets: Particle[][][]): void {
        const maxYCache: number[][] = [];
        let minY: number = bbox.getMaxY(); // Lowest Y-value of all particles
        for (let row = 0; row <= WaterMesh.numRows; row++) {
            maxYCache[row] = [];
            for (let col = 0; col <= WaterMesh.numCols; col++) {
                const bucket = particleBuckets[row][col];
                let maxY = 0;
                for (const particle of bucket) {
                    // maxY = Math.max(maxY, particle.position.y + particle.radius);
                    maxY += particle.position.y + particle.radius;
                    minY = Math.min(minY, particle.position.y - particle.radius);
                }
                if(bucket.length != 0)
                    maxY /= bucket.length;
                else
                    maxY = bbox.getMinY();
                maxYCache[row][col] = maxY;
            }
        }

        const vertices: number[] = [];
        const normals: number[] = [];
        const waterBounds = this.waterBoundHelper(particleBuckets);
        let indexTotal = 0;
        indexTotal += this.topFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, waterBounds);
        indexTotal += this.frontFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, minY, waterBounds);
        indexTotal += this.backFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, minY, waterBounds);
        indexTotal += this.bottomFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, minY, waterBounds);
        indexTotal += this.leftFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, minY, waterBounds);
        indexTotal += this.rightFaceMesh(bbox, particleBuckets, maxYCache, vertices, normals, minY, waterBounds);

        this.geometryFlat = new Float32Array(vertices);
        this.normalFlat = new Float32Array(normals);
        // this.modelMatrix = new Mat4().setIdentity();

        let indices: number[] = [];
        for (let i = 0; i < indexTotal; i++) {
            indices.push(i);
        }
        this.indexFlat = new Uint32Array(indices);
    }

    private topFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;

        // -1 because of how the grid works (draw a diagram)
        for (let xRow = startingXIndex; xRow < endingXIndex; xRow++) {
            for (let zCol = startingZIndex; zCol < endingZIndex; zCol++) {
                const maxY = maxYCache[xRow][zCol];
                const rightMaxY = maxYCache[xRow][zCol + 1];
                const upMaxY = maxYCache[xRow + 1][zCol];
                const upRightMaxY = maxYCache[xRow + 1][zCol + 1];

                // Bottom left half
                const arrA: [number, number, number] = [startX + xStepSize * xRow, maxY, startZ + zStepSize * zCol];
                const arrB: [number, number, number] = [startX + xStepSize * xRow, rightMaxY, startZ + zStepSize * (zCol + 1)];
                const arrC: [number, number, number] = [startX + xStepSize * (xRow + 1), upMaxY, startZ + zStepSize * zCol];
                vertices.push(...arrA);
                vertices.push(...arrB);
                vertices.push(...arrC);
                const vecA = new Vec3(arrA);
                const vecB = new Vec3(arrB);
                const vecC = new Vec3(arrC);
                const bToA = Vec3.difference(vecA, vecB);
                const bToC = Vec3.difference(vecC, vecB);
                const aToB = Vec3.difference(vecB, vecA);
                const aToC = Vec3.difference(vecC, vecA);
                const cToB = Vec3.difference(vecB, vecC);
                const cToA = Vec3.difference(vecA, vecC);
                let normalOne: number[] = Vec3.cross(aToB, aToC).normalize().xyz;

                normals.push(...(Vec3.cross(aToB, aToC).normalize().xyz));
                normals.push(...(Vec3.cross(bToC, bToA).normalize().xyz));
                normals.push(...(Vec3.cross(cToA, cToB).normalize().xyz));
                indexTotal += 3;

                // Upper right half
                const arrD: [number, number, number] = [startX + xStepSize * (xRow + 1), upRightMaxY, startZ + zStepSize * (zCol + 1)];
                vertices.push(...arrB);
                vertices.push(...arrD);
                vertices.push(...arrC);
                const vecD = new Vec3(arrD);
                const dToB = Vec3.difference(vecB, vecD);
                const dToC = Vec3.difference(vecC, vecD);
                const bToD = Vec3.difference(vecD, vecB);
                const cToD = Vec3.difference(vecD, vecC);
                // const dToB = Vec3.difference(vecB, vecD);
                // let normalTwo: number[] = Vec3.cross(bToC, bToD).negate().normalize().xyz;

                normals.push(...(Vec3.cross(bToD, bToC).normalize().xyz));
                normals.push(...(Vec3.cross(dToC, dToB).normalize().xyz));
                normals.push(...(Vec3.cross(cToB, cToD).normalize().xyz));
                indexTotal += 3;
            }
        }
        return indexTotal;
    }

    private bottomFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], minY: number, waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;
        // Right Triangle
        vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * startingZIndex);
        vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * startingZIndex);
        vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * endingZIndex);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        indexTotal += 3;
        // Left Triangle
        vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * startingZIndex);
        vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * endingZIndex);
        vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * endingZIndex);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        normals.push(0, -1, 0);
        indexTotal += 3;

        return indexTotal;
    }

    // minX face of BBox
    private frontFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], minY: number, waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;

        for (let xRow = startingXIndex; xRow < endingXIndex; xRow++) {
            let height1 = maxYCache[xRow][startingZIndex];
            let height2 = maxYCache[xRow + 1][startingZIndex];
            // Upper right half
            vertices.push(startX + xStepSize * xRow, minY, startZ + zStepSize * startingZIndex);
            vertices.push(startX + xStepSize * xRow, height1, startZ + zStepSize * startingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), height2, startZ + zStepSize * startingZIndex);

            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            indexTotal += 3;

            // Bottom left half
            vertices.push(startX + xStepSize * xRow, minY, startZ + zStepSize * startingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), height2, startZ + zStepSize * startingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), minY, startZ + zStepSize * startingZIndex);

            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            indexTotal += 3;
        }

        return indexTotal;
    }

    // maxX face of BBox
    private backFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], minY: number, waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;

        for (let xRow = startingXIndex; xRow < endingXIndex; xRow++) {
            let height1 = maxYCache[xRow][endingZIndex];
            let height2 = maxYCache[xRow + 1][endingZIndex];
            // Upper right half
            vertices.push(startX + xStepSize * xRow, minY, startZ + zStepSize * endingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), height2, startZ + zStepSize * endingZIndex);
            vertices.push(startX + xStepSize * xRow, height1, startZ + zStepSize * endingZIndex);

            normals.push(0, 0, 1);
            normals.push(0, 0, 1);
            normals.push(0, 0, 1);

            indexTotal += 3;

            // Bottom left half
            vertices.push(startX + xStepSize * xRow, minY, startZ + zStepSize * endingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), minY, startZ + zStepSize * endingZIndex);
            vertices.push(startX + xStepSize * (xRow + 1), height2, startZ + zStepSize * endingZIndex);

            normals.push(0, 0, 1);
            normals.push(0, 0, 1);
            normals.push(0, 0, 1);
            indexTotal += 3;
        }

        return indexTotal;
    }

    // minZ face of BBox
    private leftFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], minY: number, waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;

        for (let zCol = startingZIndex; zCol < endingZIndex; zCol++) {
            let height1 = maxYCache[startingXIndex][zCol];
            let height2 = maxYCache[startingXIndex][zCol + 1];
            // Upper right half
            vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * zCol);
            vertices.push(startX + xStepSize * startingXIndex, height2, startZ + zStepSize * (zCol + 1));
            vertices.push(startX + xStepSize * startingXIndex, height1, startZ + zStepSize * zCol);

            normals.push(-1, 0, 0);
            normals.push(-1, 0, 0);
            normals.push(-1, 0, 0);
            indexTotal += 3;

            // Bottom left half
            vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * zCol);
            vertices.push(startX + xStepSize * startingXIndex, minY, startZ + zStepSize * (zCol + 1));
            vertices.push(startX + xStepSize * startingXIndex, height2, startZ + zStepSize * (zCol + 1));

            normals.push(-1, 0, 0);
            normals.push(-1, 0, 0);
            normals.push(-1, 0, 0);
            indexTotal += 3;
        }

        return indexTotal;
    }

    // maxZ face of BBox
    private rightFaceMesh(bbox: BBox, particleBuckets: Particle[][][], maxYCache: number[][], vertices: number[], normals: number[], minY: number, waterBounds: number[]): number {
        let indexTotal = 0;
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / WaterMesh.numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / WaterMesh.numCols;
        let [startingXIndex, endingXIndex, startingZIndex, endingZIndex] = waterBounds;

        for (let zCol = startingZIndex; zCol < endingZIndex; zCol++) {
            let height1 = maxYCache[endingXIndex][zCol];
            let height2 = maxYCache[endingXIndex][zCol + 1];
            // Upper right half
            vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * zCol);
            vertices.push(startX + xStepSize * endingXIndex, height1, startZ + zStepSize * zCol);
            vertices.push(startX + xStepSize * endingXIndex, height2, startZ + zStepSize * (zCol + 1));

            normals.push(1, 0, 0);
            normals.push(1, 0, 0);
            normals.push(1, 0, 0);
            indexTotal += 3;

            // Bottom left half
            vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * zCol);
            vertices.push(startX + xStepSize * endingXIndex, height2, startZ + zStepSize * (zCol + 1));
            vertices.push(startX + xStepSize * endingXIndex, minY, startZ + zStepSize * (zCol + 1));

            normals.push(1, 0, 0);
            normals.push(1, 0, 0);
            normals.push(1, 0, 0);
            indexTotal += 3;
        }

        return indexTotal;
    }

    private waterBoundHelper(particleBuckets: Particle[][][]): number[] {
        let startingXIndex = WaterMesh.numRows;
        let endingXIndex = 0;
        // Z
        let startingZIndex = WaterMesh.numCols;
        let endingZIndex = 0;
        for (let row = 0; row <= WaterMesh.numRows; row++) {
            for (let col = 0; col <= WaterMesh.numCols; col++) {
                const bucket = particleBuckets[row][col];
                if (bucket.length != 0) {
                    startingXIndex = Math.min(startingXIndex, row);
                    endingXIndex = row;

                    startingZIndex = Math.min(startingZIndex, col);
                    endingZIndex = Math.max(col, endingZIndex);
                }
            }
        }
        return [startingXIndex, endingXIndex, startingZIndex, endingZIndex];
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