import * as THREE from 'three';
import {FBXLoader} from 'FBXLoader';
import { FontLoader } from 'FontLoader';
import { TextGeometry } from 'TextGeometry';

document.addEventListener('DOMContentLoaded', Start);

// Para Models Importados

var objetoMario;

var objetoDK;

var mixerAnimacao;
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
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;

var cameraPerspetiva = new THREE.PerspectiveCamera(60,16/9,0.1,100); 
cameraPerspetiva.position.set(0, 8, 10);

renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);

document.body.appendChild(renderer.domElement);


var planeGeometry = new THREE.PlaneGeometry(70, 50);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = - Math.PI / 2; 
plane.position.y = -1; 
plane.receiveShadow = true;


var tiltedPlaneGeometry = new THREE.BoxGeometry(10, 2,0.5);
var tiltedPlaneMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
tiltedPlaneMaterial.side = THREE.DoubleSide;
tiltedPlaneMaterial.shadowSide = THREE.BackSide;
var tiltedPlane = new THREE.Mesh(tiltedPlaneGeometry, tiltedPlaneMaterial);
tiltedPlane.rotation.x = -Math.PI / 2;
tiltedPlane.rotation.y = Math.PI / 36;
tiltedPlane.position.set(-3, 3, -10);
tiltedPlane.receiveShadow = true;
tiltedPlane.castShadow = true;
cena.add(tiltedPlane);


const livesCount = document.getElementById('lives-count');

var tiltedPlane2Geometry = new THREE.BoxGeometry(10, 2,0.5);
var tiltedPlane2Material = new THREE.MeshStandardMaterial({ color: 0x404040 });
tiltedPlane2Material.side = THREE.DoubleSide;
tiltedPlane2Material.shadowSide = THREE.BackSide;
var tiltedPlane2 = new THREE.Mesh(tiltedPlane2Geometry, tiltedPlane2Material);
tiltedPlane2.rotation.x = -Math.PI / 2;
tiltedPlane2.rotation.y = -(Math.PI / 36);
tiltedPlane2.position.set(2, 6 , -10);
tiltedPlane2.receiveShadow = true;
tiltedPlane2.castShadow = true;
cena.add(tiltedPlane2);

var tiltedPlane3Geometry = new THREE.BoxGeometry(10, 2,0.5);
var tiltedPlane3Material = new THREE.MeshStandardMaterial({ color: 0x404040 });
tiltedPlane3Material.side = THREE.DoubleSide;
tiltedPlane3Material.shadowSide = THREE.BackSide;
var tiltedPlane3 = new THREE.Mesh(tiltedPlane3Geometry, tiltedPlane3Material);
tiltedPlane3.rotation.x = -Math.PI / 2;
tiltedPlane3.rotation.y = Math.PI / 50;
tiltedPlane3.position.set(-5, 11, -10);
tiltedPlane3.receiveShadow = true;
tiltedPlane3.castShadow = true;
cena.add(tiltedPlane3);

var tiltedPlane4Geometry = new THREE.BoxGeometry(10, 2,0.5);
var tiltedPlane4Material = new THREE.MeshStandardMaterial({ color: 0x404040 });
tiltedPlane4Material.side = THREE.DoubleSide;
tiltedPlane4Material.shadowSide = THREE.BackSide;
var tiltedPlane4 = new THREE.Mesh(tiltedPlane4Geometry, tiltedPlane4Material);
tiltedPlane4.rotation.x = -Math.PI / 2;
tiltedPlane4.rotation.y = -(Math.PI / 36);
tiltedPlane4.position.set(3, 15 , -10);
tiltedPlane4.receiveShadow = true;
tiltedPlane4.castShadow = true;
cena.add(tiltedPlane4);

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
    smoothingFactor: 0.35,
    cayoteTime: 0.15,


};
const sprintThreshold = 0.4; // segundos


let isSprinting = false;

let livesMesh;
const gravity = 0.02;
let velocityY = 0;
let isJumping = false;
let jumpCount = 0;
let jumpStartTime = 0;
const planes = [plane, tiltedPlane];

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
const planeSize = 15;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};
let isWalking = false;




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

