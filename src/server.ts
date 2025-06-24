// src/server.ts (CODE DE TEST FINAL - AVEC UN OUTIL FACTICE)

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import logger from './logger.js';
import type { IncomingMessage } from 'http';
import { config } from './config.js';

async function main() {
    logger.warn('--- DÉMARRAGE DU SERVEUR EN MODE TEST FINAL ---');

    const mcpServer = new FastMCP({
      name: 'Agentic-Forge-TEST-SERVER',
      version: '9.9.9',
      
      authenticate: async (request: IncomingMessage): Promise<any> => {
        logger.fatal("--- ✅ AUTHENTICATE A ÉTÉ ATTEINT ! Le pipeline de requête fonctionne ! ---");
        throw new Error("ERREUR DE TEST FINALE : Build et pipeline de requête validés.");
      },
      health: { enabled: true, path: '/health' },
    });

    // On ajoute un outil factice pour que le framework soit content.
    const dummyTool = {
        name: 'dummyTool',
        description: 'A tool just to make the server happy.',
        parameters: z.object({}),
        execute: async () => { return "hello"; }
    };
    mcpServer.addTool(dummyTool);


    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: { port: config.PORT },
    });

    logger.info(`🐉 Serveur de TEST FINAL démarré sur 0.0.0.0:${config.PORT}`);
}

void main();