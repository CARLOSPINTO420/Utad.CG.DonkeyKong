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
    smoothingFactor: 0.35,
    cayoteTime: 0.15,


};
const sprintThreshold = 0.4; // segundos


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


function tweakVariables() {
    settings.jumpSpeed = 0.4;
    settings.gravity = 0.04;
    settings.acceleration = 0.2;
    settings.maxSpeed = 0.5;
    settings.smoothingFactor = isJumping ? 0.1 : 0.35; // Mais suave quando a saltar
}


//tweaking de animacoes de salto para melhor experiencia---------------------------


function handleMovement() {


    if (!objetoMario) return;

    const grounded = !isJumping;
    const maxSpeed = isSprinting ? 0.18 : 0.09;
    const airControlFactor = grounded ? 1 : 0.85;

    let targetSpeed = 0;

    if (keysPressed['a']) {
        targetSpeed = -maxSpeed;
    } else if (keysPressed['d']) {
        targetSpeed = maxSpeed;
    }

    const acceleration = grounded ? 0.2 : 0.12;

    
    currentSpeedX += (targetSpeed - currentSpeedX) * acceleration * airControlFactor;
    
    
    objetoMario.position.x += currentSpeedX;

    // Roda o Mario consoante a direção
    if (currentSpeedX < 0) {
        objetoMario.rotation.y += (-Math.PI / 2 - objetoMario.rotation.y) * 0.15;
    } else if (currentSpeedX > 0) {
        objetoMario.rotation.y += (Math.PI / 2 - objetoMario.rotation.y) * 0.15;
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

//Definir Plataformas para teste

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
    baseMesh.position.y = baseHeight / 2 -0.4; 
    spikeGroup.add(baseMesh);


  // Posicionar o grupo de espinhos na posição especificada
  spikeGroup.position.set(x, 0, z); // Coloca o grupo no ponto desejado

  // Adicionar o grupo de espinhos ao cenário
  cena.add(spikeGroup);
}


//------------------------------------------------------------------------





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
    createSpikeGroup(0, -10, 9); // Adiciona os espinhos à cena

   
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