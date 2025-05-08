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
meshCubo.translateX(-10);

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
tiltedPlane.position.set(0, 1, -10);
tiltedPlane.receiveShadow = true;
tiltedPlane.castShadow = true;
cena.add(tiltedPlane);

//Adiciona bordas ao chao
var planeEdges = new THREE.EdgesGeometry(planeGeometry);
var planeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,linewidth: 10 });
var planeEdgeLines = new THREE.LineSegments(planeEdges, planeEdgeMaterial);
plane.add(planeEdgeLines);

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

function applyBarrelPhysics() {
    barrels.forEach((barrel, index) => {
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        const downDirection = new THREE.Vector3(0, -1, 0); // Ray points downward

        // Set the raycaster's origin and direction
        raycaster.set(barrel.position, downDirection);

        // Check for intersections with planes
        const intersects = raycaster.intersectObjects(planes, true); // 'planes' is an array of all planes

        if (intersects.length > 0) {
            // Get the closest intersected object
            const intersection = intersects[0];
            const floorLevel = intersection.point.y; // Y-coordinate of the intersection point
            const intersectedPlane = intersection.object;

            // Calculate the barrel's bottom position
            const barrelBoundingBox = new THREE.Box3().setFromObject(barrel);
            const barrelBottomY = barrelBoundingBox.min.y;

            // Apply gravity
            if (barrelBottomY > floorLevel || barrelVelocityY > 0) {
                barrelVelocityY -= barrelGravity; // Apply gravity
            } else {
                barrel.position.y += floorLevel - barrelBottomY; // Clamp to floor level
                barrelVelocityY = 0; // Stop vertical movement
            }
            // Update the barrel's vertical position
            barrel.position.y += barrelVelocityY;

            // Check the tilt of the intersected plane
            const tiltAngleX = THREE.MathUtils.radToDeg(intersectedPlane.rotation.x);
            const tiltAngleZ = THREE.MathUtils.radToDeg(intersectedPlane.rotation.z);

            // Apply rolling motion if the tilt exceeds 10 degrees
            if (Math.abs(tiltAngleX) > 10) {
                const rollAccelerationZ = Math.sin(intersectedPlane.rotation.x) * 0.05; // Adjust rolling speed
                barrel.position.x -= rollAccelerationZ;
//                barrel.rotation.x += rollAccelerationZ / 0.5; // Simulate rolling
            }

            if (Math.abs(tiltAngleZ) > 10) {
                const rollAccelerationX = Math.sin(intersectedPlane.rotation.z) * 0.05; // Adjust rolling speed
                barrel.position.x -= rollAccelerationX;
//                barrel.rotation.x += rollAccelerationX / 0.5; // Simulate rolling
            }
        } else {
            // If no intersection, let the barrel fall indefinitely
            barrelVelocityY -= barrelGravity;
            barrel.position.y += barrelVelocityY;
        }

        // Check for collision with the cube
        const barrelBoundingBox = new THREE.Box3().setFromObject(barrel);
        const cubeBoundingBox = new THREE.Box3().setFromObject(meshCubo);

        if (barrelBoundingBox.intersectsBox(cubeBoundingBox)) {
            // Destroy the barrel on collision
            breakBarrel(barrel);
            barrels.splice(index, 1); // Remove barrel from the array
        }

        // Destroy the barrel if it falls below the floor
        if (barrel.position.y < 0) {
            breakBarrel(barrel); // Trigger the breaking effect
            barrels.splice(index, 1); // Remove barrel from the array
        }
    });
}

function breakBarrel(barrel) {
    const fragments = []; // Array to store fragments

    // Create fragments
    for (let i = 0; i < 10; i++) {
        const fragmentGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3); // Small cube fragments
        const fragmentMaterial = new THREE.MeshStandardMaterial({ color: 0x856b4a });
        const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);

        // Set fragment position to the barrel's position
        fragment.position.copy(barrel.position);

        // Add random velocity and rotation
        fragment.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3, // Random X velocity
            Math.random() * 0.3,         // Random Y velocity
            (Math.random() - 0.5) * 0.3  // Random Z velocity
        );
        fragment.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.2, // Random X rotation speed
            Math.random() * 0.2, // Random Y rotation speed
            Math.random() * 0.2  // Random Z rotation speed
        );

        cena.add(fragment);
        fragments.push(fragment);
    }

    // Remove the original barrel
    cena.remove(barrel);

    // Animate fragments
    const fragmentLifetime = 2;
    const movementTime = 0.75
    const startTime = performance.now();

    function animateFragments() {
        const elapsedTime = (performance.now() - startTime) / 1000;

        if (elapsedTime < fragmentLifetime) {
            fragments.forEach((fragment) => {
                // Apply gravity
                fragment.userData.velocity.y -= gravity;
                if((elapsedTime < movementTime)) {
                    // Apply velocity
                    fragment.position.add(fragment.userData.velocity);
                    
                    // Apply rotation
                    fragment.rotation.x += fragment.userData.rotationSpeed.x;
                    fragment.rotation.y += fragment.userData.rotationSpeed.y;
                    fragment.rotation.z += fragment.userData.rotationSpeed.z
                }
                

                const floorLevel = plane.position.y; // Assuming the floor is the main plane
                if (fragment.position.y < floorLevel) {
                    fragment.position.y = floorLevel; // Clamp to floor level
                    fragment.userData.velocity.y = 0; // Stop vertical movement
                }
            });

            requestAnimationFrame(animateFragments);
        } else {
            // Remove fragments from the scene
            fragments.forEach((fragment) => cena.remove(fragment));
        }
    }

    animateFragments();
}

const barrels = []; // Array to store all barrels

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
    // Position and add the barrel to the scene
    barrel.position.set(-4, 7, -10); // Spawn position
    barrel.scale.set(1, 1, 1);
    barrel.rotation.y = Math.PI / 2;
    barrel.rotation.z = Math.PI / 2;
    
    cena.add(barrel); // Add barrel to the scene
    barrels.push(barrel);
}

setInterval(() => {spawnBarrel();}, 2000);

function playBackgroundMusic() {
    const audio = new Audio('Audio/BackGround.mp3'); // Path to your audio file
    audio.loop = true; // Loop the music
    audio.volume = 0.5; // Set volume (0.0 to 1.0)
    audio.play();
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
    pos.setXYZ(i, v3.x, v3.y, v3.z);
  }
  barrel.scale(0.5, heigth * 0.25, 0.5);
  barrel.castShadow = true;
  return barrel;
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
    playBackgroundMusic();
    function loop() {
        handleMovement(); 
        applyGravity();
        applyBarrelPhysics(); 
        renderer.render(cena, cameraPerspetiva);
        requestAnimationFrame(loop);
    }
    loop();
}