import * as THREE from 'three';

import {FBXLoader} from 'FBXLoader';

document.addEventListener('DOMContentLoaded', Start);

// Para Models Importados

var objetoMario;

var objetoDK;

var mixerAnimacao;

var relogio = new THREE.Clock();

var importer = new FBXLoader();



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


// Variaveis de movimento e salto


let settings = {
    baseJumpSpeed: 0.9,
    gravity: 0.05,
    maxSpeed: 0.18,
    acceleration: 0.25,
    smoothingFactor: 0.35


};
const sprintThreshold = 0.2; // segundos

const moveSpeed = 0.09;
const jumpSpeed = 0.5;

let isSprinting = false;

let velocityY = 0;
let isJumping = false;
let jumpCount = 0;
let jumpStartTime = 0;

// Movimento horizontal
const baseMoveSpeed = 0.2; // ← aumenta para testar velocidade perceptível
const sprintMultiplier = 3;
const accelerationRate = 0.35; // quão rápido acelera (0.2 a 0.5 é bom)
let currentSpeedX = 0;

// Salto

const sprintJumpSpeed = 0.4;
const sprintJumpXSpeed = 0.4;


let cayoteTimer = 0;
const cayoteTime = 0.15;
let jumpBuffered = false;

let jumpBufferTimer = 0;

const jumpBufferTime = 0.4; // Tempo máximo para encadear salto (em segundos)
let lastGroundTime = 0;     // Quando tocou no chão pela última vez

//--------------------------------



const planeSize = 70;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};




const walkSpeed = 0.09;

let currentMaxSpeed = walkSpeed;

function updateSprintState(delta) {
    const moving = keysPressed['a'] || keysPressed['d'];
    if (moving) {
        runTimer += delta;
        if (runTimer >= sprintThreshold) isSprinting = true;
    } else {
        runTimer = 0;
        isSprinting = false;
    }
}

let runTimer = 0;

document.addEventListener('keydown', (event) => {
    console.log("⬇️ Tecla premida:", event.key);
    keysPressed[event.key] = true; 
    if (event.key === 'Shift') {
        isSprinting = true;
    }
   
   
    if (event.key === ' ') {
        jumpBuffered = true;
        jumpBufferTimer = jumpBufferTime;

        const now = relogio.getElapsedTime();
        const grounded = !isJumping;

        if (grounded) {
            jumpCount = (now - lastGroundTime <= jumpBufferTime) ? jumpCount + 1 : 1;
        } else return;

        isJumping = true;

        if (isJumping) {
            objetoMario.velocityX = currentSpeedX;
        }

        if (jumpCount === 1) velocityY = settings.baseJumpSpeed;
        else if (jumpCount === 2) velocityY = settings.baseJumpSpeed * 1.2;
        else if (jumpCount === 3) {
            velocityY = settings.baseJumpSpeed * 1.5;
            objetoMario.velocityX *= 1.5;
            jumpCount = 0;
        }

        objetoMario.velocityX = 0;
        if (isSprinting) {
            if (keysPressed['a']) objetoMario.velocityX = -sprintJumpXSpeed;
            else if (keysPressed['d']) objetoMario.velocityX = sprintJumpXSpeed;
        }
    }
});

document.addEventListener('keyup', (event) => {
    console.log("⬆️ Tecla largada:", event.key);
    keysPressed[event.key] = false;
    if (event.key === 'Shift') {
        isSprinting = false;
    }
});


function tweakVariables() {
    settings.jumpSpeed = 0.3;
    settings.gravity = 0.07;
    settings.acceleration = 0.2;
    settings.maxSpeed = 0.5;
    settings.smoothingFactor = isJumping ? 0.1 : 0.35; // Mais suave quando a saltar
}





