const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "img/player.png";
const enemyImg = new Image();
enemyImg.src = "img/enemy.png";

const bgMusic = new Audio("sounds/bg-music.mp3");

// Música de fondo (loop infinito)
bgMusic.loop = true;
bgMusic.volume = 0.5;
window.addEventListener("keydown", () => {
  if (bgMusic.paused) {
    bgMusic.play();
  }
});

const dialogos = [
  {
    personaje: "img/gato.png",
    texto: "¡Bienvenido al frente de batalla!",
  },
  {
    personaje: "img/knight.png",
    texto: "Tienes que cruzar las líneas enemigas. Buena suerte.",
  },
];

let indiceDialogo = 0;

function mostrarDialogo() {
  const contenedor = document.getElementById("dialogo-container");
  const imagen = document.getElementById("personaje-img");
  const texto = document.getElementById("texto");

  imagen.src = dialogos[indiceDialogo].personaje;
  texto.textContent = dialogos[indiceDialogo].texto;
  contenedor.style.display = "flex";
  juegoPausado = true; // si tenés una variable de pausa
}

function mostrarSiguienteDialogo() {
  indiceDialogo++;
  if (indiceDialogo < dialogos.length) {
    mostrarDialogo();
  } else {
    document.getElementById("dialogo-container").style.display = "none";
    juegoPausado = false; // reanudar juego
  }
}

const imgVida = new Image();
imgVida.src = "img/vida.png";

const imgPoder = new Image();
imgPoder.src = "img/poder.png";

const imgEscudo = new Image();
imgEscudo.src = "img/escudo.png";

const objetos = [
  { tipo: "vida", imagen: imgVida },
  { tipo: "poder", imagen: imgPoder },
  { tipo: "escudo", imagen: imgEscudo },
];

const drops = []; // objetos caídos

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 90,
  width: 90,
  height: 90,
  speed: 7,
  bullets: [],
  vidas: 3,
  dobleDisparo: false,
};

const enemies = [];
let keys = {};
let enemigosEliminados = 0;
let dialogoMostrado = false;

// Movimiento y disparos
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === " ") {
    if (player.dobleDisparo) {
      // Disparo doble: una a la izquierda y otra a la derecha
      player.bullets.push({ x: player.x + 10, y: player.y });
      player.bullets.push({ x: player.x + player.width - 14, y: player.y });
    } else {
      // Disparo normal
      player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
    }
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 40);
  enemies.push({
    x,
    y: 0,
    width: 80,
    height: 80,
    speed: 2 + Math.random() * 2,
  });
}

function update() {
  // Movimiento jugador
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width)
    player.x += player.speed;

  // Mover balas
  player.bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    if (bullet.y < 0) player.bullets.splice(i, 1);
  });

  // Mover objetos caídos
  drops.forEach((drop, i) => {
    drop.y += drop.speed;

    // Recoger si toca al jugador
    if (
      drop.x < player.x + player.width &&
      drop.x + drop.width > player.x &&
      drop.y < player.y + player.height &&
      drop.y + drop.height > player.y
    ) {
      if (drop.tipo === "vida") {
        player.vidas++;
      } else if (drop.tipo === "poder") {
        player.dobleDisparo = true;

        // Desactivar después de 10 segundos (10000 ms)
        setTimeout(() => {
          player.dobleDisparo = false;
        }, 10000);
      } else if (drop.tipo === "escudo") {
        // lógica de escudo, por ejemplo, invulnerabilidad temporal
      }

      drops.splice(i, 1); // quitar el drop recogido
    }

    // Quitar si se va del canvas
    if (drop.y > canvas.height) {
      drops.splice(i, 1);
    }
  });

  enemies.forEach((enemy, i) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Evitar división por cero
    if (distance > 0) {
      const speed = enemy.speed;
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    }
  });

  // Colisión enemigo-jugador
  enemies.forEach((enemy, i) => {
    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      enemies.splice(i, 1); // eliminar el enemigo que lo tocó
      player.vidas--;

      if (player.vidas <= 0) {
        alert("¡Game Over!");
        document.location.reload(); // recarga el juego
      }
    }
  });

  enemies.forEach((enemy, ei) => {
    player.bullets.forEach((bullet, bi) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 4 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        // Eliminar enemigo y bala
        enemies.splice(ei, 1);
        player.bullets.splice(bi, 1);

        // Drop aleatorio (con acceso válido a `enemy`)
        if (Math.random() < 0.3) {
          const objetoAleatorio =
            objetos[Math.floor(Math.random() * objetos.length)];
          drops.push({
            ...objetoAleatorio,
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            width: 50,
            height: 50,
            speed: 2,
          });
        }

        enemigosEliminados++;

        if (enemigosEliminados === 11 && !dialogoMostrado) {
          mostrarDialogo();
          dialogoMostrado = true;
        }
      }
    });
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jugador
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Balas
  ctx.fillStyle = "white";
  player.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  });

  // Enemigos
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Mostrar vidas
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Vidas ❤️: " + player.vidas, 10, 30);

  drops.forEach((drop) => {
    ctx.drawImage(drop.imagen, drop.x, drop.y, drop.width, drop.height);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 1000); // Enemigos cada 1s
gameLoop();
