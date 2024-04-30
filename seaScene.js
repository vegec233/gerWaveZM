import * as THREE from "three";
import {Lensflare, LensflareElement} from './Lensflare.js'
import GUI from './lil-gui.module.min.js';
import {OrbitControls} from './OrbitControls.js'

const vshader = `
uniform float waveTime;
uniform float waveFrequencyIndex;
uniform float waveSpeed;
uniform float waveSteep;
uniform float wavePeriod;
varying vec2 vUv;
varying vec2 nUv;
varying vec3 vNormal;
varying vec3 nNormal;
varying vec3 vPosition;

void main(){
    float x = position.x;
    float y = position.y;
    float z = position.z;
    float PI = 3.14159265;

    float sx = 0.0;
    float sy = 0.0;
    float sz = 0.0;

    nUv = uv;
    vPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0); //v

    float waveLength = 0.0;
    float index = 1.0;
    vec2 dir;  // waveDirection

    // The geometry is rotated, so the z axis is pointing upwards now.
    if (position.z >= 10.0){ // The vertex on top layer will move
        for(int i = 0;i < 4; i++){
            waveLength += waveFrequencyIndex;

            //Assign value to directional vector according to the index changes
            index += 1.0;
            if(mod(index, 2.0)!=0.0){
                dir = vec2(1.0, waveLength);
            }else{
                dir = vec2(-1.0, waveLength);
            }

            float l1 = wavePeriod * PI / (waveLength); 
            float amp = waveSteep / l1;
            float waveSpd = waveSpeed * sqrt(9.8/l1); // wavespeed

            // Gerstner wave formula
            float x1 =   amp * cos(dot(normalize(dir)* l1,vec2(x,y) )   + waveTime * waveSpd) * dir.x;
            float y1 =   amp * cos(dot(normalize(dir)* l1,vec2(x,y) )   + waveTime * waveSpd) * dir.y;
            float z1 =   amp * sin(dot(normalize(dir)* l1,vec2(x,y) )   + waveTime * waveSpd);
            sx += x1;
            sy += y1;
            sz += z1;

            // Calculate tangent by partial derivative
            vec3 tangent = vec3(1.0 - amp * sin(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.x) * normalize(dir).x,
            -amp * sin(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.y) * normalize(dir).x,
            amp * cos(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.x));

            // Calculate bitangent by partial derivative with respect to another direction
            vec3 bitangent = vec3(- amp * sin(dot(normalize(dir)* l1, vec2(x, y) ) + waveTime * waveSpd) * normalize(dir.y) * normalize(dir).x,
            1.0 - amp * sin(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.y) * normalize(dir.x),
            amp * cos(dot(normalize(dir)* l1, vec2(x, y)) + waveTime * waveSpd) * normalize(dir.y));
            
            // Find the normal by cross product of tangent and bitangent
            nNormal = vec3(cross(tangent, bitangent));
            vNormal += nNormal;
        }
        sx += x;
        sy += y;
        sz += z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(sx,sy,sz, 1.0);
    } else if (position.z <= -9.5){ // Vertex at the bottom area of geometry
        //Same Gerstner waves routines but without impact on vertical direction (z axis)
        for(int i = 0;i < 4; i++){
            waveLength = (waveLength + waveFrequencyIndex);
            index += 1.0;
            if(mod(index, 2.0)!=0.0){
                dir = vec2(1.0, waveLength);
            }else{
                dir = vec2(-1.0, waveLength);
            }
            float l1 = wavePeriod * PI / (0.0 + waveLength); //waveFrequency
            float amp = waveSteep / l1;
            float waveSpd = waveSpeed * sqrt(9.8/l1); // wavespeed
            float x1 =   amp * cos(dot(normalize(dir)* l1,vec2(x,y)  ) + waveTime * waveSpd);
            float y1 =   amp * cos(dot(normalize(dir)* l1,vec2(x,y)  ) + waveTime *  waveSpd);           
            sx += x1 * dir.x;
            sy += y1 * dir.y;
            vUv = vec2(sx, sy);
        }
        sx += x;
        sy += y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x,position.y,position.z, 1.0);
    }
    else{ // The rest of the vertex remain normal
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
}
`

const fshader = `
uniform sampler2D normalTexture;
uniform sampler2D seaTexture;
uniform sampler2D causticTex;
uniform samplerCube skyTexture;
uniform vec3 directionalLightPosition;

uniform vec3 specularColor;
uniform float shininess;

varying vec2 nUv;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 nNormal;
varying vec3 vPosition;
uniform mat4 modelViewMatrix;


void main(){  
    vec3 normal = nNormal;

    //Sampling textures
    vec3 lnormal = texture2D(normalTexture, nUv).rgb * 2.0 - 1.0;
    vec3 caustic = texture2D(causticTex, vUv).rgb * 2.0 - 1.0;
    vec3 surfaceColor = texture2D(seaTexture, nUv).rgb * 2.0 - 1.0;

    // Lighting calculations
    vec3 lightDir = normalize(directionalLightPosition - vPosition);
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float diffuse = dot(normal, lightDir); // Lambert
    float specular = pow(max(0.0, dot(normal, halfwayDir)), shininess); // Blin Phong for high light

    //Reflect cube camera's view on surface
    vec4 reflectionColor; 
    vec3 reflectedDirection = normalize(reflect(viewDir, normal));
    reflectionColor = textureCube(skyTexture, reflectedDirection);

    vec3 color;
     
    if(vPosition.z <= -9.5){ //Display caustics and normal map at the bottom
        color = lnormal.r + caustic +  vec3(0,0.5,1); 
    } else { //Display water surface base color texture and reflections of cube camera
        color = surfaceColor + reflectionColor.rgb;
    }

    gl_FragColor = vec4((diffuse  + specular) + color, 0.6);
}
`