function handleMovement() {
    // const currentSpeed = isSprinting ? baseMoveSpeed * sprintMultiplier : baseMoveSpeed; //calcula a velocidade de movimento

    // if (keysPressed['a'] && objetoMario.position.x - currentSpeed > -halfPlaneSize + cubeSize / 2) {
    //     objetoMario.position.x -= currentSpeed;
    //     objetoMario.rotation.y += (0 - objetoMario.rotation.y) * 0.5;
    // }
    // if (keysPressed['d'] && objetoMario.position.x + currentSpeed < halfPlaneSize - cubeSize / 2) {
    //     objetoMario.position.x += currentSpeed;
    //     objetoMario.rotation.y += (Math.PI - objetoMario.rotation.y) * 0.5;
    // }
    // if (!keysPressed['a'] && !keysPressed['d']) {
    //     objetoMario.rotation.y += (0 - objetoMario.rotation.y) * 0.1; // suavemente volta à frente
    // }
    // if (isJumping) {
    //     objetoMario.position.x += objetoMario.velocityX || 0;
    // }


    if (!objetoMario) return;

    const grounded = !isJumping;
    const maxSpeed = isSprinting ? 0.18 : 0.09;
    const airControlFactor = grounded ? 1 : 0.4; // Menos controlo no ar

    let targetSpeed = 0;

    if (keysPressed['a']) {
        targetSpeed = -maxSpeed;
    } else if (keysPressed['d']) {
        targetSpeed = maxSpeed;
    }

    // Aplica aceleração suavizada, ajustada para ar/solo
    currentSpeedX += (targetSpeed - currentSpeedX) * (0.2 * airControlFactor);
    
    objetoMario.position.x += currentSpeedX;

    // Roda o Mario consoante a direção
    if (currentSpeedX < 0) {
        objetoMario.rotation.y += (0 - objetoMario.rotation.y) * 0.5;
    } else if (currentSpeedX > 0) {
        objetoMario.rotation.y += (Math.PI - objetoMario.rotation.y) * 0.5;
    }
}

function applyGravity() {
    if(!objetoMario) return;
    const floorLevel = plane.position.y + cubeSize / 2;

    if ((cayoteTimer > 0 || !isJumping) && jumpBuffered) jumpBuffered = false;

    if (objetoMario.position.y > floorLevel || velocityY > 0) {
        objetoMario.position.y += velocityY;
        velocityY -= settings.gravity;
        isJumping = true;
    } else {
        if (isJumping) {
            objetoMario.position.x += objetoMario.velocityX || 0;
            cayoteTimer = settings.cayoteTime;
            lastGroundTime = relogio.getElapsedTime();
        }
        objetoMario.position.y = floorLevel;
        velocityY = 0;
        objetoMario.velocityX = 0;
        isJumping = false;
    }
   
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


    tweakVariables(); // Ajusta as variáveis de movimento e salto para better testing
    

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

        object.velocityX = 0;
        cena.add(object);
        objetoMario = object;
    
     
    });

    //initParticles(); // Inicializa o sistema de partículas

    requestAnimationFrame(loop);
}

function loop() {
    console.log("Loop iniciado!");
    const delta = relogio.getDelta(); // Get the time elapsed since the last frame
    if (mixerAnimacao) {
        mixerAnimacao.update(delta); // Update the animation mixer
    }


    jumpBufferTimer -= delta;
    if (jumpBufferTimer <= 0) jumpBuffered = false;
    
    updateSprintState(delta); // Atualiza o estado de sprinting
    if (isSprinting) {
        console.log("🏃‍♂️ Mario está a correr!");
    } else {
        console.log("🚶 Mario está a andar.");
    }
    handleMovement();
    

    cayoteTimer -= delta;
    applyGravity();

    //emitDustParticles();
    //updateParticles(relogio.getDelta());

    
    if (objetoMario) {
        const cameraHeightOffset = 2; // Distância vertical entre a câmara e o Mario
        const cameraDistance = 10; // Distância atrás do personagem
    
        const marioPos = objetoMario.position.clone();
    
        // A câmara agora segue verticalmente a posição do Mario, mas com um offset
        const targetPosition = new THREE.Vector3(
            marioPos.x, // A câmara segue a posição X do Mario
            marioPos.y + cameraHeightOffset, // Ajusta a altura da câmara conforme o Mario sobe/desce
            marioPos.z + cameraDistance // Distância fixa no eixo Z
        );
    
        // Suavemente move a câmara para a posição alvo com um fator de suavização
        cameraPerspetiva.position.lerp(targetPosition, settings.smoothingFactor);
    
        // Garante que a câmara olha para o Mario
        const lookAtPos = marioPos.clone();
        lookAtPos.y += 1; // Olha para o "tronco" do Mario
        cameraPerspetiva.lookAt(lookAtPos);
    
        // Aumentar o FOV quando o Mario estiver a correr
        const sprintFOV = 75; // FOV quando o Mario está a correr
        const walkFOV = 60; // FOV quando o Mario está andando
    
        // Se estiver a correr, aumenta o FOV
        if (isSprinting) {
            cameraPerspetiva.fov = THREE.MathUtils.lerp(cameraPerspetiva.fov, sprintFOV, 0.1);
        } else {
            cameraPerspetiva.fov = THREE.MathUtils.lerp(cameraPerspetiva.fov, walkFOV, 0.1);
        }
    
        // Atualiza a câmara para aplicar a alteração do FOV
        cameraPerspetiva.updateProjectionMatrix();
    }
    renderer.render(cena, cameraPerspetiva);
    requestAnimationFrame(loop);
}