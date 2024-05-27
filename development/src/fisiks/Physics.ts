import { Vec3 } from "../lib/TSM.js";
import { Particle } from "./Particle.js";
import { BBox } from "./BBox.js";

export class Physics {

    private static particleProperties: Vec3[] = [];
    private static density: number[] = [];
    public static pressureMultiplier: number = 0.2;
    public static targetDensity: number = 2;
    public static bounceFallOff: number = 0.5;
    public static dragRadius: number = 1.5;
    public static dragForce: number = 0.2;

    public static GRAVITY = 1.0;

    public static clamp(value: number, min: number, max: number) {
        return Math.max(Math.min(value, max), min);
    }

    public static simulationStep(deltaTime: number, particles: Particle[], boundingBox: BBox) {
        deltaTime = Math.min(deltaTime, 1 / 60);
        this.density = [];
        let predictedPositions : Vec3[] = [];

        for (let i = 0; i < particles.length; i++){
            let particle = particles[i];
            let vel = particle.velocity.scale(1/120, new Vec3());
            predictedPositions[i] = particle.position.add(vel, new Vec3())
        }

        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
            // particle.velocity.add(new Vec3([0, -1, 0]).scale(this.GRAVITY * deltaTime));
            particle.acceleration.add(new Vec3([0, -1, 0]).scale(this.GRAVITY * deltaTime));
            this.density[i] = this.calculateDensity(predictedPositions[i], particles);
        }

