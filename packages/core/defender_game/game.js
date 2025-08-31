const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x000000,
});
document.body.appendChild(app.view);

// Player setup
const player = PIXI.Sprite.from(PIXI.Texture.WHITE);
player.tint = 0x00ff00; // Green player
player.width = 50;
player.height = 50;
player.x = app.screen.width / 2;
player.y = app.screen.height - 100;
player.anchor.set(0.5);
app.stage.addChild(player);

const playerSpeed = 5;

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

app.ticker.add(() => {
    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= playerSpeed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += playerSpeed;
    }

    // Keep player within bounds
    if (player.x < player.width / 2) {
        player.x = player.width / 2;
    }
    if (player.x > app.screen.width - player.width / 2) {
        player.x = app.screen.width - player.width / 2;
    }
});
