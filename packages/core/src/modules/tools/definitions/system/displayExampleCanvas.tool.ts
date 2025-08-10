import { Tool } from '../../../../types.js';
import { sendToCanvas } from '../../../../utils/canvasUtils.js';
import { z } from 'zod';

// Exemples de contenu prédéfinis
const EXAMPLES = {
  visualization: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Data Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.8;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid rgba(0, 255, 255, 0.3);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }
        .chart-container {
            position: relative;
            height: 400px;
            margin: 2rem 0;
        }
        .controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        button {
            background: linear-gradient(45deg, #00c6ff, #0072ff);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 198, 255, 0.4);
        }
        .stats {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            margin: 2rem 0;
        }
        .stat-card {
            background: rgba(0, 200, 255, 0.1);
            border-radius: 10px;
            padding: 1rem;
            margin: 0.5rem;
            min-width: 150px;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #00ffff;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Interactive Data Visualization</h1>
        <p class="subtitle">Dynamic chart with real-time updates</p>
        
        <div class="card">
            <h2>Sales Data Dashboard</h2>
            <div class="chart-container">
                <canvas id="salesChart"></canvas>
            </div>
            
            <div class="controls">
                <button onclick="updateData()">Update Data</button>
                <button onclick="addDataset()">Add Dataset</button>
                <button onclick="removeDataset()">Remove Dataset</button>
                <button onclick="toggleType()">Toggle Chart Type</button>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="totalSales">0</div>
                <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avgGrowth">0%</div>
                <div class="stat-label">Avg Growth</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="activeUsers">0</div>
                <div class="stat-label">Active Users</div>
            </div>
        </div>
    </div>

    <script>
        // Initial data
        const initialData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June'],
            datasets: [{
                label: 'Sales 2023',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        };

        // Chart configuration
        const config = {
            type: 'line',
            data: initialData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        };

        // Create chart
        const ctx = document.getElementById('salesChart').getContext('2d');
        const salesChart = new Chart(ctx, config);

        // Update statistics
        function updateStats() {
            const totalSales = salesChart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const avgGrowth = Math.round(Math.random() * 20);
            const activeUsers = Math.floor(Math.random() * 1000) + 500;
            
            document.getElementById('totalSales').textContent = totalSales;
            document.getElementById('avgGrowth').textContent = avgGrowth + '%';
            document.getElementById('activeUsers').textContent = activeUsers;
        }

        // Update data
        function updateData() {
            salesChart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(() => Math.floor(Math.random() * 100));
            });
            salesChart.update();
            updateStats();
        }

        // Add dataset
        function addDataset() {
            const newDataset = {
                label: 'Sales 2024',
                data: Array.from({length: 6}, () => Math.floor(Math.random() * 100)),
                borderColor: \`rgb(\${Math.floor(Math.random() * 255)}, \${Math.floor(Math.random() * 255)}, \${Math.floor(Math.random() * 255)})\`,
                backgroundColor: \`rgba(\${Math.floor(Math.random() * 255)}, \${Math.floor(Math.random() * 255)}, \${Math.floor(Math.random() * 255)}, 0.2)\`,
                tension: 0.1
            };
            salesChart.data.datasets.push(newDataset);
            salesChart.update();
        }

        // Remove dataset
        function removeDataset() {
            if (salesChart.data.datasets.length > 1) {
                salesChart.data.datasets.pop();
                salesChart.update();
            }
        }

        // Toggle chart type
        function toggleType() {
            const types = ['line', 'bar', 'radar'];
            const currentIndex = types.indexOf(salesChart.config.type);
            const nextIndex = (currentIndex + 1) % types.length;
            salesChart.config.type = types[nextIndex];
            salesChart.update();
        }

        // Initialize stats
        updateStats();

        // Auto-update every 10 seconds
        setInterval(updateData, 10000);
    </script>
</body>
</html>
`,
  game: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snake Game</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.8;
        }
        .game-container {
            position: relative;
            margin: 20px auto;
        }
        #gameCanvas {
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        .score-container {
            display: flex;
            justify-content: space-between;
            width: 500px;
            margin: 20px auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .score, .high-score {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            background: linear-gradient(45deg, #00c6ff, #0072ff);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 198, 255, 0.4);
        }
        .instructions {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
        }
        .game-over {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐍 Snake Game</h1>
        <p class="subtitle">Classic arcade game in your browser</p>
        
        <div class="score-container">
            <div class="score">Score: <span id="score">0</span></div>
            <div class="high-score">High Score: <span id="highScore">0</span></div>
        </div>
        
        <div class="game-container">
            <canvas id="gameCanvas" width="500" height="500"></canvas>
            <div id="gameOver" class="game-over">
                <h2>Game Over!</h2>
                <p>Your score: <span id="finalScore">0</span></p>
                <button onclick="restartGame()">Play Again</button>
            </div>
        </div>
        
        <div class="controls">
            <button onclick="startGame()">Start Game</button>
            <button onclick="pauseGame()">Pause</button>
        </div>
        
        <div class="instructions">
            <h3>How to Play</h3>
            <p>Use the arrow keys to control the snake. Eat the food (red squares) to grow and earn points. Avoid hitting the walls or yourself!</p>
        </div>
    </div>

    <script>
        // Game variables
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const box = 20;
        let score = 0;
        let highScore = localStorage.getItem('snakeHighScore') || 0;
        document.getElementById('highScore').textContent = highScore;

        // Snake initial position
        let snake = [];
        snake[0] = {
            x: Math.floor(canvas.width / (2 * box)) * box,
            y: Math.floor(canvas.height / (2 * box)) * box
        };

        // Food initial position
        let food = {
            x: Math.floor(Math.random() * (canvas.width / box - 1) + 1) * box,
            y: Math.floor(Math.random() * (canvas.height / box - 1) + 1) * box
        };

        // Direction
        let d;

        // Game state
        let game;
        let paused = false;

        // Draw everything
        function draw() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw snake
            for(let i = 0; i < snake.length; i++) {
                ctx.fillStyle = (i === 0) ? '#00c6ff' : '#0072ff';
                ctx.fillRect(snake[i].x, snake[i].y, box, box);
                
                ctx.strokeStyle = '#00ffff';
                ctx.strokeRect(snake[i].x, snake[i].y, box, box);
            }
            
            // Draw food
            ctx.fillStyle = '#ff5252';
            ctx.fillRect(food.x, food.y, box, box);
            
            // Draw score
            document.getElementById('score').textContent = score;
        }

        // Collision detection
        function collision(head, array) {
            for(let i = 0; i < array.length; i++) {
                if(head.x === array[i].x && head.y === array[i].y) {
                    return true;
                }
            }
            return false;
        }

        // Move snake
        function move() {
            if(paused) return;
            
            let snakeX = snake[0].x;
            let snakeY = snake[0].y;
            
            // Direction control
            if(d === "LEFT") snakeX -= box;
            if(d === "UP") snakeY -= box;
            if(d === "RIGHT") snakeX += box;
            if(d === "DOWN") snakeY += box;
            
            // Game over conditions
            if(snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision({x: snakeX, y: snakeY}, snake)) {
                gameOver();
                return;
            }
            
            // If snake eats food
            if(snakeX === food.x && snakeY === food.y) {
                score++;
                // Generate new food
                food = {
                    x: Math.floor(Math.random() * (canvas.width / box - 1) + 1) * box,
                    y: Math.floor(Math.random() * (canvas.height / box - 1) + 1) * box
                };
            } else {
                // Remove tail
                snake.pop();
            }
            
            // Add new head
            let newHead = {
                x: snakeX,
                y: snakeY
            };
            
            snake.unshift(newHead);
            
            draw();
        }

        // Keyboard control
        document.addEventListener('keydown', direction);

        function direction(event) {
            let key = event.keyCode;
            if(key === 37 && d !== "RIGHT") {
                d = "LEFT";
            } else if(key === 38 && d !== "DOWN") {
                d = "UP";
            } else if(key === 39 && d !== "LEFT") {
                d = "RIGHT";
            } else if(key === 40 && d !== "UP") {
                d = "DOWN";
            }
        }

        // Start game
        function startGame() {
            if(game) clearInterval(game);
            // Reset game state
            snake = [];
            snake[0] = {
                x: Math.floor(canvas.width / (2 * box)) * box,
                y: Math.floor(canvas.height / (2 * box)) * box
            };
            d = undefined;
            score = 0;
            paused = false;
            document.getElementById('gameOver').style.display = 'none';
            
            // Generate new food
            food = {
                x: Math.floor(Math.random() * (canvas.width / box - 1) + 1) * box,
                y: Math.floor(Math.random() * (canvas.height / box - 1) + 1) * box
            };
            
            draw();
            game = setInterval(move, 150);
        }

        // Pause game
        function pauseGame() {
            paused = !paused;
        }

        // Restart game
        function restartGame() {
            startGame();
        }

        // Game over
        function gameOver() {
            clearInterval(game);
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'block';
            
            // Update high score
            if(score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                document.getElementById('highScore').textContent = highScore;
            }
        }

        // Initialize game
        draw();
    </script>
</body>
</html>
`,
  animation: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Particle Animation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #canvas-container {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        #animationCanvas {
            display: block;
        }
        #title {
            position: absolute;
            top: 20px;
            left: 0;
            width: 100%;
            text-align: center;
            color: white;
            font-size: 2.5rem;
            text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
            opacity: 0.8;
            pointer-events: none;
        }
        #controls {
            position: absolute;
            bottom: 20px;
            left: 0;
            width: 100%;
            text-align: center;
            color: white;
            font-size: 1rem;
            opacity: 0.7;
            pointer-events: none;
        }
        .particle-count {
            position: absolute;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 1rem;
            opacity: 0.7;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="canvas-container">
        <canvas id="animationCanvas"></canvas>
        <div id="title">🌌 Particle Animation 🌌</div>
        <div id="controls">Move your mouse to interact with particles</div>
        <div class="particle-count">Particles: <span id="particleCount">0</span></div>
    </div>

    <script>
        // Canvas setup
        const canvas = document.getElementById('animationCanvas');
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Particle system
        const particles = [];
        const particleCount = 1000;
        let mouseX = width / 2;
        let mouseY = height / 2;
        let mouseRadius = 100;

        // Resize handler
        window.addEventListener('resize', function() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        });

        // Mouse move handler
        window.addEventListener('mousemove', function(event) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        // Particle class
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
                this.color = \`hsl(\${Math.random() * 360}, 100%, 50%)\`;
                this.originalSize = this.size;
            }

            update() {
                // Move particle
                this.x += this.speedX;
                this.y += this.speedY;

                // Bounce off edges
                if (this.x <= 0 || this.x >= width) this.speedX *= -1;
                if (this.y <= 0 || this.y >= height) this.speedY *= -1;

                // Mouse interaction
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseRadius) {
                    const force = (mouseRadius - distance) / mouseRadius;
                    const angle = Math.atan2(dy, dx);
                    const tx = this.x + Math.cos(angle + Math.PI) * force * 10;
                    const ty = this.y + Math.sin(angle + Math.PI) * force * 10;
                    
                    this.speedX = (tx - this.x) / 10;
                    this.speedY = (ty - this.y) / 10;
                    
                    // Increase size when near mouse
                    this.size = this.originalSize + force * 5;
                } else {
                    // Return to original size
                    if (this.size > this.originalSize) {
                        this.size -= 0.1;
                    }
                }
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Create particles
        function init() {
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
            document.getElementById('particleCount').textContent = particleCount;
        }

        // Animation loop
        function animate() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            requestAnimationFrame(animate);
        }

        // Start animation
        init();
        animate();

        // Add some periodic effects
        setInterval(() => {
            // Change mouse radius randomly
            mouseRadius = 50 + Math.random() * 100;
            
            // Change particle colors occasionally
            if (Math.random() > 0.95) {
                for (let i = 0; i < particles.length; i++) {
                    particles[i].color = \`hsl(\${Math.random() * 360}, 100%, 50%)\`;
                }
            }
        }, 3000);
    </script>
</body>
</html>
`
};

const DisplayExampleCanvasParams = z.object({
  /**
   * Le nom de l'exemple à afficher (visualization, game, animation)
   */
  example: z.enum(['visualization', 'game', 'animation']),
  
  /**
   * Titre optionnel pour le canvas
   */
  title: z.string().optional()
});

export const displayExampleCanvasTool: Tool<typeof DisplayExampleCanvasParams> = {
  name: 'display_example_canvas',
  description: "Affiche des exemples prédéfinis dans le canvas de l'interface utilisateur. Exemples disponibles: visualisation de données interactives, jeu Snake, animation de particules.",
  parameters: DisplayExampleCanvasParams,
  execute: async (
    params,
    context
  ) => {
    const { job, log } = context;
    const parsedParams = DisplayExampleCanvasParams.parse(params);
    const { example, title } = parsedParams;
    
    try {
      // Vérifier que l'exemple existe
      if (!EXAMPLES.hasOwnProperty(example)) {
        throw new Error(`Exemple inconnu: ${example}. Exemples disponibles: visualization, game, animation`);
      }
      
      // Si un titre est fourni, l'ajouter au contenu (côté frontend)
      if (title) {
        log.info(`Displaying example with title: ${title}`);
      }
      
      // Envoyer le contenu de l'exemple au canvas
      if (job?.id) {
        sendToCanvas(job.id, EXAMPLES[example], 'html');
        log.info(`Example "${example}" sent to canvas for job ${job.id}`);
      } else {
        log.warn('No job ID available, cannot send example to canvas');
      }
      
      return {
        success: true
      };
    } catch (error) {
      log.error({ err: error }, 'Error sending example to canvas');
      throw new Error(`Failed to display example in canvas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};