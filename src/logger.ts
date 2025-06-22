// ===== src/logger.ts (Corrigé et Simplifié) =====
import * as pino from 'pino';
import { config } from './config.js';
import type { LoggerOptions } from 'pino';

// Configuration simplifiée qui fonctionne de manière fiable dans tous les environnements.
const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
  // REMARQUE: Le transport pino-pretty n'est plus configuré dans le code
  // pour éviter les erreurs de déploiement dans Docker.
  // Pour un affichage "joli" en développement local, vous pouvez lancer
  // votre application et piper la sortie vers pino-pretty.
  // Exemple: `pnpm run dev | pnpm exec pino-pretty`
};

// CORRECTION: Pour contourner l'erreur de typage persistante, nous utilisons
// une assertion de type 'any' pour forcer TypeScript à traiter
// 'pino.default' comme une fonction appelable.
const logger = (pino.default as any)(pinoOptions);

export default logger;