let lives = 3; // Starting live
const spawnPosition = new THREE.Vector3(-10, 1, -10); // Spawn position for the cube

let backgroundMusic; // Reference to the background music

let isGameOver = false; // Flag to disable gravity when the game is over

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;

    if (event.key === 'r' && lives === 0) {
        restartGame(); // Restart the game when 'R' is pressed and lives are 0
    }

    if (event.key === 'w' && !isJumping) {
        velocityY = jumpSpeed;
    //console.log("⬇️ Tecla premida:", event.key);
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
        const jumpAudio = new Audio('Audio/jump.wav');
        jumpAudio.volume = 0.5;
        jumpAudio.play();

        if (isJumping) {
            objetoMario.velocityX = currentSpeedX;
        }

        if (jumpCount === 1) velocityY = settings.baseJumpSpeed;
        else if (jumpCount === 2) velocityY = settings.baseJumpSpeed * 1.3;
        else if (jumpCount === 3) {
            velocityY = settings.baseJumpSpeed * 1.65;
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
    //console.log("⬆️ Tecla largada:", event.key);
    keysPressed[event.key] = false;
    if (event.key === 'Shift') {
        isSprinting = false;
    }
});

function restartGame() {
    // Reset lives
    lives = 3;
    updateText(); // Update the lives text
    meshCubo.position.copy(spawnPosition);

    // Ensure the cube is added back to the scene
    if (!cena.children.includes(meshCubo)) {
        cena.add(meshCubo);

function tweakVariables() {
    settings.jumpSpeed = 0.4;
    settings.gravity = 0.05;
    settings.acceleration = 0.2;
    settings.maxSpeed = 0.5;
    settings.smoothingFactor = isJumping ? 0.1 : 0.35; // Mais suave quando a saltar
}


//tweaking de animacoes de salto para melhor experiencia---------------------------


function handleMovement() {


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

    // Reset the cube's visibility
    meshCubo.visible = true;

    // Remove all barrels from the scene
    barrels.forEach((barrel) => {
        cena.remove(barrel);
    });
    barrels.length = 0; // Clear the barrels array

    // Remove the "Game Over" text if it exists
    if (gameOverTextMesh) {
        cena.remove(gameOverTextMesh);
        gameOverTextMesh = null;
    }

    // Remove the "Press R to restart" text if it exists
    if (restartTextMesh) {
        cena.remove(restartTextMesh);
        restartTextMesh = null;
    }

    // Reset the game state
    isGameOverDisplayed = false;
    isGameOver = false; // Reset the game over flag

    // Restart barrel spawning
    barrelSpawnInterval = setInterval(() => {
        spawnBarrel();
    }, 2000);

    // Restart the background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset the music
    }
    playBackgroundMusic(); // Start the background music again
    meshCubo.position.set(-10, 2, -10);
    console.log(meshCubo.position);
    console.log(meshCubo.visible);
    meshCubo.position.set(-10, 2, -10);
    console.log("Game restarted!");

    // Aplica aceleração suavizada, ajustada para ar/solo
    currentSpeedX += (targetSpeed - currentSpeedX) * (0.2 * airControlFactor);
    
    objetoMario.position.x += currentSpeedX;

    // Roda o Mario consoante a direção
   if (currentSpeedX < 0) {
    objetoMario.rotation.y += (-Math.PI / 2 - objetoMario.rotation.y) * 0.15;
} else if (currentSpeedX > 0) {
    objetoMario.rotation.y += (Math.PI / 2 - objetoMario.rotation.y) * 0.15;
}
}

function handleMovement() {
    const raycaster = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);

    raycaster.set(meshCubo.position, downDirection);

    const intersects = raycaster.intersectObjects(planes, true);

    if (intersects.length > 0) {
        if (keysPressed['a']) {
            meshCubo.position.x -= moveSpeed;
            
        }
        if (keysPressed['d']) {
            meshCubo.position.x += moveSpeed;
        }
    }
}

