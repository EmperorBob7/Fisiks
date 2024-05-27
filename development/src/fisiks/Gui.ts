import { Camera } from "../lib/webglutils/Camera.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { SkinningAnimation } from "./App.js";
import { Mat4, Vec3, Vec4, Vec2, Mat2, Quat } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Physics } from "./Physics.js";

/**
 * Might be useful for designing any animation GUI
 */
interface IGUI {
    viewMatrix(): Mat4;
    projMatrix(): Mat4;
    dragStart(me: MouseEvent): void;
    drag(me: MouseEvent): void;
    dragEnd(me: MouseEvent): void;
    onKeydown(ke: KeyboardEvent): void;
}

export enum Mode {
    playback,
    edit
}

function rayCylinderIntersect(rayOriginFull: Vec3, r: number, rayDir: Vec3, height: number): number {
    const circleCenter = new Vec2([0, 0]);
    const rayOrigin2D = new Vec2([rayOriginFull.x, rayOriginFull.z]);
    const toOrigin = circleCenter.subtract(rayOrigin2D, new Vec2());
    const rayDir2D = new Vec2([rayDir.x, rayDir.z]);

    // Literally just projection formula
    const scale = Vec2.dot(toOrigin, rayDir2D) / rayDir2D.squaredLength();
    const projectionVec = rayDir2D.scale(scale, new Vec2());
    // Add to origin for actual point (position + vector = position)
    const closestPoint = rayOrigin2D.add(projectionVec, new Vec2());
    // Do radius check
    const projectionOrthoVec = closestPoint.subtract(circleCenter, new Vec2());
    const flattenedLength = projectionOrthoVec.length();

    // console.log("DISTANCE", flattenedLength);
    if (flattenedLength <= r) {
        // Now get the position in 3D
        const rayDirScaled = rayDir.scale(scale, new Vec3());
        const actualClosest = rayOriginFull.add(rayDirScaled, new Vec3());
        if (actualClosest.y <= height && actualClosest.y > 0) {
            return scale;
        }
    }

    if (Math.abs(rayDir.y) > 0.99) {
        // End Caps Check
        // Bottom Cap
        const scaleToBottom = (-rayOriginFull.y) / rayDir.y;
        const rayPosAtBottom = rayOriginFull.add(rayDir.scale(scaleToBottom, new Vec3()), new Vec3());
        const distanceToBottom = Math.sqrt(Math.pow(rayPosAtBottom.x, 2) + Math.pow(rayPosAtBottom.z, 2));
        if (distanceToBottom <= r) {
            return scaleToBottom;
        }

        const scaleToTop = (height - rayOriginFull.y) / rayDir.y;
        const rayPosAtTop = rayOriginFull.add(rayDir.scale(scaleToTop, new Vec3()), new Vec3());
        const distanceToTop = Math.sqrt(Math.pow(rayPosAtTop.x, 2) + Math.pow(rayPosAtTop.z, 2));
        if (distanceToTop <= r) {
            return scaleToTop;
        }
    }
    return -1;
}

/**
 * Handles Mouse and Button events along with
 * the the camera.
 */

export class GUI implements IGUI {
    private static readonly rotationSpeed: number = 0.05;
    private static readonly zoomSpeed: number = 0.5;
    private static readonly rollSpeed: number = 0.1;
    private static readonly panSpeed: number = 0.1;

    private camera: Camera;
    private dragging: boolean;
    private fps: boolean;
    private prevX: number;
    private prevY: number;

    private height: number;
    private viewPortHeight: number;
    private width: number;
    private toggle : boolean;

    private animation: SkinningAnimation;

    public time: number;
    public mode: Mode;


    public hoverX: number = 0;
    public hoverY: number = 0;


    /**
     *
     * @param canvas required to get the width and height of the canvas
     * @param animation required as a back pointer for some of the controls
     * @param sponge required for some of the controls
     */
    constructor(canvas: HTMLCanvasElement, animation: SkinningAnimation) {
        this.height = canvas.height;
        this.viewPortHeight = this.height;
        this.width = canvas.width;
        this.prevX = 0;
        this.prevY = 0;

        this.animation = animation;

        this.reset();

        this.registerEventListeners(canvas);
    }

    public getTime(): number {
        return this.time;
    }

    /**
     * Resets the state of the GUI
     */
    public reset(): void {
        this.fps = false;
        this.dragging = false;
        this.time = 0;
        this.mode = Mode.edit;
        this.toggle = false;

        this.camera = new Camera(
            new Vec3([3, 10, -10]),
            new Vec3([0, 0, 0]),
            new Vec3([0, 1, 0]),
            45,
            this.width / this.viewPortHeight,
            0.1,
            1000.0
        );
    }

