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



export function createLadder(position, height = 50, rungSpacing = 4, width = 4) {
    const ladderGroup = new THREE.Group();
    const rungCount = Math.floor(height / rungSpacing);

    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });
    const rungMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });

    // Vertical side rails
    const railGeometry = new THREE.BoxGeometry(0.5, height, 0.5);
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);

    leftRail.position.set(-width / 2, height / 2, 0);
    rightRail.position.set(width / 2, height / 2, 0);

    ladderGroup.add(leftRail);
    ladderGroup.add(rightRail);

    // Rungs
    const rungGeometry = new THREE.BoxGeometry(width - 0.5, 0.5, 0.5);

    for (let i = 1; i <= rungCount; i++) {
        const rung = new THREE.Mesh(rungGeometry, rungMaterial);
        rung.position.set(0, i * rungSpacing, 0);
        ladderGroup.add(rung);
    }

    ladderGroup.position.copy(position);
    ladderGroup.traverse(child => {
        child.castShadow = true;
        child.receiveShadow = true;
    });

    ladderGroup.name = "real_ladder";

    return ladderGroup;
}

export function createClimbingZone(position, height = 100, width = 2, depth = 2) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const climbingZone = new THREE.Mesh(geometry, material);

    climbingZone.position.set(position.x, height / 2, position.z);
    climbingZone.name = "climbing_zone";

    return climbingZone;
}
