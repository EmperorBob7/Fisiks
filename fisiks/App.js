import { Debugger } from "../lib/webglutils/Debugging.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
// import { Floor } from "../lib/webglutils/Floor.js";
import { GUI } from "./Gui.js";
import { BBoxFSText, BBoxVSText, WaterFSText, WaterVSText, debugRayFSText, debugRayVSText } from "./Shaders.js";
import { Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { DebugRay } from "./DebugRay.js";
import { BBox } from "./BBox.js";
import { Particle } from "./Particle.js";
import { Physics } from "./Physics.js";
import { WaterMesh } from "./WaterMesh.js";
// import { TextureLoader, Texture, MeshBasicMaterial } from "../lib/threejs/src/Three.js";
export class SkinningAnimation extends CanvasAnimation {
    constructor(canvas, particleDim) {
        super(canvas);
        this.particleDim = particleDim;
        this.canvas = canvas;
        this.ctx = Debugger.makeDebugContext(this.ctx);
        SkinningAnimation.ctx = this.ctx;
        let gl = this.ctx;
        this.debugRay = new DebugRay();
        this.debugRayRenderPass = new RenderPass(this.extVAO, gl, debugRayVSText, debugRayFSText);
        this.waterMesh = new WaterMesh();
        this.waterMeshRenderPass = new RenderPass(this.extVAO, gl, WaterVSText, WaterFSText);
        SkinningAnimation.boundingBox = new BBox(new Vec3([3, 3, 3]), new Vec3([-3, -3, -3]));
        SkinningAnimation.boundingBoxRenderPass = new RenderPass(this.extVAO, gl, BBoxVSText, BBoxFSText);
        this.gui = new GUI(canvas, this);
        SkinningAnimation.gui = this.gui;
        this.lightPosition = new Vec4([-10, 10, -10, 1]);
        this.backgroundColor = new Vec4([1, 1, 1, 1.0]);
        SkinningAnimation.millis = new Date().getTime();
    }
    /**
     * Setup the animation. This can be called again to reset the animation.
     */
    reset() {
        this.gui.reset();
        this.setScene(this.loadedScene);
    }
    initScene() {
        this.initDebugRay();
        // this.waterMesh.setPosition(SkinningAnimation.boundingBox, SkinningAnimation.particles);
        this.initWaterMesh();
        SkinningAnimation.initBoundingBox();
        this.resetParticles();
        this.gui.reset();
    }
    resetParticles() {
        SkinningAnimation.updateBBox();
        Particle.reset();
        SkinningAnimation.particles = [];
        const spacingFactor = 0.1;
        for (let i = 0; i < this.particleDim; i++) {
            for (let j = 0; j < this.particleDim; j++) {
                for (let k = 0; k < this.particleDim; k++) {
                    SkinningAnimation.particles.push(new Particle(new Vec3([i * spacingFactor, j * spacingFactor, k * spacingFactor]), 0.1));
                }
            }
        }
        Particle.initRenderPass(this.extVAO, this.ctx, this.gui, this.lightPosition);
    }
    static updateBBox() {
        SkinningAnimation.boundingBox = new BBox(new Vec3([SkinningAnimation.xPos, SkinningAnimation.yPos, SkinningAnimation.zPos]), new Vec3([SkinningAnimation.xNeg, SkinningAnimation.yNeg, SkinningAnimation.zNeg]));
        SkinningAnimation.initBoundingBox();
    }
    getParticles() {
        return SkinningAnimation.particles;
    }
    initDebugRay() {
        this.debugRayRenderPass.setIndexBufferData(this.debugRay.indicesFlat());
        this.debugRayRenderPass.addAttribute("vertIndex", 1, this.ctx.FLOAT, false, 1 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, new Float32Array([...this.debugRay.indicesFlat()]));
        this.debugRayRenderPass.addUniform("positionVertices", (gl, loc) => {
            gl.uniform4fv(loc, this.debugRay.positionsFlat());
        });
        this.debugRayRenderPass.addAttribute("aNorm", 4, this.ctx.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.debugRay.normalsFlat());
        this.debugRayRenderPass.addUniform("uWorld", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.debugRay.getModelMatrix().all()));
        });
        this.debugRayRenderPass.addUniform("uProj", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
        });
        this.debugRayRenderPass.addUniform("uView", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
        });
        this.debugRayRenderPass.setDrawData(this.ctx.LINES, this.debugRay.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
        this.debugRayRenderPass.setup();
    }
    initWaterMesh() {
        this.waterMeshRenderPass = new RenderPass(this.extVAO, this.ctx, WaterVSText, WaterFSText);
        this.waterMeshRenderPass.setIndexBufferData(this.waterMesh.indicesFlat());
        this.waterMeshRenderPass.addUniform("uWorld", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.waterMesh.getModelMatrix().all()));
        });
        this.waterMeshRenderPass.addUniform("uProj", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
        });
        this.waterMeshRenderPass.addUniform("uView", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
        });
        this.waterMeshRenderPass.addUniform("lightPosition", (gl, loc) => {
            gl.uniform4fv(loc, this.lightPosition.xyzw);
        });
        this.waterMeshRenderPass.setDrawData(this.ctx.TRIANGLES, this.waterMesh.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
        this.updateWaterMesh();
    }
    updateWaterMesh() {
        this.waterMeshRenderPass.addAttribute("vertPosition", 3, this.ctx.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.waterMesh.positionsFlat());
        this.waterMeshRenderPass.addAttribute("aNorm", 3, this.ctx.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.waterMesh.normalsFlat());
        this.waterMeshRenderPass.setup();
    }
    static initBoundingBox() {
        SkinningAnimation.boundingBoxRenderPass.setIndexBufferData(SkinningAnimation.boundingBox.indicesFlat());
        SkinningAnimation.boundingBoxRenderPass.addAttribute("vertPosition", 4, SkinningAnimation.ctx.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, SkinningAnimation.boundingBox.positionsFlat());
        SkinningAnimation.boundingBoxRenderPass.addUniform("uWorld", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.boundingBox.getModelMatrix().all()));
        });
        SkinningAnimation.boundingBoxRenderPass.addUniform("uProj", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.gui.projMatrix().all()));
        });
        SkinningAnimation.boundingBoxRenderPass.addUniform("uView", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.gui.viewMatrix().all()));
        });
        SkinningAnimation.boundingBoxRenderPass.setDrawData(SkinningAnimation.ctx.LINES, SkinningAnimation.boundingBox.indicesFlat().length, SkinningAnimation.ctx.UNSIGNED_INT, 0);
        SkinningAnimation.boundingBoxRenderPass.setup();
    }
    static getDeltaTime() {
        return SkinningAnimation.deltaT;
    }
    /** @internal
     * Draws a single frame
     *
     */
    draw() {
        // Update skeleton state
        let curr = new Date().getTime();
        let deltaT = curr - SkinningAnimation.millis;
        SkinningAnimation.millis = curr;
        deltaT /= 1000;
        SkinningAnimation.deltaT = deltaT;
        const particleBuckets = this.bucketizeParticles(SkinningAnimation.boundingBox, SkinningAnimation.particles);
        Physics.simulationStep(deltaT, SkinningAnimation.particles, SkinningAnimation.boundingBox);
        this.waterMesh.setPosition(SkinningAnimation.boundingBox, particleBuckets);
        this.initWaterMesh();
        // Drawing
        const gl = this.ctx;
        const bg = this.backgroundColor;
        gl.clearColor(bg.r, bg.g, bg.b, bg.a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
        this.drawScene(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Put particles into 3D Array.
     * First index by X, then index by Z, then you have a list of Particles in this 3D "column"
     * @param bbox
     * @param particles
     * @returns
     */
    bucketizeParticles(bbox, particles) {
        const numRows = WaterMesh.numRows;
        const numCols = WaterMesh.numCols;
        const particleArr = [];
        for (let r = 0; r <= numRows; r++) {
            particleArr[r] = [];
            for (let c = 0; c <= numCols; c++) {
                particleArr[r][c] = [];
            }
        }
        const startX = bbox.getMinX();
        const endX = bbox.getMaxX();
        const xStepSize = (endX - startX) / numRows;
        const startZ = bbox.getMinZ();
        const endZ = bbox.getMaxZ();
        const zStepSize = (endZ - startZ) / numCols;
        for (const particle of particles) {
            const particlePos = particle.getPosition();
            const xIndex = Physics.clamp(Math.round((particlePos.x - startX) / xStepSize), 0, numRows);
            const zIndex = Physics.clamp(Math.round((particlePos.z - startZ) / zStepSize), 0, numCols);
            // console.log("Bucket", xIndex, zIndex);
            particleArr[xIndex][zIndex].push(particle);
        }
        return particleArr;
    }
    drawScene(x, y, width, height) {
        const gl = this.ctx;
        gl.viewport(x, y, width, height);
        if (SkinningAnimation.renderParticles)
            Particle.renderPass.draw();
        if (SkinningAnimation.renderMesh)
            this.waterMeshRenderPass.draw();
        // this.debugRayRenderPass.draw();
        SkinningAnimation.boundingBoxRenderPass.draw();
    }
    getGUI() {
        return this.gui;
    }
    /**
     * Loads and sets the scene from a Collada file
     * @param fileLocation URI for the Collada file
     */
    setScene(fileLocation) {
        this.loadedScene = fileLocation;
        // this.scene = new CLoader(fileLocation);
        // this.scene.load(() => this.initScene());
        this.initScene();
    }
}
SkinningAnimation.xPos = 3;
SkinningAnimation.yPos = 3;
SkinningAnimation.zPos = 3;
SkinningAnimation.xNeg = -3;
SkinningAnimation.yNeg = -3;
SkinningAnimation.zNeg = -3;
/* Particles */
SkinningAnimation.particles = [];
SkinningAnimation.renderParticles = false;
SkinningAnimation.renderMesh = true;
export function initializeCanvas() {
    const canvas = document.getElementById("glCanvas");
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.95;
    console.log(canvas.width, canvas.height);
    /* Start drawing */
    const canvasAnimation = new SkinningAnimation(canvas, 6);
    canvasAnimation.start();
    canvasAnimation.setScene("./static/assets/fisiks/split_cube.dae");
}
//# sourceMappingURL=App.js.map