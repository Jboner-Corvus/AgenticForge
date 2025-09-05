// Test de chargement de la configuration comme dans le worker
import { config, loadConfig } from './packages/core/dist/config.js';
import { getLoggerInstance } from './packages/core/dist/logger.js';

// Simuler le chargement de la configuration comme dans le worker
async function testWorkerConfig() {
  console.log('🚀 Test de chargement de la configuration du worker...');
  
  try {
    // Charger la configuration
    await loadConfig();
    console.log('✅ Configuration chargée avec succès');
    
    // Afficher les valeurs importantes
    console.log('WORKSPACE_PATH:', config.WORKSPACE_PATH);
    console.log('HOST_PROJECT_PATH:', config.HOST_PROJECT_PATH);
    console.log('LLM_PROVIDER:', config.LLM_PROVIDER);
    console.log('REDIS_HOST:', config.REDIS_HOST);
    
    // Vérifier si le WORKSPACE_PATH est défini
    if (config.WORKSPACE_PATH) {
      console.log('✅ WORKSPACE_PATH est correctement défini');
    } else {
      console.log('❌ WORKSPACE_PATH n\'est pas défini');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la configuration:', error);
  }
}

testWorkerConfig().catch(console.error);