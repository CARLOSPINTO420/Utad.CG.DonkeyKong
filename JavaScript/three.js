import * as THREE from 'three';

import {FBXLoader} from 'FBXLoader';

document.addEventListener('DOMContentLoaded', Start);

// Para Models Importados

var objetoMario;

var objetoDK;

var mixerAnimacao;

var relogio = new THREE.Clock();

var importer = new FBXLoader();

//-------------------------------------


// Variaveis para sprinting e salto

const baseJumpSpeed = 0.5;  // Velocidade de salto normal
const sprintJumpSpeed = 0.4; // Velocidade de salto quando a correr

const sprintJumpXSpeed = 0.3; // Impulso horizontal extra quando o mario está a correr


let isSprinting = false;
const baseMoveSpeed = 0.1;
const sprintMultiplier = 2;

//---------------------------------------



var cena = new THREE.Scene();
var camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;

var cameraPerspetiva = new THREE.PerspectiveCamera(60,16/9,0.1,100);
cameraPerspetiva.position.set(0, 2, 0);

renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);

document.body.appendChild(renderer.domElement);


var planeGeometry = new THREE.PlaneGeometry(70, 50);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = - Math.PI / 2; 
plane.position.y = -2; 
plane.receiveShadow = true;

var planeEdges = new THREE.EdgesGeometry(planeGeometry);
var planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,linewidth: 10 });
var planeEdgeLines = new THREE.LineSegments(planeEdges, planeEdgeMaterial);
plane.add(planeEdgeLines);

const moveSpeed = 0.09;
const jumpSpeed = 0.5;
const gravity = 0.035;
let velocityY = 0;
let isJumping = false;

const planeSize = 70;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true; 
    if (event.key === 'Shift') {
        isSprinting = true;
    }
   
    if (event.key === ' ' && !isJumping) {
        // Se o jogador estiver a correr, adicionar impulso no eixo X
        const jumpToApply = isSprinting ? sprintJumpSpeed : baseJumpSpeed;
        velocityY = jumpToApply;
        isJumping = true;

        // Impulso adicional no eixo X quando saltar enquanto corre
        if (isSprinting) {
            if (keysPressed['a']) {
                // Se estiver a mover-se para a esquerda, dar um impulso negativo no X
                objetoMario.velocityX = -sprintJumpXSpeed;
            } else if (keysPressed['d']) {
                // Se estiver a mover-se para a direita, dar um impulso positivo no X
                objetoMario.velocityX = sprintJumpXSpeed;
            }
        }
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
    if (event.key === 'Shift') {
        isSprinting = false;
    }
});

function handleMovement() {
    const currentSpeed = isSprinting ? baseMoveSpeed * sprintMultiplier : baseMoveSpeed; //calcula a velocidade de movimento

    if (keysPressed['a'] && objetoMario.position.x - currentSpeed > -halfPlaneSize + cubeSize / 2) {
        objetoMario.position.x -= currentSpeed;
        objetoMario.rotation.y += (0 - objetoMario.rotation.y) * 0.5;
    }
    if (keysPressed['d'] && objetoMario.position.x + currentSpeed < halfPlaneSize - cubeSize / 2) {
        objetoMario.position.x += currentSpeed;
        objetoMario.rotation.y += (Math.PI - objetoMario.rotation.y) * 0.5;
    }
    if (isJumping) {
        objetoMario.position.x += objetoMario.velocityX || 0;
    }
}

function applyGravity() {
    if(!objetoMario) return;
    const floorLevel = plane.position.y + cubeSize / 2;
    if (objetoMario.position.y > floorLevel || velocityY > 0) {
        velocityY -= gravity;
    } else {
        objetoMario.position.y = floorLevel;
        velocityY = 0;
        isJumping = false;
    }
    objetoMario.position.y += velocityY;
   
}

// trata de particulas de correr

// let particleSystem;
// let particleMaterial;
// let particles = [];
// const maxParticles = 200;
// const particleLifetime = 0.5; // segundos

// function initParticles() {
//     const geometry = new THREE.BufferGeometry();
//     const positions = new Float32Array(maxParticles * 3); // x, y, z por partícula

//     geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     geometry.setDrawRange(0, 0); // ← importante

//     particleMaterial = new THREE.PointsMaterial({
//         color: 0x808080,
//         size: 0.4, // 
//         transparent: true,
//         opacity: 1.0, // ← mais opaco para ver melhor
//         depthWrite: false // ← evita que se escondam atrás de outros objetos
//     });