    /**
     * Sets the GUI's camera to the given camera
     * @param cam a new camera
     */
    public setCamera(
        pos: Vec3,
        target: Vec3,
        upDir: Vec3,
        fov: number,
        aspect: number,
        zNear: number,
        zFar: number
    ) {
        this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
    }

    /**
     * Returns the view matrix of the camera
     */
    public viewMatrix(): Mat4 {
        return this.camera.viewMatrix();
    }

    /**
     * Returns the projection matrix of the camera
     */
    public projMatrix(): Mat4 {
        return this.camera.projMatrix();
    }

    /**
     * Callback function for the start of a drag event.
     * @param mouse
     */
    public dragStart(mouse: MouseEvent): void {
        if (mouse.offsetY > 600) {
            // outside the main panel
            return;
        }

        this.dragging = true;
        this.prevX = mouse.screenX;
        this.prevY = mouse.screenY;
    }

    /**
     * Converts a position vector into world space
     */
    private unprojectWorld(position: Vec4): Vec4 {
        const projMat = this.projMatrix(); // P
        const viewMat = this.viewMatrix(); // V
        const invertedV = viewMat.inverse(new Mat4()); // V^-1
        const invertedP = projMat.inverse(new Mat4()); // P^-1

        let cameraVec = invertedP.multiplyVec4(position); // Camera Space N
        cameraVec = cameraVec.scale(1 / cameraVec.w);
        let worldVec = invertedV.multiplyVec4(cameraVec); // World Space
        worldVec = worldVec.scale(1 / worldVec.w);
        return worldVec;
    }

    private areParallel(v1: Vec3, v2: Vec3): boolean {
        // Normalize the vectors
        const normalizedV1 = v1.normalize(new Vec3());
        const normalizedV2 = v2.normalize(new Vec3());

        // Check if the cross product of the two vectors is the zero vector
        const crossProduct = Vec3.cross(normalizedV1, normalizedV2);
        return crossProduct.x === 0 && crossProduct.y === 0 && crossProduct.z === 0;
    }


