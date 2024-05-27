# Fisiks
A particle-based fluid simulation developed using TypeScript and WebGL. This project models realistic fluid dynamics and features interactive controls for a dynamic and engaging user experience.

This project was made for CS 354: Computer Graphics as the Final Project.
## Authors
- [@EmperorBob7](https://github.com/EmperorBob7/)
- [@AragusSM](https://github.com/AragusSM/)


## Demo

The project can be seen live here: [https://emperorbob7.github.io/Fisiks/](https://emperorbob7.github.io/Fisiks/)
## Project Report
Can be accessed in the [FISIKS Report.pdf](https://github.com/EmperorBob7/Fisiks/blob/main/FISIKS%20Report.pdf) file.

Report includes images, sources used, challenges we faced, the planning process, and explanations on some of the features.
## Features
- Fluid Dynamics: Implements particle-based algorithms for accurate fluid behavior.
- Interactive Controls: Adjust physics constants and interact with the fluid particles in real-time.
- Dynamic Mesh: Visualizes fluid movement with a dynamic mesh for enhanced graphical representation.
- WebGL Rendering: Utilizes WebGL for efficient 3D rendering in the web.
## Controls
- **Key K** can be used to reset the simulation without restarting the Camera
- **Key R** can be used to fully reset the simulation, Camera included
- **Key T** can be used to toggle between User Interaction mode. If you are toggled in the camera stops rotating and you can drag the particles (Dependent on Drag Force and Drag Radius.)
## Installation

Install with Git

```bash
  git clone https://github.com/EmperorBob7/Fisiks.git
  cd Fisiks
```
## Run Locally

Go to the development directory

```bash
  cd development
```

Ensure Python is installed and run the build code

```bash
  python make-fisiks.py
```

Start the server (Alternatively, install http-server globally)

```bash
  npm i http-server
  http-server dist -c 1
```


## Mini Report
The following is a heavily condensed version of our actual report.
### Background
Fluids and other particle systems in games and graphics have remained a challenge to simulate. We hope to apply physics to many particles interacting with each other in order to simulate the movement of fluids. Our goal is to create different fluids with different parameters (like water, air, fire, etc.) but in lieu of time a good objective is to model a simple fluid within OpenGL, allowing the user to define parameters such as pressure and density.

Fluids have many distinct properties such as gravity, cohesion and adhesion, the tendency to diffuse in order to evenly distribute density, Navier forces, etc. Implementing a system of particles to observe all of these effects is a daunting challenge. 
### Issues Encountered
- When rendering the spheres, we need to set the renderpass as one renderpass, otherwise the time efficiency is too slow. To accomplish this, we assigned each particle an index and rendered them with a position based on that index.
- We tried various methods to move particles, one of which was trying to update the positions in the shader using deltaTime. This proved unsuccessful because the shader doesn’t remember the previous position of the particle.
- When passing in our transformation matrices to the vertex shader, we needed to be able to index it, and when we were indexing into it we miscalculated the vertices by a magnitude of 3, which caused many issues for us until we realized that we weren’t doing / 3.
- We weren’t able to get smooth shading enabled for our Water Mesh as mentioned above in the “Completions” section.