let disableGravityForOneFrame = false;

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
    if (isGameOver || disableGravityForOneFrame) {
        disableGravityForOneFrame = false; // Reset the flag after one frame
        return; // Skip gravity if the game is over or temporarily disabled
    }

    const raycasterDown = new THREE.Raycaster();
    const raycasterUp = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);
    const upDirection = new THREE.Vector3(0, 1, 0);    

    raycasterDown.set(meshCubo.position, downDirection);
    raycasterUp.set(meshCubo.position, upDirection);

    const intersectsDown = raycasterDown.intersectObjects(planes, true);

    const intersectsUp = raycasterUp.intersectObjects(planes, true);

    if (intersectsDown.length > 0) {
        const intersection = intersectsDown[0];
        const floorLevel = intersection.point.y + cubeSize / 2;

        if (meshCubo.position.y > floorLevel || velocityY > 0) {
            velocityY -= gravity;
        } else {
            meshCubo.position.y = floorLevel;
            velocityY = 0;
            isJumping = false;
        }
    } else {
        velocityY -= gravity;
    }

    if (intersectsUp.length > 0) {
        const intersection = intersectsUp[0];
        const ceilingLevel = intersection.point.y - cubeSize / 2;

        if (meshCubo.position.y + velocityY > ceilingLevel) {
            meshCubo.position.y = ceilingLevel; 
            velocityY = Math.min(velocityY, 0);
        }
    }
    meshCubo.position.y += velocityY;
}



// Secção de criação de Espinhos-------------------------------------------------------------

// Criar um grupo para os espinhos
const spikeGroup = new THREE.Group();

// Parâmetros
const spikeBaseRadius = 0.3;
const spikeMinHeight = 0.5;
const spikeMaxHeight = 1.5;
const spacing = 1; // distância entre espinhos

//Material Imports

const loader = new THREE.TextureLoader();

const albedoMap = loader.load('Objetos/textures/metal/albedo.png');

console.log(albedoMap);
const normalMap = loader.load('Objetos/textures/metal/normal.png');
const roughnessMap = loader.load('Objetos/textures/metal/roughness.png');
const metalnessMap = loader.load('Objetos/textures/metal/metallic.png');

const spikeMaterial = new THREE.MeshStandardMaterial({
  map: albedoMap,
  normalMap: normalMap,
  roughnessMap: roughnessMap,
  metalnessMap: metalnessMap,
  metalness: 1, // garante que tem efeito
  roughness: 0.5 // ajustável
 
});
// Criar os 9 espinhos (3x3)
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    // Altura aleatória
    const height = THREE.MathUtils.randFloat(spikeMinHeight, spikeMaxHeight);

    // Geometria do espinho (cone)
    const spikeGeometry = new THREE.ConeGeometry(0.5, height, 4); // 4 segmentos = base quadrada
    spikeGeometry.scale(1, 1.5, 1); // estica mais verticalmente
    const spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);

    // Centralizar a base do cone no chão (por padrão o cone aponta para cima)
    spikeMesh.position.y = (height*1.5) / 2;

    // Posicionar na grid
    spikeMesh.position.x = (col - 1) * spacing;
    spikeMesh.position.z = (row - 1) * spacing;

    // Adicionar ao grupo
    spikeGroup.add(spikeMesh);
  }

 
}
// Adição de uma base quadrada e aro em volta dos espinhos----------------
// Criar a base 
const baseSize = 3.2; // Tamanho da base
const baseHeight = 0.2;
const baseGeometry = new THREE.BoxGeometry(baseSize, baseHeight, baseSize);
const baseMaterial = new THREE.MeshStandardMaterial({
  map: albedoMap,
  normalMap: normalMap,
  roughnessMap: roughnessMap,
  metalnessMap: metalnessMap,
  metalness: 1, // garante que tem efeito
  roughness: 0.5 // ajustável
 
});
const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

// Posicionar a base
baseMesh.position.y = baseHeight / 2 - 0.01;
spikeGroup.add(baseMesh);



