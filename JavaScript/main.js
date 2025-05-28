import * as THREE from 'three';
import {FBXLoader} from 'FBXLoader';
import { FontLoader } from 'FontLoader';
import { TextGeometry } from 'TextGeometry';
import { planeFactory } from './planeFactory.js';
import { createLadder } from './planeFactory.js';
import { barrelFactory } from './BarrelFactory.js';
import { spikeFactory } from './spikeFactory.js';

import { BulletBillSpawner } from './bulletFactory.js';

import { createClimbingZone } from './planeFactory.js';

// Inicializar a cena e o renderer ----
    //Cena
var cena = new THREE.Scene();

    //Renderer
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);
document.body.appendChild(renderer.domElement);

// variaveis globais de luz
var luzAmbiente;
var luzDirecional;

// Inicializar a camera principal
var cameraPerspetiva = new THREE.PerspectiveCamera(75,16/9,0.1,100); 
cameraPerspetiva.position.set(0, 8, 10);

// Câmara Ortográfica
const frustumSize = 50;
const orthoCamera = new THREE.OrthographicCamera(
  frustumSize * (16/9) / -2, frustumSize * (16/9) / 2,
  frustumSize / 2, frustumSize / -2,
  0.1, 1000
);
orthoCamera.position.set(0, 10, 20);

// Controlo da câmara ativa
let activeCamera = cameraPerspetiva; // Começa com a câmara perspetiva

//Grupo para o UI ficar preso entre as camaras e trocar
const uiGroup = new THREE.Group();
activeCamera.add(uiGroup);

// Listener para troca de câmara
window.addEventListener('keydown', (event) => {
 
  switch (event.key.toLowerCase()) {
    case 'x': // tecla A → toggle luz ambiente
      luzAmbiente.visible = !luzAmbiente.visible;
      console.log('Luz ambiente:', luzAmbiente.visible ? 'ligada' : 'desligada');
      break;

    case 'z': // tecla D → toggle luz direcional
      luzDirecional.visible = !luzDirecional.visible;
      console.log('Luz direcional:', luzDirecional.visible ? 'ligada' : 'desligada');
      break;
  }
});
// Funcao que atualiza a posição do UIGroup consoante a câmara ativa
// Esta função é chamada quando a câmara é trocada
function updateUIPositionsForCamera(type) {
  if (type === 'perspective') {
    textMesh.position.set(-6.5, -3.5, -5);
  } else {
    textMesh.position.set(-20, -15, 0); // canto inferior esquerdo da orthoCamera
  }
}

// Criar o plano de Chao ----
    // Criar o plano
var floorPlaneGeometry = new THREE.PlaneGeometry(70, 50);
var floorPlaneMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 });
var floorPlane = new THREE.Mesh(floorPlaneGeometry, floorPlaneMaterial);
floorPlane.rotation.x = - Math.PI / 2; 
floorPlane.position.y = 0; 
floorPlane.receiveShadow = true;

    // Criar bordas do plano
var floorPlaneEdges = new THREE.EdgesGeometry(floorPlaneGeometry);
var floorPlaneEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,linewidth: 10 });
var floorPlaneEdgeLines = new THREE.LineSegments(floorPlaneEdges, floorPlaneEdgeMaterial);
floorPlane.add(floorPlaneEdgeLines);
floorPlane.name = "Chao"; // Nome do plano de chao
   // Adicionar plano a cena
cena.add(floorPlane);

let relogio = new THREE.Clock();
let objetoMario = null;
let caixaInvisivel = null;
let mixerAnimacao = null;

// Inicializar variaveis globais

let barrelSpawnInterval;

const planes = []; // Array de planos para o raycast da gravidade
planes.push(floorPlane); // Adicionar o plano de chao ao array de planos


// Teste experimental de plataformas com boundingBoxes

//-----------------------------------------------

