import * as THREE from 'three';

export function criarBulletBill() {
  const grupo = new THREE.Group();

  // Corpo principal maior (cilindro)
  const corpoGeo = new THREE.CylinderGeometry(1, 1, 3, 32);
  const corpoMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.7 });
  const corpo = new THREE.Mesh(corpoGeo, corpoMat);
  corpo.rotation.z = Math.PI / 2;
  grupo.add(corpo);

  // Indentação: cilindro “negativo” para “cortar” visualmente o corpo
  const indentGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.6, 32);
  const indentMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const indent = new THREE.Mesh(indentGeo, indentMat);
  indent.rotation.z = Math.PI / 2;
  indent.position.x = -1.4; // posiciona próximo ao aro
  grupo.add(indent);

  // === Cúpula frontal (bico da bala) ===
  const cabecaGeo = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI); // meia esfera
  const cabecaMat = corpoMat; // mesma cor que o corpo
  const cabeca = new THREE.Mesh(cabecaGeo, cabecaMat);
  cabeca.rotation.z = Math.PI / 2;
  cabeca.position.x = 1.5;
  grupo.add(cabeca);


        // === Aro grosso traseiro (parece uma moldura metálica)
    const aroExternoGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32, 1, true);
    const aroMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 1,
    roughness: 0.3,
    side: THREE.DoubleSide,
    });
    const aroExterno = new THREE.Mesh(aroExternoGeo, aroMat);
    aroExterno.rotation.z = Math.PI / 2;
    aroExterno.position.x = -1.65;
    grupo.add(aroExterno);

    // === Base interna escura (para parecer que há profundidade)
    const baseInternaGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
    const baseInternaMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.2,
    roughness: 0.7,
    });
    const baseInterna = new THREE.Mesh(baseInternaGeo, baseInternaMat);
    baseInterna.rotation.z = Math.PI / 2;
    baseInterna.position.x = -1.8; // ligeiramente para dentro
    grupo.add(baseInterna);

  // Ajustar escala geral se precisares
  grupo.scale.set(1, 1, 1);

  return grupo;
}


export class BulletBill {
  constructor(posX, posY) {
    this.mesh = criarBulletBill();
    this.mesh.position.set(posX, posY, 0);
    this.speed = 0.2; // velocidade para a esquerda
    this.alive = true;
  }

  update() {
    if (!this.alive) return;

    this.mesh.position.x -= this.speed;

    // Opcional: se sair da tela, "matar"
    if (this.mesh.position.x < -50) {
      this.alive = false;
      // Remover da cena e array no spawner
      this.mesh.parent.remove(this.mesh);
    }
  }

  checkCollision(player) {
 
    if (!this.alive || !player || !player.position) return false;
    // Aqui pode ser uma colisão simples AABB
    const distX = Math.abs(this.mesh.position.x - player.position.x);
    const distY = Math.abs(this.mesh.position.y - player.position.y);

    if (distX < 1.5 && distY < 1.5) {
      this.alive = false;
      this.mesh.parent.remove(this.mesh);
      return true; // Colidiu!
    }
    return false;
  }
}

export class BulletBillSpawner {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.bullets = [];
    this.spawnCooldown = 0;
  }

  spawn(x, y) {
    const bullet = new BulletBill(x, y);
    this.bullets.push(bullet);
    this.scene.add(bullet.mesh);
  }

  update() {
    this.spawnCooldown -= 1;
    if (this.spawnCooldown <= 0) {
      // Exemplo: spawn num y aleatório na direita da tela
      const y = Math.random() * 6 - 3;
      this.spawn(30, y);
      this.spawnCooldown = 100; // espera para o próximo spawn
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update();

      if (b.checkCollision(this.player)) {
        console.log("Player levou dano!");
        // Aqui podes diminuir HP, tocar som, etc
      }

      if (!b.alive) {
        this.bullets.splice(i, 1);
      }
    }
  }
}