//     particleSystem = new THREE.Points(geometry, particleMaterial);
//     cena.add(particleSystem);
// }

// // faz a emissao de particulas de poeira

// function emitDustParticles() {
//     if (!objetoMario || !isSprinting) return;
//     console.log("emissao de particulas de poeira");

//     // Criar nova partícula
//     const position = objetoMario.position.clone();
//     position.y += 0.05; // Ajuste para aparecer um pouco acima do chão, mas mais controlado
//     position.z = objetoMario.position.z + Math.random() * 0.1 - 0.05; // Menor variação no eixo Z
//     position.x += Math.random() * 0.1 - 0.05; // Menor variação no eixo X

//     particles.push({ position, age: 0 });

//     if (particles.length > maxParticles) {
//         particles.shift(); // remove a mais antiga
//     }
// }

// // da atualizacao as particulas de poeira

// function updateParticles(delta) {
//     console.log("Total de partículas:", particles.length); // DEBUG
//     const positions = particleSystem.geometry.attributes.position.array;

//     for (let i = 0; i < particles.length; i++) {
//         const p = particles[i];
//         p.age += delta;
//         const index = i * 3;

//         // Fade out (opcional)
//         if (p.age > particleLifetime) {
//             particles.splice(i, 1);
//             i--;
//             continue;
//         }

//         // Atualiza posição
//         positions[index] = p.position.x;
//         positions[index + 1] = p.position.y;
//         positions[index + 2] = p.position.z;

//         // Ligeiro movimento ascendente
//         p.position.y += 0.01;
//     }

//     particleSystem.geometry.setDrawRange(0, particles.length);
//     particleSystem.geometry.attributes.position.needsUpdate = true;

//     particleSystem.position.copy(objetoMario.position); // Posiciona o sistema de partículas na posição do Mario
    
// }

//----------------------------------------------------

function Start() {


    var luzAmbiente = new THREE.AmbientLight(0x404040, 100);
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
    

    // Importacao de Modelos FBX

    // importer.load('Objetos/DKModel.fbx', function (object) {

    //     mixerAnimacao = new THREE.AnimationMixer(object);
       
    
    //     object.traverse(function (child) {
    //         if (child.isMesh) {
    //             child.castShadow = true;
    //             child.receiveShadow = true;
    //         }
    //     });
    
       
    
    //     object.scale.x = 0.01;
    //     object.scale.y = 0.01;
    //     object.scale.z = 0.01;
    
    //     object.rotation.x = 0;
    //     object.rotation.z = 0;
    
    //     object.position.x = 0;
    //     object.position.y = 0;
    //     object.position.z = -10;
    //     cena.add(object);
    //     objetoDK = object;
    
     
    // });
    

    importer.load('Objetos/marioModel.fbx', function (object) {

        mixerAnimacao = new THREE.AnimationMixer(object);
       
    
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    
       
    
        object.scale.x = 1;
        object.scale.y = 1;
        object.scale.z = 1;
    
        object.position.x = 0;
        object.position.y = 0;
        object.position.z = -10;
        cena.add(object);
        objetoMario = object;
    
     
    });

    //initParticles(); // Inicializa o sistema de partículas

    requestAnimationFrame(loop);
}

function loop() {

    const delta = relogio.getDelta(); // Get the time elapsed since the last frame
    if (mixerAnimacao) {
        mixerAnimacao.update(delta); // Update the animation mixer
    }
    handleMovement();
    
    applyGravity();

    //emitDustParticles();
    //updateParticles(relogio.getDelta());

    
    if (objetoMario) {
        const cameraHeight = 2.5; // Altura fixa da câmara
        const cameraDistance = 10; // Distância atrás do personagem
    
        
        const marioPos = objetoMario.position.clone();

        // Alvo da câmera: mesma posição em X e Z, altura fixa em Y
        const targetPosition = new THREE.Vector3(
            marioPos.x,
            cameraHeight,
            marioPos.z + cameraDistance
        );
    
        // Suavemente move a câmara para a posição alvo com um fator de suavização
        const smoothingFactor = isJumping ? 0.05 : 0.1; // Suavização maior enquanto o Mario está saltando
        cameraPerspetiva.position.lerp(targetPosition, smoothingFactor);
    
    
            // Garante que a câmera olha para o Mario, mas com altura constante
            const lookAtPos = marioPos.clone();
            lookAtPos.y += 1; // Olhar sempre para o "tronco" do Mario
            cameraPerspetiva.lookAt(lookAtPos);
       
    }
    renderer.render(cena, cameraPerspetiva);
    requestAnimationFrame(loop);
}