// Variaveis de movimentacao e salto
let settings = {
    baseJumpSpeed: 0.75,
    gravity: 0.05,
    maxSpeed: 0.18,
    acceleration: 0.3,
    smoothingFactor: 0.35,
    cayoteTime: 0.15,
};

//variaveis de escada
let isClimbingLadder = false;


// variaveis de Sprint
const sprintThreshold = 0.4;
let isSprinting = false;

// Variaveis de salto
let jumpSpeed = 2;
const gravity = 0.05;
let velocityY = 0;
let isJumping = false;
let jumpCount = 0;
let currentSpeedX = 0;
const sprintJumpXSpeed = 0.4;
let cayoteTimer = 0;
let jumpBuffered = false;
let jumpBufferTimer = 0;
const jumpBufferTime = 0.2; // Tempo máximo para fazer buffer salto (em segundos)
let lastGroundTime = 0;     // Tempo do último salto
let lastJumpTime = 0; // Tempo do último salto para multi-jump
const multiJumpWindow = 1.5; // segundos
let lastJumpSequenceTime = 0;

// Variaveis de teclas pressionadas
const keysPressed = {};

// Variaveis de corrida
let runTimer = 0;

// Variaveis de Game Loop
let lives = 3;
let isGameOver = false; // Flag to disable gravity when the game is over

// Posição de spawn do Mario
const spawnPosition = new THREE.Vector3(0, 25, -10);

// Variaveis de texto do GameOver e do Restart
let gameOverTextMesh;
let restartTextMesh;
let isGameOverDisplayed = false;

// Criar Spikes
let spikes = spikeFactory();
cena.add(spikes);

// Variaveis de Barris
const barrels = [];
const spawnBarrel = new THREE.Vector3(0,2,-10); //Posicao de spaw de barris

// Variaveis de Texto
let textMesh;
let loadedFont;

//
let disableGravityForOneFrame = false;

// load SoundFX
const jumpAudio = new Audio('Audio/jump.wav');
const backgroundMusic = new Audio('Audio/bacmusic.wav');
const audio = new Audio('Audio/barrel.mp3');

function performJump() {
      const now = relogio.getElapsedTime();

    // Só resetar jumpCount se passou tempo demais desde o último salto E o Mario está no chão (não pulando)
    if ((now - lastJumpSequenceTime > multiJumpWindow) && !isJumping) {
        jumpCount = 0;
    }

    lastJumpTime = now;
    lastJumpSequenceTime = now;

    isJumping = true;
    jumpAudio.volume = 0.5;
    jumpAudio.play();

    if (jumpCount === 0) velocityY = settings.baseJumpSpeed;
    else if (jumpCount === 1) velocityY = settings.baseJumpSpeed * 1.2;
    else if (jumpCount === 2) {
        velocityY = settings.baseJumpSpeed * 1.45;
        jumpCount = -1; // pra voltar a 0 no próximo salto
    }

    jumpCount += 1;

    objetoMario.velocityX = 0;

    if (isSprinting) {
        if (keysPressed['a']) objetoMario.velocityX = -sprintJumpXSpeed;
        else if (keysPressed['d']) objetoMario.velocityX = sprintJumpXSpeed;
    }
}

// KeyLogger
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;

    if (event.key === 'r' && lives === 0) {
        restartGame(); // Restart the game when 'R' is pressed and lives are 0
    }

      if (event.key === 'Shift') {
        isSprinting = true;
    }

 if (event.key === ' ' ) {
  
        jumpBuffered = true;
        jumpBufferTimer = jumpBufferTime;

       
    }
});

document.addEventListener('keyup', (event) => {
      console.log("⬆️ Tecla largada:", event.key);
    keysPressed[event.key] = false;
    if (event.key === 'Shift') {
        isSprinting = false;
    }
});

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

function restartGame() {
    // Reset lives
    lives = 3;
    updateText(); // Update the lives text
    objetoMario.position.copy(spawnPosition);

    // Ensure the cube is added back to the scene
    if (!cena.children.includes(objetoMario)) {
        cena.add(objetoMario);
    }
}

