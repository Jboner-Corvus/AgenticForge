const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Player class
class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 5;
        this.dx = 0; // Horizontal movement direction
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.dx;

        // Keep player within canvas bounds
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, width, height, color, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed; // Move downwards
    }
}


// Create player instance
const player = new Player(canvas.width / 2 - 25, canvas.height - 70, 50, 50, 'blue');

// Create enemies array and add first enemy
const enemies = [];
enemies.push(new Enemy(Math.random() * (canvas.width - 50), -50, 50, 50, 'red', 2));


// Keyboard input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handlePlayerInput() {
    player.dx = 0; // Reset movement each frame

    if (keys['ArrowLeft'] || keys['a']) {
        player.dx = -player.speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.dx = player.speed;
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    handlePlayerInput();
    player.update();
    player.draw();

    // Update and draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });

    requestAnimationFrame(animate);
}

animate();