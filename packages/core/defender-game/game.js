const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
});
document.body.appendChild(app.view);

// Resize listener
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

// Player
const player = PIXI.Sprite.from(PIXI.Texture.WHITE);
player.tint = 0x00ff00; // Green player
player.width = 40;
player.height = 40;
player.anchor.set(0.5);
player.x = app.screen.width / 2;
player.y = app.screen.height - 50;
app.stage.addChild(player);

// Player movement
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

const playerSpeed = 5;
app.ticker.add(() => {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= playerSpeed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += playerSpeed;
    }
    if (keys['ArrowUp'] || keys['KeyW']) {
        player.y -= playerSpeed;
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.y += playerSpeed;
    }

    // Keep player on screen
    if (player.x < player.width / 2) player.x = player.width / 2;
    if (player.x > app.screen.width - player.width / 2) player.x = app.screen.width - player.width / 2;
    if (player.y < player.height / 2) player.y = player.height / 2;
    if (player.y > app.screen.height - player.height / 2) player.y = app.screen.height - player.height / 2;
});

// Projectiles
const projectiles = [];
const projectileSpeed = 10;

function fireProjectile() {
    const projectile = PIXI.Sprite.from(PIXI.Texture.WHITE);
    projectile.tint = 0xffffff; // White projectile
    projectile.width = 5;
    projectile.height = 15;
    projectile.anchor.set(0.5);
    projectile.x = player.x;
    projectile.y = player.y - player.height / 2;
    app.stage.addChild(projectile);
    projectiles.push(projectile);
}

let canShoot = true;
const fireRate = 200; // milliseconds

window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'KeyF') && canShoot) {
        fireProjectile();
        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, fireRate);
    }
});

app.ticker.add(() => {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].y -= projectileSpeed;
        if (projectiles[i].y < 0) {
            app.stage.removeChild(projectiles[i]);
            projectiles.splice(i, 1);
            i--;
        }
    }
});

// Enemies (basic example for now)
const enemies = [];
const enemySpeed = 2;
const spawnInterval = 1000; // milliseconds
let lastSpawnTime = 0;

function spawnEnemy() {
    const enemy = PIXI.Sprite.from(PIXI.Texture.WHITE);
    enemy.tint = 0xff0000; // Red enemy
    enemy.width = 30;
    enemy.height = 30;
    enemy.anchor.set(0.5);
    enemy.x = Math.random() * app.screen.width;
    enemy.y = -enemy.height; // Start above the screen
    app.stage.addChild(enemy);
    enemies.push(enemy);
}

app.ticker.add((delta) => {
    // Spawn enemies
    lastSpawnTime += app.ticker.elapsedMS; // Use elapsedMS for time-based updates
    if (lastSpawnTime > spawnInterval) {
        spawnEnemy();
        lastSpawnTime = 0;
    }

    // Move enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].y += enemySpeed;
        if (enemies[i].y > app.screen.height + enemies[i].height) {
            app.stage.removeChild(enemies[i]);
            enemies.splice(i, 1);
            i--;
        }
    }

    // Collision detection (projectiles and enemies)
    for (let i = 0; i < projectiles.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (projectiles[i] && enemies[j] && hitTestRectangle(projectiles[i], enemies[j])) {
                app.stage.removeChild(projectiles[i]);
                projectiles.splice(i, 1);
                i--;

                app.stage.removeChild(enemies[j]);
                enemies.splice(j, 1);
                j--;
                break; // Exit inner loop as projectile is removed
            }
        }
    }

    // Collision detection (player and enemies) - Basic game over for now
    for (let i = 0; i < enemies.length; i++) {
        if (hitTestRectangle(player, enemies[i])) {
            alert('Game Over!');
            app.stop(); // Stop the game loop
            break; // Exit loop
        }
    }
});

// Basic AABB collision detection function
function hitTestRectangle(r1, r2) {
    //Define the variables we'll need to calculate
    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x;
    r1.centerY = r1.y;
    r2.centerX = r2.x;
    r2.centerY = r2.y;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance between the sprites' center points
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Add the half-widths and half-heights of the sprites
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check if the sprites are overlapping on the X axis
    if (Math.abs(vx) < combinedHalfWidths) {
        //They are overlapping on the X axis
        //Check if they're overlapping on the Y axis too
        if (Math.abs(vy) < combinedHalfHeights) {
            //They're overlapping on both axes
            hit = true;
        } else {
            //They're not overlapping on the Y axis
            hit = false;
        }
    } else {
        //They're not overlapping on the X axis
        hit = false;
    }

    return hit;
}