function tweakVariables() {
    settings.jumpSpeed = 0.3;
    settings.gravity = 0.03;
    settings.acceleration = 0.2;
    settings.maxSpeed = 0.45;
    settings.smoothingFactor = isJumping ? 0.1 : 0.35; // Mais suave quando a saltar
}

function handleMovement() {
    if (!objetoMario) return;

    const grounded = !isJumping;
    const maxSpeed = isSprinting ? 0.18 : 0.09;
    const airControlFactor = grounded ? 1 : 0.85; // Menos controlo no ar

    let targetSpeed = 0;

    if (keysPressed['a']) {
        targetSpeed = -maxSpeed;
    } else if (keysPressed['d']) {
        targetSpeed = maxSpeed;
    }else if(keysPressed['r']) {
        objetoMario.visible = true;

    //Remove all barrels from the scene
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

    // Restart the background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset the music
    }
    playBackgroundMusic(); // Start the background music again
    objetoMario.position.set(-10, 2, -10);
    }

    const acceleration = grounded ? 0.2 : 0.12;

    // Aplica aceleração suavizada, ajustada para ar/solo
    currentSpeedX += (targetSpeed - currentSpeedX) * acceleration * airControlFactor;
    
    objetoMario.position.x += currentSpeedX;

    // Roda o Mario consoante a direção
   if (currentSpeedX < 0) {
    objetoMario.rotation.y += (-Math.PI / 2 - objetoMario.rotation.y) * 0.15;
    } else if (currentSpeedX > 0) {
    objetoMario.rotation.y += (Math.PI / 2 - objetoMario.rotation.y) * 0.15;
}
} 

let wasGrounded = false; // variável global para guardar estado anterior

function applyGravity(delta) {
 if (!objetoMario) return;
  if (isClimbingLadder) {
        velocityY = 0;
        return; // Não aplica gravidade se estiver a subir escada
    }

  

    let grounded = false;



    const raycasterDown = new THREE.Raycaster();

    const downDirection = new THREE.Vector3(0, -1, 0);

  

    const marioBox = new THREE.Box3().setFromObject(caixaInvisivel);

    const marioHeight = marioBox.max.y - marioBox.min.y;

    const marioHalfHeight = marioHeight / 2;

  

     const rayOrigin = objetoMario.position.clone();

 
  

    raycasterDown.set(rayOrigin, downDirection);  

    const intersectsDown = raycasterDown.intersectObjects(planes, true);  

    if (intersectsDown.length > 0) {

        const intersection = intersectsDown[0];

        const floorLevel = intersection.point.y + marioHalfHeight/2;

        // Verifica se está acima do chão

        if (objetoMario.position.y + velocityY > floorLevel) {

            velocityY -= gravity;

            objetoMario.position.y += velocityY;

            isJumping = true;

            grounded = false;

        } else {

            // Corrige a posição no chão

            velocityY = 0;

            isJumping = false;

            grounded = true;

            lastGroundTime = relogio.getElapsedTime();

        }

    } else {

        // No ar, sem chão por baixo

        velocityY -= gravity;

        objetoMario.position.y += velocityY;

        grounded = false;

        isJumping = true;

    }

    if (grounded && !isJumping) {
        lastGroundTime = relogio.getElapsedTime();
    }

    // Atualiza o timer do buffer
    if (jumpBuffered) {
        jumpBufferTimer -= delta; // deltaTime é o tempo entre frames

        // Se o buffer expirou, cancela
        if (jumpBufferTimer <= 0) {
            jumpBuffered = false;
        }
    }

 if (!isJumping && jumpBuffered) {
    performJump();
    jumpBuffered = false;
}
  

    if (isGameOver || disableGravityForOneFrame) {

        disableGravityForOneFrame = false;

        return;

    }

}


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
        depth: 0.3, // Depth of the text
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
    gameOverTextMesh.position.set(-6.5, 8, -5); // Start far from the camera
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
        depth: 0.2, // Depth of the text
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
    restartTextMesh.position.set(-2.5, 7, -3); // Position it below the "Game Over" text
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
        const cubeBoundingBox = new THREE.Box3().setFromObject(objetoMario);

        if (barrelBoundingBox.intersectsBox(cubeBoundingBox)) {
            // Reduce lives and handle respawn or game over
            lives--;
            updateText();
            if (lives > 0) {
                objetoMario.position.copy(spawnPosition);
            } else {

                objetoMario.position.set(1000,1000,1000);
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

        if (barrel.position.y <= floorPlane.position.y + 0.5) {
            breakBarrel(barrel);
            barrels.splice(index, 1);
        }
    });
}

