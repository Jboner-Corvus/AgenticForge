const app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0x1a1a1a });
document.body.appendChild(app.view);

// Player setup
const player = PIXI.Sprite.from('https://cdn-icons-png.flaticon.com/512/2550/2550294.png'); // Placeholder image
player.anchor.set(0.5);
player.x = app.screen.width / 2;
player.y = app.screen.height - 50;
player.width = 60;
player.height = 60;
app.stage.addChild(player);

const playerSpeed = 5;
const bullets = [];
const enemies = [];

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > player.width / 2) {
        player.x -= playerSpeed;
    }
    if (keys['ArrowRight'] && player.x < app.screen.width - player.width / 2) {
        player.x += playerSpeed;
    }
    if (keys['Space'] && !player.isShooting) {
        fireBullet();
        player.isShooting = true;
        setTimeout(() => player.isShooting = false, 200); // Cooldown
    }
}

function fireBullet() {
    const bullet = PIXI.Sprite.from('https://cdn-icons-png.flaticon.com/512/2920/2920364.png'); // Placeholder image
    bullet.anchor.set(0.5);
    bullet.x = player.x;
    bullet.y = player.y - player.height / 2;
    bullet.width = 10;
    bullet.height = 20;
    app.stage.addChild(bullet);
    bullets.push(bullet);
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= 10 * delta;

        if (bullet.y < 0) {
            app.stage.removeChild(bullet);
            bullets.splice(i, 1);
            continue;
        }

        // Collision detection with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (bullet.x < enemy.x + enemy.width / 2 &&
                bullet.x > enemy.x - enemy.width / 2 &&
                bullet.y < enemy.y + enemy.height / 2 &&
                bullet.y > enemy.y - enemy.height / 2) {
                
                app.stage.removeChild(bullet);
                bullets.splice(i, 1);
                app.stage.removeChild(enemy);
                enemies.splice(j, 1);
                // TODO: Add score or other game logic
                break;
            }
        }
    }
}

function spawnEnemy() {
    const enemy = PIXI.Sprite.from('https://cdn-icons-png.flaticon.com/512/3238/3238059.png'); // Placeholder image
    enemy.anchor.set(0.5);
    enemy.x = Math.random() * (app.screen.width - 60) + 30;
    enemy.y = -50;
    enemy.width = 50;
    enemy.height = 50;
    app.stage.addChild(enemy);
    enemies.push(enemy);
}

let enemySpawnTimer = 0;
const enemySpawnInterval = 60; // Frames

function updateEnemies(delta) {
    enemySpawnTimer += delta;
    if (enemySpawnTimer >= enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += 2 * delta; // Enemy speed

        if (enemy.y > app.screen.height + 50) {
            app.stage.removeChild(enemy);
            enemies.splice(i, 1);
            // TODO: Lose a life or other game logic
        }
    }
}

// Game loop
app.ticker.add((delta) => {
    updatePlayer();
    updateBullets(delta);
    updateEnemies(delta);
});