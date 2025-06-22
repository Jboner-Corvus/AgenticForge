// ===== src/logger.ts (Corrigé et Robuste) =====
import pino from 'pino';
import type { LoggerOptions } from 'pino';
import { config } from 'src/config.js';

// Configuration simplifiée qui fonctionne de manière fiable dans tous les environnements.
const pinoOptions: LoggerOptions = {
  level: config.LOG_LEVEL,
  // REMARQUE: Le transport pino-pretty n'est plus configuré dans le code
  // pour éviter les erreurs de déploiement dans Docker.
  // Pour un affichage "joli" en développement local, vous pouvez lancer
  // votre application et piper la sortie vers pino-pretty.
  // Exemple: `pnpm run dev | pnpm exec pino-pretty`
};

// Cette approche gère la complexité des modules CJS/ESM.
// 'pino' importé avec `import pino from 'pino'` est l'objet module,
// et la fonction constructeur est sur la propriété 'default'.
// Nous utilisons `(pino as any)` pour contourner les problèmes de déclaration de types.
const loggerConstructor = (pino as any).default || pino;

const logger = loggerConstructor(pinoOptions);

export default logger;
