import * as THREE from 'three';
import {FBXLoader} from 'FBXLoader';
document.addEventListener('DOMContentLoaded', Start);

// Para Models Importados
var objetoImportado;
var mixerAnimacao;
var relogio = new THREE.Clock();
var importer = new FBXLoader();

// Setup da cena, e o render
var cena = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true; // Ativar sombras

//Setup camera
var cameraPerspetiva = new THREE.PerspectiveCamera(60,16/9,0.1,100); 
cameraPerspetiva.position.set(0, 3, 3);

renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);

document.body.appendChild(renderer.domElement);

// Adiciona cubo ao cenário
var gerometriaCubo = new THREE.BoxGeometry(1,2,1);
var materialTextura = new THREE.MeshStandardMaterial({color: 0x000000});
var meshCubo = new THREE.Mesh(gerometriaCubo,materialTextura);
meshCubo.castShadow = true;
meshCubo.translateZ(-10);

// Adiciona bordas ao cubo
var edges = new THREE.EdgesGeometry(gerometriaCubo);
var edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
var edgeLines = new THREE.LineSegments(edges, edgeMaterial);
meshCubo.add(edgeLines);

// Adiciona o chao 
var planeGeometry = new THREE.PlaneGeometry(30, 50);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = - Math.PI / 2; 
plane.position.y = -1; 
plane.receiveShadow = true;

var tiltedPlaneGeometry = new THREE.PlaneGeometry(10, 5); // Smaller plane
var tiltedPlaneMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
tiltedPlaneMaterial.side = THREE.DoubleSide;
tiltedPlaneMaterial.shadowSide = THREE.BackSide;
var tiltedPlane = new THREE.Mesh(tiltedPlaneGeometry, tiltedPlaneMaterial);
tiltedPlane.rotation.x = -Math.PI / 2;
tiltedPlane.rotation.y = Math.PI / 12;
tiltedPlane.position.set(0,1, -10);
tiltedPlane.receiveShadow = true;
tiltedPlane.castShadow = true;
cena.add(tiltedPlane);

//Adiciona bordas ao chao
var planeEdges = new THREE.EdgesGeometry(planeGeometry);
var planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,linewidth: 10 });
var planeEdgeLines = new THREE.LineSegments(planeEdges, planeEdgeMaterial);
plane.add(planeEdgeLines);

//Cria o barril
var barrelBodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
var barrelBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
var barrelBody = new THREE.Mesh(barrelBodyGeometry, barrelBodyMaterial);
barrelBody.castShadow = true;
barrelBody.receiveShadow = true;

// cria os aros
var bandGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
var bandMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

var topBand = new THREE.Mesh(bandGeometry, bandMaterial);
topBand.rotation.x = Math.PI / 2; 
topBand.position.y = 0.7; 
topBand.castShadow = true;
var middleBand = new THREE.Mesh(bandGeometry, bandMaterial);
middleBand.rotation.x = Math.PI / 2;
middleBand.position.y = 0;
middleBand.castShadow = true;
var bottomBand = new THREE.Mesh(bandGeometry, bandMaterial);
bottomBand.rotation.x = Math.PI / 2;
bottomBand.position.y = -0.7;
bottomBand.castShadow = true;

var barrel = new THREE.Group();
barrel.add(barrelBody);
barrel.add(topBand);
barrel.add(middleBand);
barrel.add(bottomBand);

var textureLoader = new THREE.TextureLoader();
var woodTexture = textureLoader.load('./Texturas/woodBarreltexture.jpg');
var metalTexture = textureLoader.load('./Texturas/rustyMetalTexture.jpg');

barrelBodyMaterial.map = woodTexture;
bandMaterial.map = metalTexture;

barrel.scale.set(1, 1, 1);
barrel.rotation.y = Math.PI / 2;
barrel.rotation.z = Math.PI / 2;

barrel.position.set(-7, 7, -10); 
cena.add(barrel);

