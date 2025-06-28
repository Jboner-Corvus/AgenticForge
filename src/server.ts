// FICHIER : src/server.ts
import express from 'express';
import { FastMCP } from 'fastmcp';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from './config.js';
import logger from './logger.js';
import { getAllTools } from './tools/index.js';
import type { AgentSession, SessionData, Tool } from './types.js';

const app = express();
app.use(express.json());

const mcpServer = new FastMCP<SessionData>({
  orchestrator: { /* ... options ... */ },
  // CORRIGÉ: La propriété 'tools' est attendue par le constructeur fastmcp
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
            goal: prompt,
            identities: [{id: 'user', type: 'email'}], // requis par fastmcp
        }
    };
    
    // CORRIGÉ: La méthode est 'process', pas 'run'
    const result = await mcpServer.process(prompt, session.data);
    res.json(result);
});

app.listen(config.PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${config.PORT}`);
});