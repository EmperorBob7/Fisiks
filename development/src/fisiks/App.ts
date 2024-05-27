import { Debugger } from "../lib/webglutils/Debugging.js";
import {
    CanvasAnimation,
    WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
// import { Floor } from "../lib/webglutils/Floor.js";
import { GUI, Mode } from "./Gui.js";
import {
    BBoxFSText,
    BBoxVSText,
    WaterFSText,
    WaterVSText,
    debugRayFSText,
    debugRayVSText
} from "./Shaders.js";
import { Mat4, Vec4, Vec3, Quat } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Camera } from "../lib/webglutils/Camera.js";
import { DebugRay } from "./DebugRay.js";
import { BBox } from "./BBox.js";
import { Particle } from "./Particle.js";
import { Physics } from "./Physics.js";
import { WaterMesh } from "./WaterMesh.js";
// import { TextureLoader, Texture, MeshBasicMaterial } from "../lib/threejs/src/Three.js";

export class SkinningAnimation extends CanvasAnimation {
    private canvas: HTMLCanvasElement;
    private gui: GUI;
    private static millis: number;
    private static deltaT: number;

    private loadedScene: string;

    /* Floor Rendering Info */
    // private floor: Floor;
    // private floorRenderPass: RenderPass;

    /* Debug Ray Info */
    public debugRay: DebugRay;
    private debugRayRenderPass: RenderPass;

    /* Bounding Box Info */
    public static boundingBox: BBox;
    public static xPos = 3;
    public static yPos = 3;
    public static zPos = 3;
    public static xNeg = -3;
    public static yNeg = -3;
    public static zNeg = -3;
    private static ctx: WebGLRenderingContext;
    private static gui: GUI;

    private static boundingBoxRenderPass: RenderPass;

    /* Particles */
    public static particles: Particle[] = [];
    private particleDim: number;

    private waterMesh: WaterMesh;
    private waterMeshRenderPass: RenderPass;
    public static renderParticles: boolean = false;
    public static renderMesh: boolean = true;

    /* Global Rendering Info */
    private lightPosition: Vec4;
    private backgroundColor: Vec4;

