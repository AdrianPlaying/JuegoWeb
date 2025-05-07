// ============================
// Inicialización de Canvas
// ============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function ajustarTamanioCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Centrar al jugador
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 30;
}

window.addEventListener("load", ajustarTamanioCanvas);
window.addEventListener("resize", ajustarTamanioCanvas);

// ============================
// Carga de Imágenes
// ============================
const playerImg = new Image();
const enemyImg = new Image();
const jefe1Img = new Image();
const jefe2Img = new Image();
const imgVida = new Image();
const imgPoder = new Image();
const imgEscudo = new Image();
const backgroundImg = new Image();

playerImg.src = "img/player.png";
enemyImg.src = "img/enemy.png";
jefe1Img.src = "img/jefe1.png";
jefe2Img.src = "img/jefe2.png";
imgVida.src = "img/vida.png";
imgPoder.src = "img/poder.png";
imgEscudo.src = "img/escudo.png";
backgroundImg.src = "img/unnamed.png";

let imagesLoaded = 0;
const totalImages = 3;

function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    console.log("Todas las imágenes se han cargado correctamente");
    iniciarJuego();
  }
}

playerImg.onload = checkImagesLoaded;
enemyImg.onload = checkImagesLoaded;
backgroundImg.onload = checkImagesLoaded;