    /**
     * The callback function for a drag event.
     * This event happens after dragStart and
     * before dragEnd.
     * @param mouse
     */
    public drag(mouse: MouseEvent): void {
        const xPos = 2 * mouse.offsetX / this.width - 1;
        const yPos = 2 * (this.viewPortHeight - mouse.offsetY) / this.viewPortHeight - 1;
        // Get to World Space
        const worldSpaceEnd = this.unprojectWorld(new Vec4([xPos, yPos, 1, 1]));
        const worldSpaceStart = this.unprojectWorld(new Vec4([xPos, yPos, 0, 1]));

        const endPosition = new Vec3(worldSpaceEnd.xyz); // World Space
        const startPosition = new Vec3(worldSpaceStart.xyz);
        // Create Ray
        const ray = endPosition.subtract(startPosition, new Vec3()).normalize();

        if (this.dragging) {
            const dx = mouse.screenX - this.prevX;
            const dy = mouse.screenY - this.prevY;
            this.prevX = mouse.screenX;
            this.prevY = mouse.screenY;

            /* Left button, or primary button */
            const mouseDir: Vec3 = this.camera.right();
            mouseDir.scale(-dx);
            mouseDir.add(this.camera.up().scale(dy));
            mouseDir.normalize();

            if (dx === 0 && dy === 0) {
                return;
            }


            if (this.toggle){
                let particles = this.animation.getParticles()
                for (let i = 0; i < particles.length; i++){
                    let interactionForce = Physics.interactionForce(i, ray, Physics.dragRadius, Physics.dragForce, particles[i]);
                    particles[i].acceleration.add(interactionForce);
                }
            }else{
                switch (mouse.buttons) {
                    case 1: {
                        
                        let rotAxis: Vec3 = Vec3.cross(this.camera.forward(), mouseDir);
                        rotAxis = rotAxis.normalize();
    
                        if (this.fps) {
                            this.camera.rotate(rotAxis, GUI.rotationSpeed);
                        } else {
                            this.camera.orbitTarget(rotAxis, GUI.rotationSpeed);
                        }
                        break;
                    }
                    case 2: {
                        /* Right button, or secondary button */
                        this.camera.offsetDist(Math.sign(mouseDir.y) * GUI.zoomSpeed);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
            

            
            return;
        }
        this.animation.debugRay.setPosition(startPosition, endPosition);
    }

    /**
     * Returns the position that the ray intersects the plane.
     * 
     * @param ray The Ray
     * @param planeNormal Normal to the plane (camera forward)
     * @param origin Ray Origin
     * @param Q Bone Endpoint (Any point on the plane)
     */
    private rayPlaneIntersect(ray: Vec3, planeNormal: Vec3, origin: Vec3, Q: Vec3): Vec3 {
        //pass in bone endpoint for Q
        let d: number = -1 * Vec3.dot(planeNormal, Q);
        let t: number = -1 * ((Vec3.dot(planeNormal, origin) + d) / (Vec3.dot(planeNormal, ray)));
        let finalQ: Vec3 = origin.add(ray.scale(t, new Vec3()), new Vec3());
        return finalQ;
    }

    /**
     * Axis is the normal of the plane
     */
    private angleBetweenVectorsRelativeToAxis(v1: Vec3, v2: Vec3, axis: Vec3): number {
        // Project vectors onto a plane perpendicular to the axis
        let planeNormal = axis.normalize(new Vec3());
        v1 = v1.normalize(new Vec3());
        v2 = v2.normalize(new Vec3());
        let v1Projected = v1.subtract(planeNormal.scale(Vec3.dot(v1, planeNormal), new Vec3()), new Vec3());
        let v2Projected = v2.subtract(planeNormal.scale(Vec3.dot(v2, planeNormal), new Vec3()), new Vec3());
        // Calculate the angle between the projected vectors
        return this.angleBetween(v1Projected, v2Projected, axis);
    }

    private angleBetween(vec1: Vec3, vec2: Vec3, axis: Vec3): number {
        const dot = Vec3.dot(vec1, vec2);
        const magnitudeProduct = vec1.length() * vec2.length();
        const cosAngle = dot / magnitudeProduct;

        let angle = Math.acos(cosAngle);

        const crossProduct = Vec3.cross(vec1, vec2);
        let dotProduct = Vec3.dot(crossProduct, axis);
        // Determine the sign of the angle using the cross product
        if (dotProduct < 0) {
            angle = -angle;
        }
        return angle;
    }

    public getModeString(): string {
        // switch (this.mode) {
        //     case Mode.edit: { return "edit: " + this.getNumKeyFrames() + " keyframes"; }
        //     case Mode.playback: { return "playback: " + this.getTime().toFixed(2) + " / " + this.getMaxTime().toFixed(2); }
        // }
        return "Unused";
    }

    /**
     * Callback function for the end of a drag event
     * @param mouse
     */
    public dragEnd(mouse: MouseEvent): void {
        this.dragging = false;
        this.prevX = 0;
        this.prevY = 0;

        // TODO: Handle ending highlight/dragging logic as needed

    }

    /**
     * Callback function for a key press event
     * @param key
     */
    public onKeydown(key: KeyboardEvent): void {
        switch (key.code) {
            case "KeyW": {
                this.camera.offset(
                    this.camera.forward().negate(),
                    GUI.zoomSpeed,
                    true
                );
                break;
            }
            case "KeyT": {
                if(this.toggle){
                    this.toggle = false;
                }else{
                    this.toggle = true;
                }
                break;
            }
            case "KeyA": {
                this.camera.offset(this.camera.right().negate(), GUI.zoomSpeed, true);
                break;
            }
            case "KeyS": {
                this.camera.offset(this.camera.forward(), GUI.zoomSpeed, true);
                break;
            }
            case "KeyD": {
                this.camera.offset(this.camera.right(), GUI.zoomSpeed, true);
                break;
            }
            case "KeyR": {
                this.animation.reset();
                break;
            }
            case "ArrowLeft": {
                this.camera.roll(GUI.rollSpeed, false);
                break;
            }
            case "ArrowRight": {
                this.camera.roll(GUI.rollSpeed, true);
                break;
            }
            case "ArrowUp": {
                this.camera.offset(this.camera.up(), GUI.zoomSpeed, true);
                break;
            }
            case "ArrowDown": {
                this.camera.offset(this.camera.up().negate(), GUI.zoomSpeed, true);
                break;
            }
            case "KeyK": {
                // Reset Simulation
                this.animation.resetParticles();
                break;
            }
            case "KeyP": {
                break;
            }
            default: {
                console.log("Key : '", key.code, "' was pressed.");
                break;
            }
        }
    }

    /**
     * Registers all event listeners for the GUI
     * @param canvas The canvas being used
     */
    private registerEventListeners(canvas: HTMLCanvasElement): void {
        /* Event listener for key controls */
        canvas.addEventListener("keydown", (key: KeyboardEvent) =>
            this.onKeydown(key)
        );

        /* Event listener for mouse controls */
        canvas.addEventListener("mousedown", (mouse: MouseEvent) =>
            this.dragStart(mouse)
        );

        canvas.addEventListener("mousemove", (mouse: MouseEvent) =>
            this.drag(mouse)
        );

        canvas.addEventListener("mouseup", (mouse: MouseEvent) =>
            this.dragEnd(mouse)
        );

        /* Event listener to stop the right click menu */
        canvas.addEventListener("contextmenu", (event: any) =>
            event.preventDefault()
        );
    }
}
