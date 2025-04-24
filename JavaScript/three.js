import * as THREE from 'three';

import {FBXLoader} from 'FBXLoader';

document.addEventListener('DOMContentLoaded', Start);

// Para Models Importados

var objetoImportado;

var mixerAnimacao;

var relogio = new THREE.Clock();

var importer = new FBXLoader();

//-------------------------------------


//Funcao que trata de importar modelos  

importer.load('Objetos/marioModel.fbx', function (object) {

mixerAnimacao = new THREE.AnimationMixer(object);
//object animations tem todas as que estao no objeto
var action = mixerAnimacao.clipAction(object.animations[0]);
action.play();

object.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
    }
});

cena.add(object);

object.scale.x = 0.01;
object.scale.y = 0.01;
object.scale.z = 0.01;

object.position.x = 0;
object.position.y = 0;
object.position.z = 0;

objetoImportado = object;
});

var cena = new THREE.Scene();
var camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;

var cameraPerspetiva = new THREE.PerspectiveCamera(60,16/9,0.1,100);
cameraPerspetiva.position.set(0, 2, 0);

renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);

document.body.appendChild(renderer.domElement);

var gerometriaCubo = new THREE.BoxGeometry(1,2,1);

var materialTextura = new THREE.MeshStandardMaterial({color: 0x000000});

var meshCubo = new THREE.Mesh(gerometriaCubo,materialTextura);
meshCubo.castShadow = true;
meshCubo.translateZ(-10);

var edges = new THREE.EdgesGeometry(gerometriaCubo);
var edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
var edgeLines = new THREE.LineSegments(edges, edgeMaterial);

meshCubo.add(edgeLines);

var planeGeometry = new THREE.PlaneGeometry(30, 50);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = - Math.PI / 2; 
plane.position.y = -2; 
plane.receiveShadow = true;

var planeEdges = new THREE.EdgesGeometry(planeGeometry);
var planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,linewidth: 10 });
var planeEdgeLines = new THREE.LineSegments(planeEdges, planeEdgeMaterial);
plane.add(planeEdgeLines);

const moveSpeed = 0.08;
const jumpSpeed = 0.5;
const gravity = 0.02;
let velocityY = 0;
let isJumping = false;

const planeSize = 15;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true; 
    if (event.key === 'w' && !isJumping) {
        velocityY = jumpSpeed;
        isJumping = true;
        console.log('Jump initiated');
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

function handleMovement() {
    if (keysPressed['a'] && meshCubo.position.x - moveSpeed > -halfPlaneSize + cubeSize / 2) {  
        meshCubo.position.x -= moveSpeed;
    }
    if (keysPressed['d'] && meshCubo.position.x + moveSpeed < halfPlaneSize - cubeSize / 2) {
        meshCubo.position.x += moveSpeed;
    }
}

function applyGravity() {
    const floorLevel = plane.position.y + cubeSize / 2;
    if (meshCubo.position.y > floorLevel || velocityY > 0) {
        velocityY -= gravity;
    } else {
        meshCubo.position.y = floorLevel;
        velocityY = 0;
        isJumping = false;
    }
    meshCubo.position.y += velocityY;
    console.log(`velocityY: ${velocityY}, positionY: ${meshCubo.position.y}, isJumping: ${isJumping}`);
}

function Start() {
    cena.add(meshCubo);

    var luzAmbiente = new THREE.AmbientLight(0x404040, 5);
    cena.add(luzAmbiente);

    var luzDirecional = new THREE.DirectionalLight(0xffffff, 3);
    luzDirecional.position.set(1, 1, 1).normalize();
    luzDirecional.castShadow = true;

    luzDirecional.shadow.camera.left = -20;
    luzDirecional.shadow.camera.right = 20;
    luzDirecional.shadow.camera.top = 20;
    luzDirecional.shadow.camera.bottom = -20;
    luzDirecional.shadow.camera.near = 0.5;
    luzDirecional.shadow.camera.far = 50;

    luzDirecional.shadow.mapSize.width = 1024;
    luzDirecional.shadow.mapSize.height = 1024;
    cena.add(luzDirecional);

    cena.add(plane);

    renderer.render(cena, cameraPerspetiva);
    requestAnimationFrame(loop);
}

function loop() {
    handleMovement();
    applyGravity();
    renderer.render(cena, cameraPerspetiva);
    requestAnimationFrame(loop);
}