        for (let i = 0; i < particles.length; i++) {
            let pressureForce: Vec3 = this.calculatePressureForce(i, particles);
            let pressureAcc: Vec3 = pressureForce.scale(1 / this.density[i], new Vec3());
            particles[i].acceleration.add(pressureAcc.scale(deltaTime, new Vec3()))
            particles[i].velocity.add(pressureAcc.scale(deltaTime, new Vec3()));
        }

        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
            particle.velocity.scale(deltaTime);
            // particle.position.add(particle.velocity.scale(deltaTime, new Vec3()));
            this.resolveCollisions(particle, boundingBox);
        }
    }

    //set particle properties
    public static setParticles(particles: Particle[]) {
        for (const particle of particles) {
            this.particleProperties.push(particle.getPosition());
        }
    }

    //convert desnity to pressure
    public static densityToPressure(density: number): number {
        let densityError = density - this.targetDensity;
        let pressure = densityError * this.pressureMultiplier;
        return pressure
    }

    // Probably call this at the start of every frame
    public static updateDensities(particles: Particle[]) {
        for (const position of this.particleProperties) {
            this.density.push(this.calculateDensity(position, particles))
        }
    }

    //smoothing term for density calculations
    public static smoothingKernel(radius: number, dist: number): number {
        //want the volume to stay the same so integrate over the smoothing radius and divide the kernel
        //value by the volume
        if (dist >= radius) {
            return 0;
        }
        let volume = (Math.PI * Math.pow(radius, 4)) / 6;
        return (radius - dist) ** 2 / volume;
    }

    public static smoothingKernelDerivative(radius: number, dist: number): number {
        if (dist >= radius) return 0;

        let scale = 12 / (Math.PI * Math.pow(radius, 4));
        return (dist - radius) * scale;
    }

    //given a particular point in the world, calculate the density of the particles
    public static calculateDensity(samplePoint: Vec3, particles: Particle[]): number {
        let density = 0;
        const mass = Particle.mass;

        for (const particle of particles) {
            let pos = particle.getPosition();

            let dst = pos.subtract(samplePoint, new Vec3()).length();
            let influence = this.smoothingKernel(1, dst);
            density += mass * influence;
        }

        return density;
    }

    //given a particular point in the world, calculate the specific property of the particles
    public static calculateProperty(samplePoint: Vec3, particles: Particle[]): number {
        let property = 0;
        const mass = Particle.mass;

        for (let i = 0; i < particles.length; i++) {
            let pos = particles[i].getPosition();

            let dst = pos.subtract(samplePoint, new Vec3()).length();
            let influence = this.smoothingKernel(1, dst);
            let density = this.calculateDensity(pos, particles);
            if (density == 0) {
                console.log("DIVIDE BY 0");
            }
            // Replace 1 with interested property
            property += ((1)) * influence * mass / density;
        }

        return property;
    }

    public static calculatePressureForce(particleIndex: number, particles: Particle[]): Vec3 {
        let propertyForce = new Vec3([0, 0, 0]);
        const mass = Particle.mass;

        for (let i = 0; i < particles.length; i++) {
            if (particleIndex == i) continue;

            let offset: Vec3 = particles[i].getPosition().subtract(particles[particleIndex].getPosition());

            let dst = offset.length();
            let dir = offset;
            //if distance is less than some epsilon, we set a random direction
            if (dst < 0.001){
                let x = Math.random();
                let y = Math.random();
                let z = Math.random();
                dir = new Vec3([x,y,z]);
            }
            dir.normalize();
            let slope = this.smoothingKernelDerivative(particles[i].radius * 2, dst);
            let density = this.density[i];

            const sharedPressure = Physics.calculateSharedPressure(density, this.density[particleIndex])
            propertyForce.add(dir.scale(sharedPressure * slope * mass / density, new Vec3()));
        }

        return propertyForce;
    }

    public static calculateSharedPressure(densityA: number, densityB: number): number {
        let pressureA = this.densityToPressure(densityA);
        let pressureB = this.densityToPressure(densityB);
        return (pressureA + pressureB) / 2;
    }

    //interactions
    public static interactionForce(index: number, inputDir: Vec3, radius:number, strength: number, particle : Particle) : Vec3{
        let interactionForce :Vec3 = new Vec3();
        const scale = Vec3.dot(particle.position, inputDir) / inputDir.squaredLength();
        const projectionVec = inputDir.scale(scale, new Vec3());
        // Add to origin for actual point (position + vector = position)
        // Do radius check
        const projectionOrthoVec = projectionVec.subtract(particle.position, new Vec3());
        let offset : Vec3 = projectionOrthoVec;
        let sqrdst : number = Vec3.dot(offset, offset);

        if (sqrdst < radius ** 2){
            let dst = Math.sqrt(sqrdst);
            let dirToInputPoint : Vec3 = dst <= 0.001 ? new Vec3() : offset.scale(1/dst, new Vec3());

            let center = 1 - dst/radius;
            let new_vel = particle.velocity.scale(center, new Vec3());
            interactionForce.add(dirToInputPoint.scale(strength, new Vec3()).subtract(new_vel, new Vec3()));
            interactionForce.scale(1/ this.density[index]);
        }

        return interactionForce;
    }

    public static resolveCollisions(particle: Particle, boundingBox: BBox): void {
        let testPos = particle.position.add(particle.velocity, new Vec3());
        testPos.add(particle.acceleration.scale(0.5, new Vec3()));
        const collisionBounds = boundingBox.isPositionInside(testPos, particle.radius);
        // Check X Bounds
        if (collisionBounds[0] == -1) {
            particle.velocity.x *= -1;
            particle.acceleration.x *= -Physics.bounceFallOff;
            particle.position.x = boundingBox.getMinX() + particle.radius;
        } else if (collisionBounds[0] == 1) {
            particle.velocity.x *= -1;
            particle.acceleration.x *= -Physics.bounceFallOff;
            particle.position.x = boundingBox.getMaxX() - particle.radius;
        }
        // Check Y Bounds
        if (collisionBounds[1] == -1) {
            particle.velocity.y *= -1;
            particle.acceleration.y *= -Physics.bounceFallOff;
            particle.position.y = boundingBox.getMinY() + particle.radius;
        } else if (collisionBounds[1] == 1) {
            particle.velocity.y *= -1;
            particle.acceleration.y *= -Physics.bounceFallOff;
            particle.position.y = boundingBox.getMaxY() - particle.radius;
        }
        // Check Z Bounds
        if (collisionBounds[2] == -1) {
            particle.velocity.z *= -1;
            particle.acceleration.z *= -Physics.bounceFallOff;
            particle.position.z = boundingBox.getMinZ() + particle.radius;
        } else if (collisionBounds[2] == 1) {
            particle.velocity.z *= -1;
            particle.acceleration.z *= -Physics.bounceFallOff;
            particle.position.z = boundingBox.getMaxZ() - particle.radius;
        }
        particle.position.add(particle.velocity);
        particle.position.add(particle.acceleration.scale(0.5, new Vec3()));
    }
}