    constructor(canvas: HTMLCanvasElement, particleDim: number) {
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
    public reset(): void {
        this.gui.reset();
        this.setScene(this.loadedScene);
    }

    public initScene(): void {
        this.initDebugRay();
        // this.waterMesh.setPosition(SkinningAnimation.boundingBox, SkinningAnimation.particles);
        this.initWaterMesh();
        SkinningAnimation.initBoundingBox();
        this.resetParticles();
        this.gui.reset();
    }

    public resetParticles(): void {
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

    public static updateBBox(): void {
        SkinningAnimation.boundingBox = new BBox(new Vec3([SkinningAnimation.xPos, SkinningAnimation.yPos, SkinningAnimation.zPos]), new Vec3([SkinningAnimation.xNeg, SkinningAnimation.yNeg, SkinningAnimation.zNeg]));
        SkinningAnimation.initBoundingBox();
    }

    public getParticles(): Particle[] {
        return SkinningAnimation.particles;
    }

    public initDebugRay(): void {
        this.debugRayRenderPass.setIndexBufferData(this.debugRay.indicesFlat());
        this.debugRayRenderPass.addAttribute("vertIndex",
            1,
            this.ctx.FLOAT,
            false,
            1 * Float32Array.BYTES_PER_ELEMENT,
            0,
            undefined,
            new Float32Array([...this.debugRay.indicesFlat()]));

        this.debugRayRenderPass.addUniform("positionVertices",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniform4fv(loc, this.debugRay.positionsFlat());
            });
        this.debugRayRenderPass.addAttribute("aNorm", 4, this.ctx.FLOAT, false,
            4 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.debugRay.normalsFlat());
        this.debugRayRenderPass.addUniform("uWorld",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.debugRay.getModelMatrix().all()));
            });
        this.debugRayRenderPass.addUniform("uProj",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
            });
        this.debugRayRenderPass.addUniform("uView",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
            });

        this.debugRayRenderPass.setDrawData(this.ctx.LINES, this.debugRay.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
        this.debugRayRenderPass.setup();
    }

    public initWaterMesh(): void {
        this.waterMeshRenderPass = new RenderPass(this.extVAO, this.ctx, WaterVSText, WaterFSText);
        this.waterMeshRenderPass.setIndexBufferData(this.waterMesh.indicesFlat());

        this.waterMeshRenderPass.addUniform("uWorld",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.waterMesh.getModelMatrix().all()));
            });
        this.waterMeshRenderPass.addUniform("uProj",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
            });
        this.waterMeshRenderPass.addUniform("uView",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
            });
        this.waterMeshRenderPass.addUniform("lightPosition",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniform4fv(loc, this.lightPosition.xyzw);
            });

        this.waterMeshRenderPass.setDrawData(this.ctx.TRIANGLES, this.waterMesh.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
        this.updateWaterMesh();
    }

    public updateWaterMesh(): void {
        this.waterMeshRenderPass.addAttribute("vertPosition",
            3,
            this.ctx.FLOAT,
            false,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0,
            undefined,
            this.waterMesh.positionsFlat());

        this.waterMeshRenderPass.addAttribute("aNorm", 3, this.ctx.FLOAT, false,
            3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.waterMesh.normalsFlat());
        this.waterMeshRenderPass.setup();
    }

    public static initBoundingBox(): void {
        SkinningAnimation.boundingBoxRenderPass.setIndexBufferData(SkinningAnimation.boundingBox.indicesFlat());
        SkinningAnimation.boundingBoxRenderPass.addAttribute("vertPosition",
            4,
            SkinningAnimation.ctx.FLOAT,
            false,
            4 * Float32Array.BYTES_PER_ELEMENT,
            0,
            undefined,
            SkinningAnimation.boundingBox.positionsFlat());

        SkinningAnimation.boundingBoxRenderPass.addUniform("uWorld",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.boundingBox.getModelMatrix().all()));
            });
        SkinningAnimation.boundingBoxRenderPass.addUniform("uProj",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.gui.projMatrix().all()));
            });
        SkinningAnimation.boundingBoxRenderPass.addUniform("uView",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(SkinningAnimation.gui.viewMatrix().all()));
            });

        SkinningAnimation.boundingBoxRenderPass.setDrawData(SkinningAnimation.ctx.LINES, SkinningAnimation.boundingBox.indicesFlat().length, SkinningAnimation.ctx.UNSIGNED_INT, 0);
        SkinningAnimation.boundingBoxRenderPass.setup();
    }

    public static getDeltaTime(): number {
        return SkinningAnimation.deltaT;
    }

    /** @internal
     * Draws a single frame
     *
     */
    public draw(): void {
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
        const gl: WebGLRenderingContext = this.ctx;
        const bg: Vec4 = this.backgroundColor;
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
    private bucketizeParticles(bbox: BBox, particles: Particle[]): Particle[][][] {
        const numRows = WaterMesh.numRows;
        const numCols = WaterMesh.numCols;
        const particleArr: Particle[][][] = [];
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

    private drawScene(x: number, y: number, width: number, height: number): void {
        const gl: WebGLRenderingContext = this.ctx;
        gl.viewport(x, y, width, height);

        if (SkinningAnimation.renderParticles)
            Particle.renderPass.draw();
        if (SkinningAnimation.renderMesh)
            this.waterMeshRenderPass.draw();
        // this.debugRayRenderPass.draw();
        SkinningAnimation.boundingBoxRenderPass.draw();

    }

    public getGUI(): GUI {
        return this.gui;
    }

    /**
     * Loads and sets the scene from a Collada file
     * @param fileLocation URI for the Collada file
     */
    public setScene(fileLocation: string): void {
        this.loadedScene = fileLocation;
        // this.scene = new CLoader(fileLocation);
        // this.scene.load(() => this.initScene());
        this.initScene();
    }
}

export function initializeCanvas(): void {
    const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.95;
    console.log(canvas.width, canvas.height);
    /* Start drawing */
    const canvasAnimation: SkinningAnimation = new SkinningAnimation(canvas, 6);
    canvasAnimation.start();
    canvasAnimation.setScene("./static/assets/fisiks/split_cube.dae");
}
