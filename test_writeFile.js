import { writeFile } from './packages/core/dist/modules/tools/definitions/fs/writeFile.tool.js';
import { config } from './packages/core/dist/config.js';

// Charger la configuration
await import('./packages/core/dist/config.js').then((module) => {
  module.loadConfig().catch(console.error);
});

// Attendre un peu pour que la configuration soit chargée
await new Promise((resolve) => setTimeout(resolve, 1000));

// Test du writeFile
const testArgs = {
  content: 'Contenu du test 1',
  path: 'test1.txt',
};

const testCtx = {
  log: {
    info: console.log,
    error: console.error,
    warn: console.warn,
  },
  config: config,
};

console.log("Test de l'outil writeFile...");
console.log('WORKSPACE_PATH:', config.WORKSPACE_PATH);

writeFile
  .execute(testArgs, testCtx)
  .then((result) => {
    console.log('Résultat:', result);
  })
  .catch((error) => {
    console.error('Erreur:', error);
  });