const scene = new THREE.Scene();
//Main camera
const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(80,50,80);

//Set cubecamera for skybox
const cubeCamera = new THREE.CubeCamera(0.1, 1000, 256);
scene.add(cubeCamera);

//For aesthetic consideration, hide the axeshelper.
//scene.add(new THREE.AxesHelper(1))

// Set light
const light = new THREE.DirectionalLight(0xfffff, 1);
light.position.set( 10, 30, 10 );
light.castShadow = true;
light.name = 'light';

//Display on html canvas
const canvas = document.querySelector('#canvas1');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth * 0.5, window.innerHeight);

const textureLoader = new THREE.TextureLoader();
const normalTexture = textureLoader.load('./Water_1_M_Normal.jpg');
const seaNormalTexture = textureLoader.load('./water-normal.png');

// Set skybox 
const cubeLoader = new THREE.CubeTextureLoader();
const textureCube = cubeLoader.load( [
    './px.jpg', './nx.jpg',
    './py.jpg', './ny.jpg',
    './pz.jpg', './nz.jpg'
] );


// Simulates the sun
const flare1Loader = new THREE.TextureLoader();
const flare1Texture = flare1Loader.load('./textureFlare1.png');
const flare2Loader = new THREE.TextureLoader();
const flare2Texture = flare2Loader.load('./textureFlare2.png');
const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(flare1Texture, 170, -1 ));
lensflare.addElement(new LensflareElement(flare2Texture, 160, -1 ));
lensflare.addElement(new LensflareElement(flare2Texture, 150, -1 ));
lensflare.addElement(new LensflareElement(flare2Texture, 120, -1 ));
lensflare.addElement(new LensflareElement(flare2Texture, 200, -1));
light.add(lensflare);

const causticLoader = new THREE.TextureLoader();
const causticTex = causticLoader.load("./caustic.JPG");
causticTex.wrapS = THREE.RepeatWrapping;
causticTex.wrapT = THREE.RepeatWrapping;

scene.background= textureCube;
normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;
seaNormalTexture.wrapS = THREE.RepeatWrapping;
seaNormalTexture.wrapT = THREE.RepeatWrapping;
const seaTexture = textureLoader.load('./Untitled-2.jpg');
seaTexture.wrapS = THREE.RepeatWrapping;
seaTexture.wrapT = THREE.RepeatWrapping;

// Create material with shaders
const material = new THREE.ShaderMaterial( { 
    vertexShader: vshader,
    fragmentShader: fshader, 
    wireframe: false,
    transparent: true, // Make the geometry looks transparent
    side: THREE.DoubleSide,// Render both sides

    uniforms:
    {
        waveTime: {value: 0.0},
        waveTransparency:{value: 0.1},
        waveSteep: {value: 0.2},
        wavePeriod: {value: 2.0},
        waveFrequencyIndex: { value: 1},
        waveSpeed: { value: 2},
        directionalLightPosition: { value: light.position },
        specularColor: { value: new THREE.Vector3(1,1,1)},
        shininess: { value: 512},
        normalTexture: { value: seaNormalTexture },
        seaTexture: { value: seaTexture },
        skyTexture: { value: textureCube}, 
        causticTex: { value: causticTex}
    }
} );

//Set the sea geometry
const seaGeometry = new THREE.BoxGeometry(100, 100, 20, 64, 128, 128);
const Sea = new THREE.Mesh( seaGeometry, material );
Sea.rotation.x = -Math.PI * 0.5;

//Set GUI
const gui = new GUI();
gui.add( material.uniforms.waveFrequencyIndex, 'value', 0.1, 0.9).name('Frequency Index');
gui.add( material.uniforms.waveSpeed, 'value', 0.1, 12).name('Speed');
gui.add( material.uniforms.waveSteep, 'value', 0.0001, 0.9).name('Steepness');
gui.add( material.uniforms.wavePeriod, 'value', 0.1, 2).name('Period');
gui.add( light.position, 'x', -30, 30).name('Light x');;
gui.add( light.position, 'y', 15, 30).name('Light y');;
gui.add( light.position, 'z',0, 10).name('Light z');;

scene.add( light);
scene.add( Sea );

// Set orbitcontrols with mouse
const controls = new OrbitControls( camera, renderer.domElement );

const clock = new THREE.Clock();

// Update light
function updateLightPosition() 
{
    const light = scene.getObjectByName('light');
    if (light) {
        material.uniforms.directionalLightPosition.value.copy(light.position);
    }
}

// Move the vertex
function tick()
{ 
    const elapsedTime = clock.getElapsedTime();
    material.uniforms.waveTime.value = elapsedTime; // Move the vertex
    renderer.render( scene, camera );
    updateLightPosition();
    requestAnimationFrame(tick);
}

tick();