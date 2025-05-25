import * as THREE from 'three';
export function spikeFactory() {
    const spikeGroup = new THREE.Group();
    // Parâmetros
    const spikeMinHeight = 0.5;
    const spikeMaxHeight = 1.5;
    const spacing = 1; // distância entre espinhos

    //Material Imports

    const loader = new THREE.TextureLoader();

    const albedoMap = loader.load('Objetos/textures/metal/albedo.png');

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
    }   
    return spikeGroup;
}