// Função para criar um grupo de espinhos
function createSpikeGroup(x, z, numSpikes = 9) {
  // Criar um grupo para os espinhos
  const spikeGroup = new THREE.Group();

  // Parâmetros para os espinhos
  const spikeMinHeight = 0.5;
  const spikeMaxHeight = 1.5;
  const spacing = 1; // distância entre os espinhos

  // Criar os espinhos dentro do grupo
  for (let row = 0; row < Math.sqrt(numSpikes); row++) { // Aqui estamos criando 9 espinhos (3x3)
    for (let col = 0; col < Math.sqrt(numSpikes); col++) {
      // Altura aleatória para o espinho
      const height = THREE.MathUtils.randFloat(spikeMinHeight, spikeMaxHeight);

      // Geometria do espinho (cone)
      const spikeGeometry = new THREE.ConeGeometry(0.5, height, 4); // 4 segmentos = base quadrada
      spikeGeometry.scale(1, 1.5, 1); // estica mais verticalmente

      // Criar o material para o espinho
      const spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);

      // Centralizar a base do cone no chão
      spikeMesh.position.y = height / 2;

      // Posicionar na grid
      spikeMesh.position.x = (col - 1) * spacing; // Ajusta a posição horizontal
      spikeMesh.position.z = (row - 1) * spacing; // Ajusta a posição vertical

      // Adicionar ao grupo de espinhos
      spikeGroup.add(spikeMesh);
    }
  }

  // Posicionar o grupo de espinhos na posição especificada
  spikeGroup.position.set(x, 0, z); // Coloca o grupo no ponto desejado

  // Adicionar o grupo de espinhos ao cenário
  scene.add(spikeGroup);
}


//------------------------------------------------------------------------





let gameOverTextMesh; // Reference to the "Game Over" text mesh
let restartTextMesh; // Reference to the "Press R to restart" text mesh
let isGameOverDisplayed = false; // Flag to ensure "Game Over" is displayed only once

function displayGameOverText() {
    if (!loadedFont || isGameOverDisplayed) return; // Ensure the font is loaded and text is not already displayed

    // Stop the background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset the music
    }

    // Play the game over sound
    const gameOverSound = new Audio('Audio/gameOver.wav');
    gameOverSound.volume = 0.7;
    gameOverSound.play();

    // Set the game over flag
    isGameOver = true;

    // Create "Game Over" text geometry
    const gameOverGeometry = new TextGeometry("Game Over", {
        font: loadedFont,
        size: 1, // Size of the text
        height: 0.3, // Depth of the text
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
    });

    // Create a material for the "Game Over" text
    const gameOverMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red color for "Game Over"
    gameOverTextMesh = new THREE.Mesh(gameOverGeometry, gameOverMaterial);

    // Initial position of the "Game Over" text
    gameOverTextMesh.position.set(-6.5, 8, -100); // Start far from the camera
    gameOverTextMesh.scale.set(1, 1, 1);

    // Add the "Game Over" text to the scene
    cena.add(gameOverTextMesh);

    isGameOverDisplayed = true; // Set the flag to true

    // Animate the "Game Over" text moving closer to the camera
    const startTime = performance.now();
    const animationDuration = 3500; // 7 seconds
    const targetPositionZ = -50; // Final position closer to the camera

    function animateGameOverText() {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1); // Clamp progress to [0, 1]

        // Interpolate the Z position of the text
        gameOverTextMesh.position.z = -100 + (targetPositionZ + 100) * progress;

        if (progress < 1) {
            requestAnimationFrame(animateGameOverText); // Continue animation
        } else {
            // Once the animation is complete, display the "Press R to restart" text
            displayRestartText();
        }
    }

    animateGameOverText();
}

function displayRestartText() {
    // Create "Press R to restart" text geometry
    const restartGeometry = new TextGeometry("Press R to restart", {
        font: loadedFont,
        size: 0.2, // Smaller size for the text
        height: 0.2, // Depth of the text
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.01,
        bevelSegments: 3,
    });

    // Create a material for the "Press R to restart" text
    const restartMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // White color for the smaller text
    restartTextMesh = new THREE.Mesh(restartGeometry, restartMaterial);

    // Position and scale the "Press R to restart" text
    restartTextMesh.position.set(-2.5, 7, -50); // Position it below the "Game Over" text
    restartTextMesh.scale.set(1, 1, 1);

    // Add the "Press R to restart" text to the scene
    cena.add(restartTextMesh);

    isGameOverDisplayed = true; // Set the flag to true
}

