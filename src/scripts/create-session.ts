// src/scripts/create-session.ts
import { Redis } from 'ioredis';
import { config } from '../config.js';
import type { AgentSession, SessionData } from '../types.js';
import logger from '../logger.js';

// Réutiliser la connexion Redis du serveur
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

const SESSION_EXPIRATION_SECONDS = 24 * 3600; // 24 heures

/**
 * Crée et sauvegarde une nouvelle session d'agent dans Redis.
 * @param sessionId L'identifiant unique pour la nouvelle session.
 */
async function createAgentSession(sessionId: string): Promise<void> {
  const log = logger.child({ script: 'create-session', sessionId });

  log.info("Vérification de l'existence de la session...");
  const existingSession = await redis.get(`session:${sessionId}`);
  if (existingSession) {
    log.warn('Une session avec cet ID existe déjà. Aucune action effectuée.');
    return;
  }

  log.info('Création de la nouvelle structure de session...');
  const sessionData: SessionData = {
    sessionId: sessionId,
    headers: { 'internal-creation': 'true' }, // En-têtes minimaux
    clientIp: 'localhost',
    authenticatedAt: Date.now(),
  };

  const agentSession: AgentSession = {
    id: sessionId,
    auth: sessionData,
    history: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  try {
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(agentSession),
      'EX',
      SESSION_EXPIRATION_SECONDS,
    );
    log.info(
      `✅ Session créée avec succès pour l'ID: ${sessionId}. Expiration dans 24 heures.`,
    );
  } catch (error) {
    log.error(
      { err: error },
      'Erreur lors de la sauvegarde de la session dans Redis.',
    );
    throw error; // Propage l'erreur pour que le script échoue
  }
}

// Point d'entrée du script
async function main() {
  // Récupérer l'ID de session depuis les arguments de la ligne de commande
  const sessionId = process.argv[2];

  if (!sessionId) {
    logger.error('Erreur: Aucun ID de session fourni.');
    logger.info(
      'Usage: pnpm exec ts-node src/scripts/create-session.ts <sessionId>',
    );
    process.exit(1);
  }

  try {
    await createAgentSession(sessionId);
    await redis.quit();
    process.exit(0);
  } catch {
    // CORRECTION : La variable d'erreur a été complètement retirée.
    logger.fatal('Échec de la création de la session.');
    await redis.quit();
    process.exit(1);
  }
}

void main();
