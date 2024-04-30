// Approach similar to seaScene.js
// More detialed comments in seaScene.js

import * as THREE from "three";
import GUI from './lil-gui.module.min.js';
import {OrbitControls} from './OrbitControls.js'

const vshader = `
uniform float waveTime;
uniform float waveFrequencyIndex;
uniform float waveSpeed;
uniform float waveSteep;
uniform float wavePeriod;
uniform float xWeight;
uniform float zWeight;

varying vec3 vPosition;
varying vec3 nNormal;

void main(){

    float x = position.x;
    float y = position.y;
    float z = position.z;
    float PI = 3.14159265;

    float sx = 0.0;
    float sy = 0.0;
    float sz = 0.0;

    vPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0); //v

    float waveLength = 0.0;
    float index = 1.0;
    vec2 dir;  // waveDirection
   
        for(int i = 0;i < 4; i++){
            waveLength = (waveLength + waveFrequencyIndex);
            index += 1.0;
            dir = vec2(xWeight, zWeight);
            float l1 = wavePeriod * PI / (waveLength);  
            float amp = waveSteep / l1;
            float waveSpd = waveSpeed * sqrt(9.8/l1); // wavespeed
            // Since the plane has rotated, z1 now represents vertical axis.
            float x1 = amp * cos(dot(normalize(dir)* l1,vec2(x,y)) + waveTime * waveSpd) * dir.x;
            float y1 = amp * cos(dot(normalize(dir)* l1,vec2(x,y)) + waveTime * waveSpd) * dir.y;
            float z1 = amp * sin(dot(normalize(dir)* l1,vec2(x,y)) + waveTime * waveSpd);
            sx += x1;
            sy += y1;
            sz += z1;

            vec3 tangent = vec3(1.0 - amp * sin(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.x) * normalize(dir).x,
            -amp * sin(dot(normalize(dir)* l1, vec2(x, y) ) + waveTime * waveSpd) * normalize(dir.y) * normalize(dir).x,
            amp * cos(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.x));
    
            vec3 bitangent = vec3(- amp * sin(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.y) * normalize(dir).x,
            1.0 - amp * sin(dot(normalize(dir)* l1, vec2(x, y))   + waveTime * waveSpd) * normalize(dir.y) * normalize(dir.x),
            amp * cos(dot(normalize(dir)* l1, vec2(x, y))  + waveTime * waveSpd) * normalize(dir.y));

            nNormal = vec3(cross(tangent, bitangent));
        }
        sx += x;
        sy += y;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(sx,sy,sz, 1.0);
}
`

const fshader = `
uniform vec3 directionalLightPosition;
varying vec3 vPosition;
varying vec3 nNormal;
void main(){  
    vec3 normal = nNormal;
    vec3 lightDir = normalize(directionalLightPosition - vPosition);
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float diffuse = dot(normal, lightDir); // Lambert 
    float specular = pow(max(0.0, dot(normal, halfwayDir)), 512.0); // Blinn Phong
    vec3 baseCol = vec3(0.2,0.5,0.8);
    gl_FragColor = vec4(baseCol, 1) + diffuse + specular;
}
`

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );

camera.position.set(30,10,0);
 
scene.add(new THREE.AxesHelper(5))
const light = new THREE.DirectionalLight(0xfffff, 1);
light.position.set( 10, 10, 10 );

const canvas = document.querySelector('#canvas1');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth * 0.5, window.innerHeight);
 
 
const seaGeometry = new THREE.PlaneGeometry(10, 10, 30, 64, 128, 128);

const material = new THREE.ShaderMaterial( { 
    vertexShader: vshader,
    fragmentShader: fshader, 


    uniforms:
    {
        waveTime: {value: 0.0},
        waveTransparency:{value: 0.1},
        waveSteep: {value: 0.15},
        wavePeriod: {value: 2.0},
        waveFrequencyIndex: { value: 1},
        waveSpeed: { value: 2},
        directionalLightPosition: { value: light.position },
        xWeight: {value: 1},
        zWeight: {value: 1},
    }
} );

const Sea = new THREE.Mesh( seaGeometry, material );
camera.lookAt(Sea.position);
Sea.rotation.x = -Math.PI * 0.5;

const gui = new GUI();
gui.add( material.uniforms.xWeight, 'value', 1, 20).name("X Direction Weight");
gui.add( material.uniforms.zWeight, 'value', 1, 20).name("Z Direction Weight");

const guiContainer = document.querySelector('#gui-container');
guiContainer.appendChild(gui.domElement);

scene.add( Sea );

const controls = new OrbitControls( camera, renderer.domElement );

const clock = new THREE.Clock();
function tick()
{ 
    const elapsedTime = clock.getElapsedTime();
    material.uniforms.waveTime.value = elapsedTime;
    renderer.render( scene, camera );

    requestAnimationFrame(tick);
}

tick();