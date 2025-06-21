/**
 * src/server.ts (Corrigé et Linted)
 *
 * Ce fichier implémente le serveur d'outils en utilisant FastMCP.
 * Son rôle unique est de charger et d'exposer tous les outils disponibles
 * via un endpoint HTTP, conformément aux meilleures pratiques de FastMCP.
 */
import { FastMCP } from 'fastmcp';
import { config } from './config.js';
import logger from './logger.js';
import { allTools } from './tools/index.js';
import type { AgentSession, Tool } from './types.js';

const mcp = new FastMCP<AgentSession>({
  name: 'Agentic Prometheus Tool Server',
  version: '1.0.0',
  health: {
    enabled: true,
    path: '/health',
  },
  ping: {
    enabled: false,
  },
});

logger.info('Registering tools...');
for (const tool of allTools) {
  // CORRECTION : Suppression du cast `as any` en assurant la compatibilité des types.
  mcp.addTool(tool as Tool);
  logger.debug(`Registered tool: ${tool.name}`);
}
logger.info('All tools registered successfully.');

async function startServer() {
  try {
    await mcp.start({
      transportType: 'httpStream',
      httpStream: {
        endpoint: '/api/v1/agent/stream',
        port: config.PORT,
      },
    });
    logger.info(
      {
        port: config.PORT,
        endpoint: '/api/v1/agent/stream',
        tools_count: allTools.length,
      },
      '🚀 FastMCP Tool Server is running and ready to accept connections.',
    );
  } catch (error) {
    logger.fatal({ err: error }, '💀 Failed to start FastMCP server.');
    process.exit(1);
  }
}

const gracefulShutdown = (signal: string) => {
  logger.warn(`${signal} received, shutting down server gracefully.`);
  mcp
    .stop()
    .then(() => {
      logger.info('Server stopped.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Error during server shutdown.');
      process.exit(1);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception!');
  process.exit(1);
});

void startServer();

export default mcp;
