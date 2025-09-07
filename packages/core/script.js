const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 70,
  width: 50,
  height: 50,
  color: 'blue',
  speed: 5,
  dx: 0,
};

// Game state
let score = 0;
let lives = 3;

// Enemy properties
const enemies = [];
const ENEMY_SPEED = 2;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const ENEMY_COLOR = 'red';
const ENEMY_SPAWN_INTERVAL = 1500; // ms
let lastEnemySpawnTime = 0;

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Enemy creation
function createEnemy() {
  const x = Math.random() * (canvas.width - ENEMY_WIDTH);
  const y = -ENEMY_HEIGHT; // Start above the canvas
  enemies.push({
    x,
    y,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    color: ENEMY_COLOR,
  });
}

// Draw enemies
function drawEnemies() {
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

// Move enemies and handle collision
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.y += ENEMY_SPEED;

    // Collision detection (simple AABB)
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      // Collision detected!
      console.log('Collision! Lives left: ' + lives);
      lives--; // Decrease a life
      enemies.splice(i, 1); // Remove the enemy
      if (lives <= 0) {
        console.log('Game Over!');
        // Implement game over logic here (e.g., stop game, show message)
      }
    }

    // Remove enemies that go off screen
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
    }
  }
}

// Add new enemies based on interval
function spawnEnemies(currentTime) {
  if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
    createEnemy();
    lastEnemySpawnTime = currentTime;
  }
}

// Draw score and lives
function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 25);
  ctx.fillText(`Lives: ${lives}`, 10, 50);
}

function update(currentTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.x += player.dx;

  // Keep player within bounds
  if (player.x < 0) {
    player.x = 0;
  } else if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  drawPlayer();
  updateEnemies();
  drawEnemies();
  spawnEnemies(currentTime);
  drawHUD(); // Draw score and lives

  requestAnimationFrame(update);
}

function keyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.dx = -player.speed;
  }
}

function keyUp(e) {
  if (
    e.key === 'ArrowRight' ||
    e.key === 'd' ||
    e.key === 'ArrowLeft' ||
    e.key === 'a'
  ) {
    player.dx = 0;
  }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

update(0);
