import * as THREE from 'three';

export function planeFactory(position, rotation, sizeX) {
    var planeGeometry = new THREE.BoxGeometry(sizeX, 2,0.5);
    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
    planeMaterial.side = THREE.DoubleSide;
    planeMaterial.shadowSide = THREE.BackSide;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.y = rotation;
    plane.position.copy(position);
    plane.receiveShadow = true;
    plane.castShadow = true;
    plane.name = "plataforma";   
    return(plane)
}


export function planeFactoryGoThrough(position, rotation, sizeX) {
    var planeGeometry = new THREE.BoxGeometry(sizeX, 2,0.5);
    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
    planeMaterial.side = THREE.DoubleSide;
    planeMaterial.shadowSide = THREE.BackSide;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.y = rotation;
    plane.position.copy(position);
    plane.receiveShadow = true;
    plane.castShadow = true;
    plane.name = "plataforma";   
    return(plane)
}
