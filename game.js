const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustar tamaño del canvas a pantalla completa
function ajustarTamanioCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Centrar al jugador
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 30;
}

window.addEventListener("load", () => {
  ajustarTamanioCanvas(); // Asegura que el tamaño se ajuste al cargar la página
});
window.addEventListener("resize", ajustarTamanioCanvas);

const playerImg = new Image();
const enemyImg = new Image();
playerImg.src = "img/player.png";
enemyImg.src = "img/enemy.png";

let imagesLoaded = 0;
const totalImages = 2; // Número total de imágenes que necesitamos cargar

// Función que se ejecuta cuando las imágenes se cargan
function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    console.log("Todas las imágenes se han cargado correctamente");
    iniciarJuego(); // Inicia el juego cuando todas las imágenes se hayan cargado
  }
}

playerImg.onload = checkImagesLoaded;
enemyImg.onload = checkImagesLoaded;

const bgMusic = new Audio("sounds/bg-music.mp3");
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
  juegoPausado = true;
}

function mostrarSiguienteDialogo() {
  indiceDialogo++;
  if (indiceDialogo < dialogos.length) {
    mostrarDialogo();
  } else {
    document.getElementById("dialogo-container").style.display = "none";
    juegoPausado = false;
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

const drops = [];

const player = {
  x: 0,
  y: 0,
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
let juegoPausado = false;

let enemyInterval; // Intervalo de enemigos

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === " ") {
    if (player.dobleDisparo) {
      player.bullets.push({ x: player.x + 10, y: player.y });
      player.bullets.push({ x: player.x + player.width - 14, y: player.y });
    } else {
      player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
    }
  }

  // Pausar juego al presionar ESC o P
  if (e.key === "Escape" || e.key === "p") {
    if (!juegoPausado) {
      mostrarMenuPausa();
    } else {
      ocultarMenuPausa();
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

function iniciarGeneracionEnemigos() {
  enemyInterval = setInterval(spawnEnemy, 1000); // Inicia la generación de enemigos
}

function detenerGeneracionEnemigos() {
  clearInterval(enemyInterval); // Detiene la generación de enemigos
}

function update() {
  if (juegoPausado) return;

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width)
    player.x += player.speed;

  player.bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    if (bullet.y < 0) player.bullets.splice(i, 1);
  });

  drops.forEach((drop, i) => {
    drop.y += drop.speed;

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
        setTimeout(() => {
          player.dobleDisparo = false;
        }, 10000);
      }
      drops.splice(i, 1);
    }

    if (drop.y > canvas.height) {
      drops.splice(i, 1);
    }
  });

  enemies.forEach((enemy, i) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const speed = enemy.speed;
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    }
  });

  enemies.forEach((enemy, i) => {
    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      enemies.splice(i, 1);
      player.vidas--;

      if (player.vidas <= 0) {
        alert("¡Game Over!");
        document.location.reload();
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
        enemies.splice(ei, 1);
        player.bullets.splice(bi, 1);

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
  // Asegúrate de que el fondo sea negro
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas
  ctx.fillStyle = "black";  // Establece el color de fondo como negro
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Rellena el canvas con color negro

  // Dibuja el jugador
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Dibuja las balas
  ctx.fillStyle = "white";
  player.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  });

  // Dibuja los enemigos
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Dibuja las vidas
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Vidas ❤️: " + player.vidas, 10, 30);

  // Dibuja los objetos que caen
  drops.forEach((drop) => {
    ctx.drawImage(drop.imagen, drop.x, drop.y, drop.width, drop.height);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function iniciarJuego() {
  // Aquí se inicia el juego después de cargar las imágenes
  iniciarGeneracionEnemigos();
  gameLoop();
}

// Menú de Pausa
function mostrarMenuPausa() {
  document.getElementById("menu-pausa").style.display = "block"; // Muestra el menú
  juegoPausado = true; // Pausa el juego
  detenerGeneracionEnemigos(); // Detiene la generación de enemigos
}

function ocultarMenuPausa() {
  document.getElementById("menu-pausa").style.display = "none"; // Oculta el menú
  juegoPausado = false; // Reanuda el juego
  iniciarGeneracionEnemigos(); // Reanuda la generación de enemigos
}

// Función para continuar el juego
function continuarJuego() {
  ocultarMenuPausa(); // Oculta el menú y continúa el juego
}

// Función para reiniciar el nivel
function reiniciarNivel() {
  document.location.reload(); // Recarga la página para reiniciar el juego
}

// Función para salir al lobby
function salirLobby() {
  window.location.href = "index.html"; // Redirige a otra página (ajusta el link como necesites)
}





