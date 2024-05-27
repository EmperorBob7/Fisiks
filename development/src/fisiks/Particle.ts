import { Mat4, Quat, Vec3, Vec4 } from "../lib/TSM.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { SkinningAnimation } from "./App.js";
import { BBox } from "./BBox.js";
import { GUI } from "./Gui.js";
import { BBoxFSText, BBoxVSText, ParticleFSText, ParticleVSText } from "./Shaders.js";

//Class for Bounding Box
export class Particle {
    private static SPHERE_DIV = 4;
    public position: Vec3;
    public radius: number;
    public velocity: Vec3;
    public acceleration: Vec3;
    public static mass: number = 1.0;

    private static lastIndex: number = -1;
    private static geometryFlat: number[] = [];
    private static normalFlat: number[] = [];
    private static indexFlat: number[] = [];
    private static modelMatrix: Mat4 = new Mat4().setIdentity();
    private static particleList: number[] = [];
    // For Updating Position
    private startIndex: number;

    public static renderPass: RenderPass;

    public static reset() {
        Particle.lastIndex = -1;
        Particle.geometryFlat = [];
        Particle.normalFlat = [];
        Particle.indexFlat = [];
        Particle.particleList = [];
        Particle.modelMatrix = new Mat4().setIdentity();
    }

    constructor(position: Vec3, radius: number) {
        const SPHERE_DIV = Particle.SPHERE_DIV;
        this.startIndex = Particle.geometryFlat.length;
        for (let j = 0; j <= SPHERE_DIV; j++) {
            let aj = j * Math.PI / SPHERE_DIV;
            let sj = Math.sin(aj);
            let cj = Math.cos(aj);
            for (let i = 0; i <= SPHERE_DIV; i++) {
                let ai = i * 2 * Math.PI / SPHERE_DIV;
                let si = Math.sin(ai);
                let ci = Math.cos(ai);

                Particle.geometryFlat.push((radius * si * sj));  // X
                Particle.geometryFlat.push((radius * cj));       // Y
                Particle.geometryFlat.push((radius * ci * sj));  // Z

                Particle.normalFlat.push(si * sj);
                Particle.normalFlat.push(cj);
                Particle.normalFlat.push(ci * sj);
            }
        }

        // Indices
        let baseIndex = Particle.lastIndex + 1;
        for (let j = 0; j < SPHERE_DIV; j++) {
            for (let i = 0; i < SPHERE_DIV; i++) {
                let p1 = baseIndex + j * (SPHERE_DIV + 1) + i;
                let p2 = p1 + (SPHERE_DIV + 1);

                Particle.indexFlat.push(p1);
                Particle.indexFlat.push(p2);
                Particle.indexFlat.push(p1 + 1);

                Particle.indexFlat.push(p1 + 1);
                Particle.indexFlat.push(p2);
                Particle.indexFlat.push(p2 + 1);

                Particle.lastIndex = Math.max(Particle.lastIndex, p2 + 1);
            }
        }

        this.position = position;
        this.radius = radius;
        this.velocity = new Vec3([0, 0, 0]);
        this.acceleration = new Vec3([0, -0.5, 0]);
    }

    public getPosition(): Vec3 {
        return this.position.copy();
    }


    public updatePosition() {
        const SPHERE_DIV = Particle.SPHERE_DIV;
        let geometryIndex = this.startIndex;
        for (let j = 0; j <= Particle.SPHERE_DIV; j++) {
            let aj = j * Math.PI / SPHERE_DIV;
            let sj = Math.sin(aj);
            let cj = Math.cos(aj);
            for (let i = 0; i <= SPHERE_DIV; i++) {
                let ai = i * 2 * Math.PI / SPHERE_DIV;
                let si = Math.sin(ai);
                let ci = Math.cos(ai);

                Particle.geometryFlat[geometryIndex++] = (this.position.x + (this.radius * si * sj));  // X
                Particle.geometryFlat[geometryIndex++] = (this.position.y + (this.radius * cj));       // Y
                Particle.geometryFlat[geometryIndex++] = (this.position.z + (this.radius * ci * sj));  // Z
            }
        }

    }

    public modelMatrix(): number[] {
        // Performance Gain
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            this.position.x, this.position.y, this.position.z, 1
        ];
    }

    public getVelocityArr(): number[] {
        return this.velocity.xyz;
    }

    public getVelocityMagnitude(): number {
        return this.velocity.length();
    }

    /**
     * Check if the Particle is close to a given position on the XZ plane.
     */
    public isCloseToXZ(position: Vec3, maxDistance: number): boolean {
        let myPosXZ = this.getPosition();
        myPosXZ.y = 0;

        const distance = Vec3.difference(position, myPosXZ).length();
        return distance <= maxDistance;
    }

    public static positionsFlat(): Float32Array {
        return new Float32Array(Particle.geometryFlat);
    }

    public static indicesFlat(): Uint32Array {
        return new Uint32Array(Particle.indexFlat);
    }

    public static normalsFlat(): Float32Array {
        return new Float32Array(Particle.normalFlat);
    }

    public static getModelMatrix(): Mat4 {
        return Particle.modelMatrix;
    }

    public static initRenderPass(extVAO: OES_vertex_array_object, gl: WebGLRenderingContext, gui: GUI, lightPosition: Vec4): void {
        Particle.renderPass = new RenderPass(extVAO, gl, ParticleVSText, ParticleFSText);
        console.log(Particle.positionsFlat());
        Particle.renderPass.setIndexBufferData(Particle.indicesFlat());

        let numVertices = Particle.geometryFlat.length / 3;
        let vertArr: number[] = [];
        for (let i = 0; i < numVertices; i++) {
            vertArr.push(i);
        }

        Particle.renderPass.addAttribute("vertPosition",
            3,
            gl.FLOAT,
            false,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0,
            undefined,
            Particle.positionsFlat());

        Particle.renderPass.addAttribute("vertIndex",
            1,
            gl.FLOAT,
            false,
            1 * Float32Array.BYTES_PER_ELEMENT,
            0,
            undefined,
            new Float32Array(vertArr));

        Particle.renderPass.addAttribute("aNorm", 3, gl.FLOAT, false,
            3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, Particle.normalsFlat());
        Particle.renderPass.addUniform("num_per_index", (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
            gl.uniform1f(loc, (Particle.SPHERE_DIV + 1) * (Particle.SPHERE_DIV + 1));
        });
        Particle.renderPass.addUniform("lightPosition",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniform4fv(loc, lightPosition.xyzw);
            });
        Particle.renderPass.addUniform("uWorld",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(Particle.getModelMatrix().all()));
            });
        Particle.renderPass.addUniform("uProj",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(gui.projMatrix().all()));
            });
        Particle.renderPass.addUniform("uView",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                gl.uniformMatrix4fv(loc, false, new Float32Array(gui.viewMatrix().all()));
            });
        Particle.renderPass.addUniform("particleTranslations",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                const matrices: number[] = [];
                SkinningAnimation.particles.forEach(particle => {
                    matrices.push(...particle.modelMatrix());
                });
                gl.uniformMatrix4fv(loc, false, new Float32Array(matrices));
            });
        Particle.renderPass.addUniform("particleVelocities",
            (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
                const velocities: number[] = [];
                SkinningAnimation.particles.forEach(particle => {
                    velocities.push(particle.getVelocityMagnitude() * 1000);
                });
                gl.uniform1fv(loc, new Float32Array(velocities));
            });
        Particle.renderPass.setDrawData(gl.TRIANGLES, Particle.indicesFlat().length, gl.UNSIGNED_INT, 0);
        Particle.renderPass.setup();
    }
}