// ============================
// Carga de Música
// ============================
const bgMusic = new Audio("sounds/bg-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.1;

window.addEventListener("keydown", () => {
  if (bgMusic.paused) {
    bgMusic.play();
  }
});

// ============================
// Variables Globales
// ============================
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
const drops = [];
const objetos = [
  { tipo: "vida", imagen: imgVida },
  { tipo: "poder", imagen: imgPoder },
  { tipo: "escudo", imagen: imgEscudo },
];

let keys = {};
let enemigosEliminados = 0;
let enemyInterval;
let jefeActual = null;
let jefe1Activo = false;
let jefe1Derrotado = false;
let jefe2Activo = false;
let dialogoMostrado = false;
let juegoPausado = false;
let juegoTerminado = false; // Nueva variable para controlar si el juego ha terminado
let jefeEmbistiendo = false;
let jefe2Derrotado = false;
let dialogoMostradoJefe1 = false;
let dialogoMostradoJefe2 = false;
let velocidadEmbestida = 8; // velocidad cuando embiste
let velocidadRetorno = 3; // velocidad cuando regresa
let mostrarIndicadorEmbestida = false;
let xObjetivoEmbestida = 0;
let jefePreparandoEmbestida = false;
// Variables nuevas para la animación de embestida
let tiempoPreparacionEmbestida = 1500; // 1.5 segundos que dura la preparación
let inicioPreparacionEmbestida = 0; // Timestamp cuando inicia la preparación
let pulsaciones = []; // Array para múltiples ondas pulsantes
let colorPrimario = ""; // Color principal de la trayectoria, se define según el jefe
let colorSecundario = ""; // Color secundario para efectos, se define según el jefe

// ============================
// Sistema de Diálogos
// ============================
const dialogos = [
  // Diálogo inicial
  {
    personaje: "img/gato.png",
    texto:
      "¡Enhorabuena, bienvenido aventurero! Ya te habrás fijado que te atacan los slimes y sueltan ciertos objetos. Aprovechalos en tu aventura!!!",
  },
  {
    personaje: "img/knight.png",
    texto:
      "¿Tu eres la esperanza de este mundo?... Ja ja ja Que bajo han caído. Jamás pensé que acabar con el mundo sería tan fácil...",
  },

  // Después del primer jefe
  {
    personaje: "img/gato.png",
    texto:
      "¡Has vencido al primer jefe! Estás progresando, pero aún queda mucho por hacer.",
  },
  {
    personaje: "img/knight.png",
    texto:
      "Bueno, no pense que llegaras tan lejos.... goblins ataquen tambien.",
  },

  // Después del segundo jefe
  {
    personaje: "img/gato.png",
    texto: "¡Bien hecho! Has demostrado un poder sorprendente.",
  },
  {
    personaje: "img/knight.png",
    texto: "Hmph... no está mal. Pero esto aún no ha terminado.",
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

  // Avanza automáticamente después de 5 segundos
  setTimeout(() => {
    indiceDialogo++;
    if (indiceDialogo < dialogos.length) {
      mostrarDialogo();
    } else {
      contenedor.style.display = "none";
      juegoPausado = false;
    }
  }, 5000);
}

// ============================
// Sistema de Jefes
// ============================
function crearJefe(numero) {
  let width = 200;
  let height = 200;
  if (numero === 2) {
    width = 300;
    height = 300;
  }

  jefeActual = {
    x: canvas.width / 2 - width / 2,
    y: -200,
    width,
    height,
    vida: numero === 1 ? 50 : 100,
    vidaMaxima: numero === 1 ? 50 : 100,
    speed: 1.5,
    imagen: numero === 1 ? jefe1Img : jefe2Img,
  };
  jefeActual.intervaloEmbestida = setInterval(jefeEmbestir, 7000); // embiste cada 7 segundos
}

function jefeEmbestir() {
  if (jefeActual && !jefeEmbistiendo && !jefePreparandoEmbestida) {
    jefePreparandoEmbestida = true;
    inicioPreparacionEmbestida = Date.now(); // Registramos cuándo inicia

    // Definir colores según el jefe
    if (jefe1Activo) {
      // Colores para el jefe 1: rojo
      colorPrimario = "rgba(255, 0, 0";
      colorSecundario = "rgba(255, 50, 50";
    } else if (jefe2Activo) {
      // Colores para el jefe 2: azul eléctrico/púrpura
      colorPrimario = "rgba(60, 0, 255";
      colorSecundario = "rgba(130, 60, 255";
    }

    // Generar ondas pulsantes cada 200ms durante la preparación
    pulsaciones = []; // Reiniciamos el array de pulsaciones

    // Generar 5 ondas durante la preparación
    let intervaloOndas = setInterval(() => {
      if (pulsaciones.length < 5) {
        pulsaciones.push({
          radio: 0,
          alpha: 1,
          velocidad: 3 + pulsaciones.length * 1.5, // Cada onda es más rápida
        });
      } else {
        clearInterval(intervaloOndas);
      }
    }, 200);

    // Mostrar indicador por 1.5 segundos antes de embestir
    setTimeout(() => {
      jefePreparandoEmbestida = false;
      jefeEmbistiendo = true;
      pulsaciones = []; // Limpiamos las pulsaciones al terminar
    }, tiempoPreparacionEmbestida);
  }
}

// ============================
// Controles del Jugador
// ============================
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

  if (e.key === "Escape" || e.key === "p") {
    if (!juegoTerminado) {
      // Solo permite pausar si el juego no ha terminado
      juegoPausado ? ocultarMenuPausa() : mostrarMenuPausa();
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// ============================
// Generación de Enemigos
// ============================
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
  enemyInterval = setInterval(spawnEnemy, 1000);
}

function detenerGeneracionEnemigos() {
  clearInterval(enemyInterval);
}

// ============================
// Actualización del Juego
// ============================
function update() {
  if (juegoPausado) return;

  // Movimiento jugador
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width)
    player.x += player.speed;
  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.height < canvas.height)
    player.y += player.speed;

  // Movimiento balas
  player.bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    if (bullet.y < 0) player.bullets.splice(i, 1);
  });

  // Movimiento drops
  drops.forEach((drop, i) => {
    drop.y += drop.speed;

    if (
      drop.x < player.x + player.width &&
      drop.x + drop.width > player.x &&
      drop.y < player.y + player.height &&
      drop.y + drop.height > player.y
    ) {
      if (drop.tipo === "vida") player.vidas++;
      if (drop.tipo === "poder") {
        player.dobleDisparo = true;
        setTimeout(() => (player.dobleDisparo = false), 10000);
      }
      drops.splice(i, 1);
    }

    if (drop.y > canvas.height) drops.splice(i, 1);
  });

  // Movimiento enemigos hacia jugador
  enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      enemy.x += (dx / distance) * enemy.speed;
      enemy.y += (dy / distance) * enemy.speed;
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
      enemies.splice(i, 1);
      player.vidas--;
      if (player.vidas <= 0) {
        // Reemplazamos el alert por mostrar el menú de derrota
        mostrarMenuDerrota();
      }
    }
  });

  // Colisión bala-enemigo
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
        enemigosEliminados++;

        // Drop objetos
        if (Math.random() < 0.3) {
          const objeto = objetos[Math.floor(Math.random() * objetos.length)];
          drops.push({
            ...objeto,
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            width: 50,
            height: 50,
            speed: 2,
          });
        }

        // Activar jefe
        if (enemigosEliminados === 15 && !jefe1Activo && !jefe1Derrotado) {
          jefe1Activo = true;
          detenerGeneracionEnemigos();
          crearJefe(1);
        }

        if (enemigosEliminados >= 25 && jefe1Derrotado && !jefe2Activo) {
          jefe2Activo = true;
          detenerGeneracionEnemigos();
          crearJefe(2);
        }

        if (enemigosEliminados === 11 && !dialogoMostrado) {
          mostrarDialogo();
          dialogoMostrado = true;
        }
      }
    });
  });

  // Movimiento y colisión del jefe
  if (jefeActual) {
    if (jefeEmbistiendo) {
      jefeActual.y += velocidadEmbestida;

      // Si pasa del jugador o del suelo, empieza a volver
      if (jefeActual.y > player.y) {
        velocidadEmbestida = -velocidadRetorno; // Cambia dirección para volver hacia arriba
      }

      // Cuando regresa arriba, termina la embestida
      if (jefeActual.y < 50) {
        jefeEmbistiendo = false;
        velocidadEmbestida = 10; // Reinicia velocidad para próxima embestida
        jefeActual.y = 50; // Ajusta su posición
      }
    } else {
      // Movimiento HORIZONTAL siguiendo al jugador
      if (player.x + player.width / 2 < jefeActual.x + jefeActual.width / 2) {
        jefeActual.x -= 2; // Velocidad hacia la izquierda
      } else if (
        player.x + player.width / 2 >
        jefeActual.x + jefeActual.width / 2
      ) {
        jefeActual.x += 2; // Velocidad hacia la derecha
      }
    }

    if (jefeActual.y < 50) jefeActual.y += jefeActual.speed;

    // Colisión bala-jefe
    if (jefeActual) {
      // Array de balas para evitar problemas de modificación durante la iteración
      const bullets = [...player.bullets];

      // Usamos un bucle for tradicional para tener más control
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const bullet = bullets[bi];

        // Verificamos nuevamente que jefeActual no se haya vuelto null
        if (
          jefeActual &&
          bullet.x < jefeActual.x + jefeActual.width &&
          bullet.x + 4 > jefeActual.x &&
          bullet.y < jefeActual.y + jefeActual.height &&
          bullet.y + 10 > jefeActual.y
        ) {
          jefeActual.vida--;
          // Encontramos el índice en el array original
          const originalIndex = player.bullets.findIndex((b) => b === bullet);
          if (originalIndex !== -1) {
            player.bullets.splice(originalIndex, 1);
          }

          if (jefeActual && jefeActual.vida <= 0) {
            clearInterval(jefeActual.intervaloEmbestida);
            if (jefe1Activo) {
              jefe1Activo = false;
              jefe1Derrotado = true;
              iniciarGeneracionEnemigos();
              jefeActual = null;
              break; // Salimos del bucle ya que jefeActual es ahora null
            } else if (jefe2Activo) {
              jefe2Activo = false;
              juegoPausado = true;
              juegoTerminado = true;
              detenerGeneracionEnemigos();
              jefeActual = null;
              setTimeout(() => {
                alert(
                  "🎉 ¡Felicidades! Has ayudado al planeta y completado el juego."
                );
                window.location.href = "victoria.html";
              }, 500);
              break; // Salimos del bucle ya que jefeActual es ahora null
            }
          }
        }
      }
    }

    // Colisión jefe-jugador
    if (jefeActual && jefeEmbistiendo) {
      if (
        jefeActual &&
        jefeEmbistiendo &&
        jefeActual.x < player.x + player.width &&
        jefeActual.x + jefeActual.width > player.x &&
        jefeActual.y < player.y + player.height &&
        jefeActual.y + jefeActual.height > player.y
      ) {
        player.vidas--;

        if (player.vidas <= 0) {
          // Reemplazamos el alert por mostrar el menú de derrota
          mostrarMenuDerrota();
        }
      }
    }
  }
}

