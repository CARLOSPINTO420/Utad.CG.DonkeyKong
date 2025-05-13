import * as THREE from 'three';
import {FBXLoader} from 'FBXLoader';

document.addEventListener('DOMContentLoaded', Start);

var mixerAnimacao;
var importer = new FBXLoader();

var cena = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;

var cameraPerspetiva = new THREE.PerspectiveCamera(60,16/9,0.1,100); 
cameraPerspetiva.position.set(0, 8, 10);

const livesDisplay = document.getElementById('lives');

renderer.setSize(window.innerWidth - 15, window.innerHeight - 80);
renderer.setClearColor(0x202020);

document.body.appendChild(renderer.domElement);

var gerometriaCubo = new THREE.BoxGeometry(1,2,1);
var materialTextura = new THREE.MeshStandardMaterial({color: 0x000000});
var meshCubo = new THREE.Mesh(gerometriaCubo,materialTextura);
meshCubo.castShadow = true;
meshCubo.translateZ(-10);
meshCubo.translateX(-10);

var edges = new THREE.EdgesGeometry(gerometriaCubo);
var edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
var edgeLines = new THREE.LineSegments(edges, edgeMaterial);
meshCubo.add(edgeLines);

var planeGeometry = new THREE.PlaneGeometry(30, 50);
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

importer.load('Objetos/marioModel.fbx', function (object) {
    mixerAnimacao = new THREE.AnimationMixer(object);
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


let livesMesh;
const moveSpeed = 0.1;
const jumpSpeed = 0.45;
const gravity = 0.02;
let velocityY = 0;
let isJumping = false;
const planes = [plane, tiltedPlane];


const planeSize = 15;
const halfPlaneSize = planeSize / 2;
const cubeSize = 2;

const keysPressed = {};
let isWalking = false;

let lives = 3; // Starting live
const spawnPosition = new THREE.Vector3(-10, 1, -10); // Spawn position for the cube

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true; 
    if (event.key === 'w' && !isJumping) {
        velocityY = jumpSpeed;
        isJumping = true;
        const jumpAudio = new Audio('Audio/jump.wav');
        jumpAudio.volume = 0.5;
        jumpAudio.play();
    }
    if(event.key === 'a' && keysPressed[event.key] === true && !isWalking) {
        //const walkAudio = new Audio('Audio/walking.wav');
        // walkAudio.volume = 0.2;
        // walkAudio.play();
        
        // isWalking = true;
    }
    if(event.key === 'd' && keysPressed[event.key] === true && !isWalking) {
        // const walkAudio = new Audio('Audio/walking.wav');
        // walkAudio.volume = 0.2;
        // walkAudio.play();
        // isWalking = true;
    }
    
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
    isWalking = false;

});

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

function applyGravity() {
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

            if (lives > 0) {
                // Move the cube to the spawn position
                meshCubo.position.copy(spawnPosition);
            } else {
                // Hide the cube when lives reach 0
                meshCubo.position.set(1000, 1000, 1000); // Move the cube out of view
                console.log("Game Over!");

                // Stop spawning barrels
                clearInterval(barrelSpawnInterval);
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
    audio.volume = 0.2;
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
    const audio = new Audio('Audio/bacmusic.wav');
    audio.loop = true;
    audio.volume = 0.5;
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
        pos.setXYZ(i, v3.x, v3.y, v3.z);}
    barrel.scale(0.5, heigth * 0.25, 0.5);
    barrel.castShadow = true;
    return barrel;
}


function Start() {
    cena.add(meshCubo);
    planes.push(tiltedPlane2)
    planes.push(tiltedPlane3)
    planes.push(tiltedPlane4)

    var luzAmbiente = new THREE.AmbientLight(0x404040, 5);
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