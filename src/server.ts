// FICHIER : src/server.ts
import express from 'express';
import { FastMCP } from 'fastmcp';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js'; // CORRIGÉ : Import nommé
import logger from './logger.js';
import { getAllTools } from './tools/index.js';
import type { AgentSession, SessionData } from './types.js';

const app = express();
app.use(express.json());

// CORRIGÉ : 'tools' est une option valide pour le constructeur
const mcpServer = new FastMCP<SessionData>({
  tools: await getAllTools(),
  logger,
});

app.post('/api/chat', async (req, res) => {
    const { prompt, sessionId: existingSessionId } = req.body;
    const sessionId = existingSessionId || uuidv4();

    const session: AgentSession = {
        id: sessionId,
        data: {
            history: [],
            identities: [{id: 'user', type: 'email'}],
        }
    };
    
    // CORRIGÉ : La méthode est bien 'run'
    const result = await mcpServer.run(prompt, session.data);
    res.json(result);
});

app.listen(config.PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${config.PORT}`);
});