// ============================
// Renderizado del Juego
// ============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Dibujar la imagen de fondo en lugar del rectángulo negro
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  ctx.fillStyle = "white";
  player.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  });

  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Vidas ❤️: ${player.vidas}`, 10, 30);
  ctx.fillText(`Puntaje 🏆: ${enemigosEliminados}`, 10, 60);

  drops.forEach((drop) => {
    ctx.drawImage(drop.imagen, drop.x, drop.y, drop.width, drop.height);
  });

  if (jefeActual && jefePreparandoEmbestida) {
    // Calcula el progreso de la preparación (0.0 a 1.0)
    const tiempoTranscurrido = Date.now() - inicioPreparacionEmbestida;
    const progreso = Math.min(
      tiempoTranscurrido / tiempoPreparacionEmbestida,
      1
    );

    // Centro del jefe
    const centerX = jefeActual.x + jefeActual.width / 2;
    const centerY = jefeActual.y + jefeActual.height / 2;

    // Grosor base de la línea basado en el tamaño del jefe
    const grosorLinea = jefeActual.width > 200 ? 150 : 100;

    // Dibujar primero la línea de trayectoria con opacidad baja
    const gradiente = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX,
      canvas.height
    );
    gradiente.addColorStop(0, `${colorPrimario}, 0.7)`);
    gradiente.addColorStop(1, `${colorPrimario}, 0.2)`);

    ctx.beginPath();
    ctx.strokeStyle = gradiente;
    ctx.lineWidth = grosorLinea;
    ctx.globalAlpha = 0.3 + progreso * 0.4; // Se vuelve más opaco con el tiempo
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Agregar efecto de pulso en el centro del jefe
    ctx.beginPath();
    ctx.fillStyle = `${colorSecundario}, ${0.4 + progreso * 0.6})`;
    ctx.arc(
      centerX,
      centerY,
      (jefeActual.width / 2) * (0.8 + Math.sin(progreso * Math.PI * 8) * 0.2),
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Dibujar las ondas pulsantes
    pulsaciones.forEach((pulso, index) => {
      pulso.radio += pulso.velocidad;
      pulso.alpha -= 0.015;

      if (pulso.alpha > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `${colorSecundario}, ${pulso.alpha})`;
        ctx.lineWidth = 5 + progreso * 5;
        ctx.arc(centerX, centerY, pulso.radio, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Agregar marcadores en la trayectoria
    const marcasTotal = 7;

    // Color de marcadores adaptado al jefe
    let colorMarcadores = jefe1Activo
      ? "rgba(255, 255, 0,"
      : "rgba(180, 230, 255,";

    for (let i = 0; i < marcasTotal; i++) {
      const posY = centerY + ((canvas.height - centerY) / marcasTotal) * i;
      const tamMarca = 5 + Math.sin(progreso * 10 + i * 0.5) * 3;
      const opacidad = 0.5 + progreso * 0.5;

      ctx.beginPath();
      ctx.fillStyle = `${colorMarcadores} ${opacidad})`;
      ctx.arc(centerX, posY, tamMarca, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (jefeActual) {
    ctx.drawImage(
      jefeActual.imagen,
      jefeActual.x,
      jefeActual.y,
      jefeActual.width,
      jefeActual.height
    );

    ctx.fillStyle = "red";
    ctx.fillRect(jefeActual.x, jefeActual.y - 5, jefeActual.width, 3);
    if (jefeActual.vida > 0) {
      ctx.fillStyle = "lime";
      ctx.fillRect(
        jefeActual.x,
        jefeActual.y - 5,
        (jefeActual.width * jefeActual.vida) / jefeActual.vidaMaxima,
        5
      );
    }
  }
}

// ============================
// Bucle Principal
// ============================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function iniciarJuego() {
  iniciarGeneracionEnemigos();
  gameLoop();
}

// ============================
// Menú de Pausa
// ============================
function mostrarMenuPausa() {
  document.getElementById("menu-pausa").style.display = "block";
  juegoPausado = true;
  detenerGeneracionEnemigos();
  bgMusic.pause();
}

function ocultarMenuPausa() {
  document.getElementById("menu-pausa").style.display = "none";
  juegoPausado = false;
  iniciarGeneracionEnemigos();
  bgMusic.play();
}

function continuarJuego() {
  ocultarMenuPausa();
}

function reiniciarNivel() {
  document.location.reload();
}

function salirLobby() {
  window.location.href = "index.html";
}

// ============================
// Menú de Derrota
// ============================
function mostrarMenuDerrota() {
  document.getElementById("menu-derrota").style.display = "block";
  juegoPausado = true;
  juegoTerminado = true;
  detenerGeneracionEnemigos();
  bgMusic.pause();
}

function reiniciarNivelDerrota() {
  document.location.reload();
}

function regresarMenuPrincipal() {
  window.location.href = "index.html";
}
