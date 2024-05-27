# Fisiks
A particle-based fluid simulation developed using TypeScript and WebGL. This project models realistic fluid dynamics and features interactive controls for a dynamic and engaging user experience.

This project was made for CS 354: Computer Graphics as the Final Project.
## Authors
- [@EmperorBob7](https://github.com/EmperorBob7/)
- [@AragusSM](https://github.com/AragusSM/)


## Demo

The project can be seen live here: [https://emperorbob7.github.io/Fisiks/](https://emperorbob7.github.io/Fisiks/)
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


## Project Report
Can be accessed in the "FISIKS Report.pdf" file.
