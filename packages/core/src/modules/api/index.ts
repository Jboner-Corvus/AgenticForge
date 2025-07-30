// FICHIER : src/server.ts
import '../../tracing.js'; // Initialize OpenTelemetry
import { Client as PgClient } from 'pg';

import { config } from '../../config.js';
import { getLogger } from '../../logger.js';
import { initializeWebServer } from '../../webServer.js';
import { getJobQueue } from '../queue/queue.js';

async function startApplication() {
  const logger = getLogger();
  logger.info("Démarrage de l'application AgenticForge...");

  const pgClient = new PgClient({
    connectionString: process.env.DATABASE_URL,
  });
  await pgClient.connect();
  logger.info('Connected to PostgreSQL.');

  try {
    // Démarrer le serveur web
    logger.info('Démarrage du serveur web...');
    const { server } = await initializeWebServer(getJobQueue(), pgClient);
    const port = config.PORT || 3001;
    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
    logger.info('Serveur web AgenticForge démarré.');
  } catch (error) {
    logger.error(
      { error },
      "Erreur lors de l'initialisation de l'application.",
    );
    throw error; // Rethrow to be caught by the final catch block
  }
}

startApplication().catch((error) => {
  getLogger().error(
    error,
    "Erreur critique lors du démarrage de l'application.",
  );
  process.exit(1);
});