function applyBarrelPhysics() {
    barrels.forEach((barrel, index) => {
        const raycaster = new THREE.Raycaster();
        const downDirection = new THREE.Vector3(0, -1, 0);

        raycaster.set(barrel.position, downDirection);

        const intersects = raycaster.intersectObjects(planes, true);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const floorLevel = intersection.point.y;
            const intersectedPlane = intersection.object;

            const barrelBoundingBox = new THREE.Box3().setFromObject(barrel);
            const barrelBottomY = barrelBoundingBox.min.y;

            const distanceToPlane = Math.abs(barrelBottomY - floorLevel);

            if (distanceToPlane < 0.01) {
                const tiltAngleX = intersectedPlane.rotation.y;

                if (tiltAngleX > 0) {
                    barrel.position.x += Math.sin(tiltAngleX) * barrel.userData.speed; // Roll to the right
                } else if (tiltAngleX < 0) {
                    barrel.position.x -= Math.sin(tiltAngleX) * -barrel.userData.speed; // Roll to the left
                }
            }

            // Update the barrel's vertical position
            if (barrelBottomY > floorLevel || barrel.userData.velocityY > 0) {
                barrel.userData.velocityY -= barrel.userData.gravity;
            } else {
                barrel.position.y += floorLevel - barrelBottomY;
                barrel.userData.velocityY = 0;
            }
            barrel.position.y += barrel.userData.velocityY;
        } else {
                        barrel.userData.velocityY -= barrel.userData.gravity;
            barrel.position.y += barrel.userData.velocityY;
        }

        const barrelBoundingBox = new THREE.Box3().setFromObject(barrel);
        const cubeBoundingBox = new THREE.Box3().setFromObject(meshCubo);

        if (barrelBoundingBox.intersectsBox(cubeBoundingBox)) {
            // Reduce lives and handle respawn or game over
            lives--;
            console.log(`Lives remaining: ${lives}`);
            updateText();

            if (lives > 0) {
                // Move the cube to the spawn position
                meshCubo.position.copy(spawnPosition);
            } else {

                meshCubo.position.set(0, 1000, -10);
                console.log("Game Over!");
                let DieMusic = new Audio('Audio/death.wav');

                DieMusic.volume = 0.5;
                DieMusic.play();

                // Stop spawning barrels
                clearInterval(barrelSpawnInterval);

                // Display "Game Over" text
                displayGameOverText();
            }

            // Remove the barrel
            breakBarrel(barrel);
            barrels.splice(index, 1);
        }

        if (barrel.position.y < 0) {
            breakBarrel(barrel);
            barrels.splice(index, 1);
        }
    });
}

function breakBarrel(barrel) {
    const fragments = [];

    const audio = new Audio('Audio/barrel.mp3');
    audio.volume = 0.1;
    audio.play();

    for (let i = 0; i < 10; i++) {
        const fragmentGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const fragmentMaterial = new THREE.MeshStandardMaterial({ color: 0x856b4a });
        const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);

        fragment.position.copy(barrel.position);

        fragment.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        fragment.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.2,
            Math.random() * 0.2, 
            Math.random() * 0.2  
        );

        cena.add(fragment);
        fragments.push(fragment);
    }

    cena.remove(barrel);

    const fragmentLifetime = 2;
    const movementTime = 0.75
    const startTime = performance.now();

    function animateFragments() {
        const elapsedTime = (performance.now() - startTime) / 1000;

        if (elapsedTime < fragmentLifetime) {
            fragments.forEach((fragment) => {
                fragment.userData.velocity.y -= gravity;
                if((elapsedTime < movementTime)) {
                    
                    fragment.position.add(fragment.userData.velocity);
                    
                    fragment.rotation.x += fragment.userData.rotationSpeed.x;
                    fragment.rotation.y += fragment.userData.rotationSpeed.y;
                    fragment.rotation.z += fragment.userData.rotationSpeed.z
                }
                
                const floorLevel = plane.position.y;
                if (fragment.position.y < floorLevel) {
                    fragment.position.y = floorLevel;
                    fragment.userData.velocity.y = 0;
                }
            });

            requestAnimationFrame(animateFragments);
        } else {
            fragments.forEach((fragment) => cena.remove(fragment));
        }
    }

    animateFragments();
}