function breakBarrel(barrel) {
    const fragments = [];
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
                
                const floorLevel = floorPlane.position.y;
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


function playBackgroundMusic() {
    
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    backgroundMusic.play();
}

// Fonte de UI para as Vidas
const loaderText = new FontLoader();
loaderText.load('./Fonts/Daydream_Thin.json', function (font) {
    loadedFont = font;
    updateText();
});

// Atualizar o texto de vidas
function updateText() {
    if (!loadedFont) return;

    if (textMesh) {
        cena.remove(textMesh);
    }

    const textGeometry = new TextGeometry(`Lives -> ${'X'.repeat(lives)}`, {
        font: loadedFont,
        size: 0.5,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
    });

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0x4B0082 });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.material.depthTest = false; // Disable depth test to ensure text is always visible

    textMesh.scale.set(0.5, 0.5, 0.5);
    textMesh.rotation.x = -Math.PI /7.25;
    textMesh.rotation.y = Math.PI /6.25;
    textMesh.rotation.z = Math.PI /50;
    textMesh.position.set(-6.5, -3.5, -5);

    console.log(lives)
    uiGroup.add(textMesh);
   // cameraPerspetiva.add(textMesh);
}

let currentAction = null;
let saltoCount = 0;
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

Start();

let boxHelper;

function Start() {
    // Adicionar Luz Ambiente
    luzAmbiente = new THREE.AmbientLight(0x404040, 100);
    cena.add(luzAmbiente);

    // Adicionar Luz Direcional
    luzDirecional = new THREE.DirectionalLight(0xffffff, 2);
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

    // Ajustar Variaves dos Spikes
    spikes.scale.set(0.1, 0.1, 0.1);
    spikes.position.y = 0.5;
    spikes.position.z = -2; 

    cena.add(cameraPerspetiva);

    tweakVariables(); // Ajusta as variáveis de movimento e salto para better testing

    // ----
    // Importar o Mario
    const importer = new FBXLoader();
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
        object.scale.x = 0.01;
        object.scale.y = 0.01;
        object.scale.z = 0.01;

        const box = new THREE.Box3().setFromObject(object);
        object.traverse(function(child) {
            if (child.isMesh) {
                child.position.y -= box.min.y;
            }
        });
    objetoMario = object;
    objetoMario.position.copy(spawnPosition);
    cena.add(objetoMario);

    var caixa = new THREE.BoxGeometry(100,200,100);
   const invisibleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0 // totalmente invisível
    });
     caixaInvisivel = new THREE.Mesh(caixa, invisibleMaterial);

     caixaInvisivel.position.y += 90;

    objetoMario.add(caixaInvisivel);

         boxHelper = new THREE.BoxHelper(caixaInvisivel, 0xffff00);
  cena.add(boxHelper);

    barrelSpawnInterval = setInterval(() => {
        let newBarrel = barrelFactory(new THREE.Vector3(0, 5, -10));
        cena.add(newBarrel);
        barrels.push(newBarrel);
    }, 2000);
    applyBarrelPhysics(); 
    applyGravity();
    updateText();

    lastJumpSequenceTime = relogio.getElapsedTime();
    
    requestAnimationFrame(loop);

    });
    
}