//Funcao que trata de importar modelos e animaçoes
importer.load('Objetos/marioModel.fbx', function (object) {
    mixerAnimacao = new THREE.AnimationMixer(object);
    //object animations tem todas as que estao no objeto
    var action = mixerAnimacao.clipAction(object.animations[0]);
    action.play();
    // Material para o modelo
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

// Variaveis de gravidade e movimento
const moveSpeed = 0.08;
const jumpSpeed = 0.5;
const gravity = 0.02;
let velocityY = 0;
let isJumping = false;
const planes = [plane, tiltedPlane]; // Add all planes here

// Tamanho do plano e do cubo
const planeSize = 15;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};

// Determinar se o objeto pode saltar 
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true; 
    if (event.key === 'w' && !isJumping) {
        velocityY = jumpSpeed;
        isJumping = true;
    }
});

// Verificar se alguma tecla foi solta
document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

//funcao responsavel pelo movimento lateral
function handleMovement() {
    if (keysPressed['a'] && meshCubo.position.x - moveSpeed > -halfPlaneSize + cubeSize / 2) {  
        meshCubo.position.x -= moveSpeed;
    }
    if (keysPressed['d'] && meshCubo.position.x + moveSpeed < halfPlaneSize - cubeSize / 2) {
        meshCubo.position.x += moveSpeed;
    }
}

//Funcao responsavel pela gravidade movimento vertical e colisao com o chao
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
}

let barrelVelocityY = 0; 
const barrelGravity = 0.02;
const barrelFloorLevel = plane.position.y + 0.75; 


function applyBarrelGravity() {
   
    const closestPlane = getClosestPlane(barrel);

    if (closestPlane) {
       
        const floorLevel = closestPlane.position.y +
            Math.tan(closestPlane.rotation.x) * (barrel.position.z - closestPlane.position.z) +
            Math.tan(closestPlane.rotation.z) * (barrel.position.x - closestPlane.position.x);

        
        const barrelBoundingBox = new THREE.Box3().setFromObject(barrel);
        const barrelBottomY = barrelBoundingBox.min.y;

        if (barrelBottomY > floorLevel || barrelVelocityY > 0) {
            barrelVelocityY -= barrelGravity;
        } else {
            barrel.position.y += floorLevel - barrelBottomY;
            barrelVelocityY = 0; 
        }

        barrel.position.y += barrelVelocityY;
    }
}

function getClosestPlane(barrel) {
    let closestPlane = null;
    let closestDistance = Infinity;

    planes.forEach((plane) => {
     
        const planeY = plane.position.y +
            Math.tan(plane.rotation.x) * (barrel.position.z - plane.position.z) +
            Math.tan(plane.rotation.z) * (barrel.position.x - plane.position.x);

        const distance = barrel.position.y - planeY;

        if (distance >= 0 && distance < closestDistance) {
            closestDistance = distance;
            closestPlane = plane;
        }
    });

    return closestPlane;
}

function Start() {
    cena.add(meshCubo);
    
    //luz ambiente
    var luzAmbiente = new THREE.AmbientLight(0x404040, 5);
    cena.add(luzAmbiente);

    // Luz direcional
    var luzDirecional = new THREE.DirectionalLight(0xffffff, 5);
    luzDirecional.position.set(5, 10,5);
    luzDirecional.castShadow = true;
    luzDirecional.shadow.camera.left = -20;
    luzDirecional.shadow.camera.right = 20;
    luzDirecional.shadow.camera.top = 20;
    luzDirecional.shadow.camera.bottom = -20;
    luzDirecional.shadow.camera.near = 0.5;
    luzDirecional.shadow.camera.far = 50;
    luzDirecional.shadow.mapSize.width = 2048;
    luzDirecional.shadow.mapSize.height = 2048
    cena.add(luzDirecional);
    cena.add(plane);
    function loop() {
        handleMovement(); 
        applyGravity();
        applyBarrelGravity(); 
        renderer.render(cena, cameraPerspetiva);
        requestAnimationFrame(loop);
    }
    loop();
}