const barrels = [];

function spawnBarrel() {
    const barrelWood = makeBarrel(0.7, 1, 2.5)

    let m = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("./Texturas/woodBarreltexture.jpg")})
    m.lightMap = new THREE.TextureLoader().load("./Texturas/woodBarreltexture.jpg")
    let barrel = new THREE.Mesh(barrelWood, m)
    barrel.castShadow = true;  

    const bandGeometry = new THREE.TorusGeometry(0.35, 0.05, 16, 100);
    const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const bandMiddleGeometry = new THREE.TorusGeometry(0.47, 0.05, 16, 100);

    const topBand = new THREE.Mesh(bandGeometry, bandMaterial);
    topBand.rotation.x = Math.PI / 2;
    topBand.position.y = 0.57;
    topBand.castShadow = true;
    barrel.add(topBand);

    const middleBand = new THREE.Mesh(bandMiddleGeometry, bandMaterial);
    middleBand.rotation.x = Math.PI/2;
    middleBand.position.y = 0;
    middleBand.castShadow = true;
    barrel.add(middleBand);

    const bottomBand = new THREE.Mesh(bandGeometry, bandMaterial);
    bottomBand.rotation.x = Math.PI / 2;
    bottomBand.position.y = -0.57;
    bottomBand.castShadow = true;
    barrel.add(bottomBand); 

    barrel.position.set(4, 20, -10);
    barrel.scale.set(1, 1, 1);
    barrel.rotation.y = Math.PI / 2;
    barrel.rotation.z = Math.PI / 2;

    barrel.userData = {
        speed: 1,
        velocityY: 0,
        gravity: 0.02
          };
    
    cena.add(barrel);
    barrels.push(barrel);
}

let barrelSpawnInterval = setInterval(() => {
    spawnBarrel();
}, 2000);

function playBackgroundMusic() {
    backgroundMusic = new Audio('Audio/bacmusic.wav');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    backgroundMusic.play();
}

function makeBarrel(radius, Radius, heigth){
    let barrel = new THREE.CylinderGeometry(1, 1, 2, 24, 32);
    let v3 = new THREE.Vector3();
    let v2 = new THREE.Vector2();
    let pos = barrel.attributes.position;
    let rDiff = Radius - radius;
    for(let i = 0; i < pos.count; i++){
        v3.fromBufferAttribute(pos, i);
        let y = Math.abs(v3.y);
        let rShift = Math.pow(Math.sqrt(1 - (y * y)), 2) * rDiff + radius;
        v2.set(v3.x, v3.z).setLength(rShift);
        v3.set(v2.x, v3.y, v2.y);
        pos.setXYZ(i, v3.x, v3.y, v3.z);}
    barrel.scale(0.5, heigth * 0.25, 0.5);
    barrel.castShadow = true;
    return barrel;
}

let textMesh;
let loadedFont; // Variable to store the loaded font

const loaderText = new FontLoader();
loaderText.load('./Fonts/Daydream_Thin.json', function (font) {
    console.log("Font loaded successfully");
    loadedFont = font; // Store the loaded font for later use
    updateText(); // Call updateText initially to display the text
});

