/**
 * Fichier : src/webServer.ts
 * Rôle : Point d'entrée principal. Configure l'environnement, le serveur et gère son cycle de vie.
 * Statut : Corrigé et robuste.
 */

import http from 'http';
import * as dotenv from 'dotenv';
// === DÉBUT DE LA CORRECTION D'IMPORT ===
import { app } from './server.js'; // Correction: Ajout de l'extension .js
// === FIN DE LA CORRECTION D'IMPORT ===

dotenv.config();

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

const server = http.createServer(app);

try {
  server.listen(PORT, () => {
    console.log(
      `✅ Serveur démarré en mode [${ENV}] sur http://localhost:${PORT}`,
    );
  });
} catch (error) {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
}

const gracefulShutdown = (signal: string) => {
  console.log(`\n🚦 Signal [${signal}] reçu. Arrêt progressif du serveur...`);
  server.close(() => {
    console.log('✅ Serveur HTTP fermé.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
