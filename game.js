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

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 60,
  height: 60,
  speed: 7,
  bullets: [],
};

const enemies = [];
let keys = {};

// Movimiento y disparos
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === " ") {
    player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
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
    width: 60,
    height: 60,
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

  // Mover enemigos
  enemies.forEach((enemy, i) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) enemies.splice(i, 1);
  });

  // Colisiones
  enemies.forEach((enemy, ei) => {
    player.bullets.forEach((bullet, bi) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 4 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 10 > enemy.y
      ) {
        enemies.splice(ei, 1);
        player.bullets.splice(bi, 1);
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
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 1000); // Enemigos cada 1s
gameLoop();
