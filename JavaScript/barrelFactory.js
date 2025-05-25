import * as THREE from 'three';

export function barrelFactory(position) {
    const barrelWood = makeBarrel(0.7, 1, 2.5);
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

    barrel.position.copy(position);
    barrel.scale.set(1, 1, 1);
    barrel.rotation.y = Math.PI / 2;
    barrel.rotation.z = Math.PI / 2;

    barrel.userData = {
        speed: 2,
        velocityY: 0,
        gravity: 0.05
          };
    
    return barrel;
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