// Define a posição onde a escada será colocada
const ladderPosition = new THREE.Vector3(15, 13, -11.5); // escada em -11.5

// Cria a escada
const ladder = createLadder(ladderPosition, 37, 2, 2);

// Adiciona a escada à cena
cena.add(ladder);

// Cria a bounding box manualmente em z = -10
const ladderBoundingBoxes = [];
const ladderBoxSize = { x: 2, y: 38, z: 2 }; // usa os mesmos valores do createLadder
const ladderBoxCenter = new THREE.Vector3(15, 13 + ladderBoxSize.y / 2, -10); // centro da box em z = -10

const ladderBox = new THREE.Box3().setFromCenterAndSize(
    ladderBoxCenter,
    new THREE.Vector3(ladderBoxSize.x, ladderBoxSize.y, ladderBoxSize.z)
);
ladderBoundingBoxes.push(ladderBox);

function checkLadderClimb() {
    if (!objetoMario) return;
    if(!ladderBoundingBoxes) return; // Verifica se as bounding boxes da escada existem
    isClimbingLadder = false; // Reset a cada frame

    const marioBox = new THREE.Box3().setFromObject(objetoMario);

    for (let i = 0; i < ladderBoundingBoxes.length; i++) {
        if (ladderBoundingBoxes[i].intersectsBox(marioBox)) {
            isClimbingLadder = true;
            objetoMario.position.y += 0.12; // Velocidade de subida
            // trocarAnimacao("Climb", 1, 0.2); // Se tiveres animação de subir
            break;
        }
    }
}




function loop() {
    if (!objetoMario) return;  // não tenta fazer nada até o Mario estar pronto

    const delta = relogio.getDelta();
    if (mixerAnimacao) {
        mixerAnimacao.update(delta);
    }

     if (boxHelper) boxHelper.update();  // atualiza o boxHelper para seguir o Mario

    jumpBufferTimer -= delta;
    if (jumpBufferTimer <= 0) jumpBuffered = false;

    applyBarrelPhysics();
    updateSprintState(delta);
    handleMovement();
    cayoteTimer -= delta;
    checkLadderClimb();
    applyGravity(delta);
      if (isJumping) {
       if (saltoCount === 0) {
            trocarAnimacao("Jump1", 1); 
        } else if (saltoCount === 1) {
            trocarAnimacao("Jump2", 1);      
        } else if (saltoCount === 2) {
            trocarAnimacao("Jump3", 1); 
        }
        saltoCount++;
    } else if (Math.abs(currentSpeedX) > 0.01) {
       trocarAnimacao("Run", 1, 0.3);
        saltoCount = 0; 
    } else {
        saltoCount = 0; 
        trocarAnimacao("idle", 1, 0.3);
    }


    // Atualizar posição da câmara ortográfica para seguir o jogador no eixo Y
    orthoCamera.position.y = objetoMario.position.y;
    orthoCamera.lookAt(objetoMario.position.x, objetoMario.position.y, objetoMario.position.z);

    // Renderizar cena com a câmara principal (ecrã inteiro)
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
  
     
    renderer.render(cena, activeCamera);
    cameraPerspetiva.position.set(objetoMario.position.x, objetoMario.position.y + 5, 10);

    // Agora renderizar o minimapa
    const miniWidth = window.innerWidth / 5;
    const miniHeight = window.innerHeight / 5;

    renderer.setViewport(window.innerWidth - miniWidth - 10, 10, miniWidth, miniHeight); // canto inferior direito
    renderer.setScissor(window.innerWidth - miniWidth - 10, 10, miniWidth, miniHeight);
    renderer.setScissorTest(true);
    renderer.setClearColor(0x000000, 1); // fundo preto no minimapa
    renderer.clearDepth(); // limpar Z-buffer antes do segundo render

    renderer.render(cena, orthoCamera);

   
    requestAnimationFrame(loop);


     // spawner.update();
}

