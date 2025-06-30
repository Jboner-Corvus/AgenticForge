// FICHIER : src/server.ts
import logger from './logger.js';
import { startWebServer } from './webServer.js';
import { startWorker } from './worker.js';

async function startApplication() {
  logger.info('Démarrage de l\'application AgenticForge...');

  // Démarrer le serveur web
  await startWebServer();

  // Démarrer le worker
  await startWorker();

  logger.info('Application AgenticForge démarrée.');
}

startApplication().catch((error) => {
  logger.error({ error }, 'Erreur critique lors du démarrage de l\'application.');
  process.exit(1);
});