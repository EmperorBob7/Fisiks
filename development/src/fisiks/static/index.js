import { SkinningAnimation } from "./fisiks/App.js";
import { Physics } from "./fisiks/Physics.js";
import { WaterMesh } from "./fisiks/WaterMesh.js";
import "./fisiks/index.js";

const pressureInput = document.querySelector("#pressureInput");
const densityInput =  document.querySelector("#densityInput");
const bounceInput = document.querySelector("#bounceInput");
const dragForceInput = document.querySelector("#dragForceInput");
const dragRadiusInput = document.querySelector("#dragRadiusInput");
pressureInput.addEventListener("input", (e) => {
    document.querySelector("#pressureDisplay").innerText = pressureInput.value;
    Physics.pressureMultiplier = pressureInput.value;
});

densityInput.addEventListener("input", () => {
    document.querySelector("#densityDisplay").innerText = densityInput.value;
    Physics.targetDensity = densityInput.value;
});

bounceInput.addEventListener("input", () => {
    document.querySelector("#bounceDisplay").innerText = bounceInput.value;
    Physics.bounceFallOff = bounceInput.value;
});

dragForceInput.addEventListener("input", () => {
    document.querySelector("#dragForceDisplay").innerText = dragForceInput.value;
    Physics.dragForce = dragForceInput.value;
});

dragRadiusInput.addEventListener("input", () => {
    document.querySelector("#dragRadiusDisplay").innerText = dragRadiusInput.value;
    Physics.dragRadius = dragRadiusInput.value;
});

const xPosInput = document.querySelector("#xPosInput");
const yPosInput = document.querySelector("#yPosInput");
const zPosInput = document.querySelector("#zPosInput");
xPosInput.addEventListener("input", () => {
    document.querySelector("#xPosDisplay").innerText = xPosInput.value;
    SkinningAnimation.xPos = xPosInput.value;
    SkinningAnimation.updateBBox();
});
yPosInput.addEventListener("input", () => {
    document.querySelector("#yPosDisplay").innerText = yPosInput.value;
    SkinningAnimation.yPos = yPosInput.value;
    SkinningAnimation.updateBBox();
});
zPosInput.addEventListener("input", () => {
    document.querySelector("#zPosDisplay").innerText = zPosInput.value;
    SkinningAnimation.zPos = zPosInput.value;
    SkinningAnimation.updateBBox();
});

const xNegInput = document.querySelector("#xNegInput");
const yNegInput = document.querySelector("#yNegInput");
const zNegInput = document.querySelector("#zNegInput");
xNegInput.addEventListener("input", () => {
    document.querySelector("#xNegDisplay").innerText = xNegInput.value;
    SkinningAnimation.xNeg = -xNegInput.value;
    SkinningAnimation.updateBBox();
});
yNegInput.addEventListener("input", () => {
    document.querySelector("#yNegDisplay").innerText = yNegInput.value;
    SkinningAnimation.yNeg = -yNegInput.value;
    SkinningAnimation.updateBBox();
});
zNegInput.addEventListener("input", () => {
    document.querySelector("#zNegDisplay").innerText = zNegInput.value;
    SkinningAnimation.zNeg = -zNegInput.value;
    SkinningAnimation.updateBBox();
});

const meshSubdivisionInput = document.querySelector("#meshSubdivisionInput");
meshSubdivisionInput.addEventListener("input", () => {
    document.querySelector("#meshSubdivisionDisplay").innerText = meshSubdivisionInput.value;
    WaterMesh.meshSubdivisions = meshSubdivisionInput.value;
    WaterMesh.numRows = meshSubdivisionInput.value;
    WaterMesh.numCols = meshSubdivisionInput.value;
});

const renderParticleInput = document.querySelector("#renderParticlesInput");
renderParticleInput.addEventListener("change", () => {
    SkinningAnimation.renderParticles = renderParticleInput.checked;
});
const renderMeshInput = document.querySelector("#renderMeshInput");
renderMeshInput.addEventListener("change", () => {
    SkinningAnimation.renderMesh = renderMeshInput.checked;
});