// Inicializacao das plataformas

let tiltedPlane = planeFactory(new THREE.Vector3(-15, 5, -10), -Math.PI / 50, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(15, 13, -10), 0, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-2, 8, -10), 0, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(8, 10, -10), 0, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(5, 18, -10), 0, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-5, 20, -10), 0, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-15, 20, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-25, 24, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-15, 29, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);


//Primeira Plataforma onde o jogar tem de usar a mecanica de double ou triple jump


tiltedPlane = planeFactory(new THREE.Vector3(-25, 36, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-15, 43, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-3, 46, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(10, 50, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
//Checkpoint nesta plataforma

tiltedPlane = planeFactory(new THREE.Vector3(0, 60, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-8, 68, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

//*//


tiltedPlane = planeFactory(new THREE.Vector3(-34, 70, -10), Math.PI, 30);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-50, 75, -10), Math.PI, 15);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-30, 85, -10), Math.PI, 50);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-30, 95, -10), Math.PI, 50);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-2, 89, -10), Math.PI, 1);
cena.add
tiltedPlane = planeFactory(new THREE.Vector3(-2, 89, -10), Math.PI, 1);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-60, 103, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

//2nd Checkpoint nesta plataforma

//Plataforma de Apoio
tiltedPlane = planeFactory(new THREE.Vector3(10, 108, -10), Math.PI, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
//Plataforma de Apoio


tiltedPlane = planeFactory(new THREE.Vector3(-30, 110, -10), Math.PI, 40);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-40, 117, -10), -Math.PI/70, 5);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-36, 122, -10), -Math.PI/70, 5);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-30, 127, -10), -Math.PI/70, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);



tiltedPlane = planeFactory(new THREE.Vector3(-28, 132, -10), -Math.PI/70, 5);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-24, 137, -10), -Math.PI/70, 5);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-18, 142, -10), -Math.PI/70, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(0, 115, -10), -Math.PI/70, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(10, 120, -10), -Math.PI/70, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(7, 127, -10), Math.PI/70, 3);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(9, 138, -10), -Math.PI/70, 3);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(12, 143, -10), -Math.PI/70, 3);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(0, 152, -10), Math.PI, 20);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
//Ultimo checkpoint nesta plataforma

//Ultimas adicoes de plataformas
tiltedPlane = planeFactory(new THREE.Vector3(4, 75, -10), Math.PI, 7);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(8, 86, -10), Math.PI, 7);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(-1.3, 95, -10), Math.PI/30, 3 );
cena.add(tiltedPlane);
planes.push(tiltedPlane);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Paredes verticais com extensao
tiltedPlane = planeFactory(new THREE.Vector3(-10, 30, -10), Math.PI/2, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
tiltedPlane = planeFactory(new THREE.Vector3(-10, 38.25, -10), Math.PI/2, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
//*//
tiltedPlane = planeFactory(new THREE.Vector3(-13, 73, -10), Math.PI/2, 2);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
tiltedPlane = planeFactory(new THREE.Vector3(-14, 73, -10), Math.PI/2, 2);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
tiltedPlane = planeFactory(new THREE.Vector3(-15, 73, -10), Math.PI/2, 2);
cena.add(tiltedPlane);
planes.push(tiltedPlane);
tiltedPlane = planeFactory(new THREE.Vector3(-17, 73, -10), Math.PI/2, 2);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(15, 135, -10), Math.PI/2, 30);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

tiltedPlane = planeFactory(new THREE.Vector3(0, 90, -10), Math.PI/2, 10);
cena.add(tiltedPlane);
planes.push(tiltedPlane);

//Se tiverem algum problema com as plataformas, podem dar spawn ao Mario na altura que acharem melhor
//e depois dai podem ver qual linha de codigo corresponde a cada plataforma


