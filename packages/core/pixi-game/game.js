const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
});

document.body.appendChild(app.view);

// Create a sprite
const bunny = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png');

// Center the sprite's anchor point
bunny.anchor.set(0.5);

// Move the sprite to the center of the screen
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

app.stage.addChild(bunny);

// Listen for animate update
app.ticker.add((delta) => {
    // Rotate the bunny each frame
    bunny.rotation += 0.05 * delta;
});
