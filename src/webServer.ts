// src/webServer.ts - Serveur web simple et robuste
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WEB_PORT = parseInt(process.env.WEB_PORT || '3000');
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8080';

const server = http.createServer((req, res) => {
  // CORS headers pour toutes les réponses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const timestamp = new Date().toISOString();

  logger.info(`${req.method} ${url.pathname} from ${req.socket.remoteAddress}`);

  // Route principale - Interface web
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const indexPath = path.join(__dirname, '..', 'index.html');

    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
      } catch (error) {
        logger.error({ error }, 'Error reading index.html');
      }
    }

    // Interface de base si index.html n'existe pas
    const defaultInterface = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Agentic Prometheus - Interface</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; flex: 1; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 3rem; margin-bottom: 10px; background: linear-gradient(45deg, #4CAF50, #45a049); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: 1.2rem; opacity: 0.8; }
        .card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; margin: 20px 0; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
        .status { padding: 15px; border-radius: 10px; margin: 15px 0; }
        .success { background: rgba(76, 175, 80, 0.2); border-left: 4px solid #4CAF50; }
        .info { background: rgba(33, 150, 243, 0.2); border-left: 4px solid #2196F3; }
        .endpoint { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0; font-family: monospace; }
        .btn { background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px; transition: transform 0.2s; }
        .btn:hover { transform: translateY(-2px); }
        .chat-container { display: flex; flex-direction: column; height: 400px; }
        .messages { flex: 1; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 20px; overflow-y: auto; margin-bottom: 20px; }
        .input-container { display: flex; gap: 10px; }
        .input { flex: 1; padding: 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white; }
        .input::placeholder { color: rgba(255,255,255,0.6); }
        .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
        .user { background: rgba(76, 175, 80, 0.2); text-align: right; }
        .assistant { background: rgba(33, 150, 243, 0.2); }
        .loading { text-align: center; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🚀 Agentic Prometheus</h1>
            <p class="subtitle">Intelligence Artificielle Auto-Améliorante</p>
        </div>
        
        <div class="card">
            <div class="status success">
                <h3>✅ Serveur Web Actif</h3>
                <p>Interface web fonctionnelle sur le port ${WEB_PORT}</p>
                <p><strong>Timestamp:</strong> ${timestamp}</p>
            </div>

            <div class="status info">
                <h3>📡 Endpoints Disponibles</h3>
                <div class="endpoint"><strong>Health Check:</strong> GET /web-health</div>
                <div class="endpoint"><strong>API MCP:</strong> POST /api/v1/agent/stream</div>
                <div class="endpoint"><strong>Serveur MCP:</strong> ${MCP_SERVER_URL}</div>
            </div>
        </div>

        <div class="card">
            <h3>💬 Chat avec Agentic Prometheus</h3>
            <div class="chat-container">
                <div id="messages" class="messages">
                    <div class="message assistant">
                        👋 Bonjour ! Je suis Agentic Prometheus, un agent IA autonome capable de créer ses propres outils.
                        <br><br>
                        🛠️ <strong>Mes capacités :</strong>
                        <br>• Création automatique de nouveaux outils
                        <br>• Exécution de code en sandbox sécurisé
                        <br>• Manipulation de fichiers workspace
                        <br>• Auto-redémarrage pour charger nouvelles capacités
                        <br><br>
                        Que puis-je faire pour vous ?
                    </div>
                </div>
                <div class="input-container">
                    <input type="text" id="messageInput" class="input" placeholder="Tapez votre message ici..." />
                    <button onclick="sendMessage()" class="btn">Envoyer</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        
        // Token d'authentification (à remplacer par le vrai token)
        const AUTH_TOKEN = 'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
        
        function addMessage(content, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
            messageDiv.innerHTML = content;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            messageInput.value = '';
            
            addMessage('🤔 Traitement en cours...', false);
            
            try {
                const response = await fetch('/api/v1/agent/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + AUTH_TOKEN
                    },
                    body: JSON.stringify({ goal: message })
                });
                
                if (!response.ok) {
                    throw new Error('Erreur réseau: ' + response.status);
                }
                
                const data = await response.json();
                
                // Supprimer le message de chargement
                messagesDiv.removeChild(messagesDiv.lastChild);
                
                // Ajouter la réponse
                addMessage(data.response || JSON.stringify(data, null, 2));
                
            } catch (error) {
                messagesDiv.removeChild(messagesDiv.lastChild);
                addMessage('❌ Erreur: ' + error.message);
            }
        }
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Test de connectivité au démarrage
        fetch('/web-health')
            .then(response => response.json())
            .then(data => {
                console.log('✅ Serveur web connecté:', data);
            })
            .catch(error => {
                console.warn('⚠️ Problème de connectivité:', error);
            });
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(defaultInterface);
    return;
  }

  // Health check du serveur web
  if (url.pathname === '/web-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp,
        webPort: WEB_PORT,
        mcpServer: MCP_SERVER_URL,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }),
    );
    return;
  }

  // Proxy vers le serveur MCP
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    const targetUrl = `${MCP_SERVER_URL}${url.pathname}${url.search}`;

    logger.info(`Proxying to: ${targetUrl}`);

    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: req.headers,
        timeout: 30000, // Timeout de 30 secondes
      },
      (proxyRes) => {
        // Copier les headers de la réponse
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (err) => {
      logger.error({ err, targetUrl }, 'Proxy request failed');
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Bad Gateway - Could not connect to MCP server',
          target: targetUrl,
          timestamp,
        }),
      );
    });

    proxyReq.on('timeout', () => {
      logger.error({ targetUrl }, 'Proxy request timeout');
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Gateway Timeout',
          target: targetUrl,
          timestamp,
        }),
      );
    });

    req.pipe(proxyReq);
    return;
  }

  // 404 pour les autres routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Not Found',
      path: url.pathname,
      timestamp,
    }),
  );
});

// Démarrage du serveur
server.listen(WEB_PORT, '0.0.0.0', () => {
  logger.info(`🌐 Web server started on 0.0.0.0:${WEB_PORT}`);
  logger.info(`📱 Interface: http://localhost:${WEB_PORT}`);
  logger.info(`🔗 MCP Proxy: ${MCP_SERVER_URL}`);
});

server.on('error', (err) => {
  logger.error({ err }, 'Web server error');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down web server gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down web server gracefully');
  server.close(() => process.exit(0));
});

export default server;
