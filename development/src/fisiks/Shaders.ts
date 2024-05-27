// For my Rendering Extension
const glsl = x => x;

//rendering the bounding box
export const BBoxVSText = glsl`
    precision mediump float;

    attribute vec3 vertPosition;

    uniform mat4 uWorld;
    uniform mat4 uView;
    uniform mat4 uProj;
    

    void main () {
        gl_Position = uProj * uView * uWorld * vec4(vertPosition, 1.0);
    }
`;

//rendering the bounding box fragment shader
export const BBoxFSText = glsl`
    precision mediump float;

    varying vec4 normal;
    varying vec3 position;

    void main () {
        gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
    }
`;

//rendering particles
export const ParticleVSText = glsl`
    precision mediump float;

    attribute vec3 vertPosition;
    attribute float vertIndex;
    attribute vec3 aNorm;

    uniform mat4 uWorld;
    uniform mat4 uView;
    uniform mat4 uProj;
    uniform vec4 lightPosition;

    //here we have the particle translations that represent the translational position of each particle
    uniform mat4 particleTranslations[343];
    uniform float particleVelocities[343];
    uniform float num_per_index; // Vertices per Sphere/Particle
    
    varying vec3 surfaceNormal;
    varying vec4 lightDir;
    varying float velocity;

    void main () {
        int vIndex = int(vertIndex) / int(num_per_index);
        mat4 myTranslation = particleTranslations[vIndex];

        gl_Position = uProj * uView * uWorld * myTranslation * vec4(vertPosition, 1.0);
        
        //  Compute light direction (world coordinates)
        lightDir = lightPosition - vec4(vertPosition, 1.0);
        velocity = particleVelocities[vIndex];
        surfaceNormal = aNorm;
    }
`;

//rendering particle color with diffuse term
export const ParticleFSText = glsl`
    precision mediump float;

    varying vec3 surfaceNormal;
    varying vec3 position;
    varying vec4 lightDir;
    varying float velocity;

    void main () {
        vec4 n = vec4(surfaceNormal, 0.0);
        vec4 l = normalize(lightDir);
        // Normalize needed for proper theta calculation
        float redFactor = clamp(velocity, 0.0, 1.0);
        float diffuse = clamp(dot(n, l) + redFactor * 0.25, 0.4, 1.0);
        // gl_FragColor = vec4(vec3(redFactor, 1.0 - redFactor, 1.0 - redFactor) * diffuse, 1.0);
        gl_FragColor = vec4(vec3(redFactor, 1.0, 1.0) * diffuse, 1.0);
    }
`;

export const debugRayVSText = glsl`
    precision mediump float;

    uniform mat4 uWorld;
    uniform mat4 uView;
    uniform mat4 uProj;
    
    uniform vec4 positionVertices[2];
    attribute float vertIndex;

    void main () {
        int vIndex = int(vertIndex);
        gl_Position = uProj * uView * uWorld * vec4(positionVertices[vIndex].xyz, 1.0);
    }
`;

export const debugRayFSText = glsl`
    precision mediump float;

    void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
`;

export const WaterVSText = glsl`
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 aNorm;

    uniform mat4 uWorld;
    uniform mat4 uView;
    uniform mat4 uProj;
    uniform vec4 lightPosition;
    
    varying vec3 normal;
    varying vec4 lightDir;

    void main () {
        gl_Position = uProj * uView * uWorld * vec4(vertPosition, 1.0);
        normal = aNorm;
        lightDir = lightPosition - vec4(vertPosition, 1.0);
    }
`;

export const WaterFSText = glsl`
    precision mediump float;

    varying vec3 normal;
    varying vec4 lightDir;

    void main () {
        vec4 n = vec4(normal, 0.0);
        vec4 l = normalize(lightDir);
        // Normalize needed for proper theta calculation
        float diffuse = clamp(dot(n, l), 0.4, 1.0);
        gl_FragColor = vec4(vec3(0.0, 0.8, 1.0) * diffuse, 1.0);
    }
`;