// Define updateText as a global function
function updateText() {
    if (!loadedFont) return; // Ensure the font is loaded before updating the text

    // Remove the old text mesh if it exists
    if (textMesh) {
        cena.remove(textMesh);
    }

    // Create new text geometry with the updated lives
    const textGeometry = new TextGeometry(`Lives -> ${'X'.repeat(lives)}`, {
        font: loadedFont,
        size: 0.5,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
    });

    // Create a new text mesh
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xff6347 });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position and scale the text
    textMesh.scale.set(0.5, 0.5, 0.5);
    textMesh.rotation.x = -Math.PI /7.25;
    textMesh.rotation.y = Math.PI /6.25;
    textMesh.rotation.z = Math.PI /50;
    textMesh.position.set(-19, -5, -18);

    // Add the updated text to the scene
    cena.add(textMesh);
}

function Start() {
    cena.add(meshCubo);


    var luzAmbiente = new THREE.AmbientLight(0x404040, 100);
    cena.add(luzAmbiente);

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

   
    spikeGroup.scale.set(0.1, 0.1, 0.1); // Reduz para 30% do tamanho original
    spikeGroup.position.y = 0.5; // Ajusta a altura dos espinhos
    spikeGroup.position.z = -2; 



    renderer.render(cena, cameraPerspetiva);


    tweakVariables(); // Ajusta as variáveis de movimento e salto para better testing
    

    importer.load('Objetos/MarioModelRigged.fbx', function (object) {

        mixerAnimacao = new THREE.AnimationMixer(object);
       
        
        if (object.animations && object.animations.length > 0) {
        object.animations.forEach((clip) => {
            animations[clip.name] = mixerAnimacao.clipAction(clip);
        });
        }

        const primeira = object.animations[0].name;
        animations[primeira].play();
        currentAction = animations[primeira];

        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        console.log("Animações:", Object.keys(animations));
       
    
        object.scale.x = 0.01;
        object.scale.y = 0.01;
        object.scale.z = 0.01;
    
        object.position.x = 0;
        object.position.y = 0;
        object.position.z = -10;
        
    

        object.velocityX = 0;
        cena.add(object);
        objetoMario = object;

        objetoMario.rotation.y = -Math.PI / 2;
        
        
       
     
    });



    //initParticles(); // Inicializa o sistema de partículas

    requestAnimationFrame(loop);
        applyBarrelPhysics(); 
        applyGravity();
        updateText();
}




let currentAction = null;

let animations = {};

function trocarAnimacao(novaAnimacao, velocidade = 1, blendDuration = 0.1) {
      const action = animations[novaAnimacao];
    if (!action) {
        console.warn("Animação não encontrada:", novaAnimacao);
        return;
    }
    if (currentAction === action) return; // mesma animação, nada a fazer
   // Prepara a nova ação
    action.reset(); // começa do início
    action.setEffectiveTimeScale(velocidade);
    action.setEffectiveWeight(1.0);

    // Faz crossfade a partir da animação anterior
    if (currentAction) {
        action.crossFadeFrom(currentAction, blendDuration, true);
    }

    action.play();
    currentAction = action;
}


let saltoCount = 0;
function loop() {
    //log("Loop iniciado!");

    const delta = relogio.getDelta(); // Get the time elapsed since the last frame
    if (mixerAnimacao) {
        mixerAnimacao.update(delta); // Update the animation mixer
    }


    jumpBufferTimer -= delta;
    if (jumpBufferTimer <= 0) jumpBuffered = false;
    
    updateSprintState(delta); // Atualiza o estado de sprinting
    handleMovement();
    

    cayoteTimer -= delta;
    applyGravity();


      if (isJumping) {
        // Verificar qual animação de salto tocar, dependendo de quantos saltos consecutivos o jogador fez
       if (saltoCount === 0) {
            trocarAnimacao("Jump1", 1); 
    
        } else if (saltoCount === 1) {
            trocarAnimacao("Jump2", 1); 
       
        } else if (saltoCount === 2) {
            trocarAnimacao("Jump3", 1); 
      
        }

        saltoCount++; // Incrementa o contador de saltos

        
    } else if (Math.abs(currentSpeedX) > 0.01) {
       trocarAnimacao("Run", 1, 0.3); // blend mais suave para corrida
        saltoCount = 0; 
    } else {
        saltoCount = 0; 
        trocarAnimacao("idle", 1, 0.3); // blend suave para idle

    }

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