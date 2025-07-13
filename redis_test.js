// redis_test.js
import { Redis } from 'ioredis';

// --- Configuration ---
// On se connecte au port 6379, qui est exposé par Docker sur votre machine locale.
const REDIS_PORT = 6379;
const REDIS_HOST = '127.0.0.1';

console.log(`Tentative de connexion à Redis sur ${REDIS_HOST}:${REDIS_PORT}...`);

// Crée un nouveau client Redis
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 1, // On ne veut pas de tentatives infinies pour ce test
});

// Gère les erreurs de connexion
redis.on('error', (err) => {
  console.error('❌ Erreur de connexion Redis :', err.message);
  // Le script se terminera à cause de l'erreur
});

// Confirme la connexion
redis.on('connect', () => {
  console.log('✅ Connecté avec succès à Redis !');
});

// Fonction principale pour exécuter les tests
async function runRedisTests() {
  try {
    // Test 1: Envoyer une commande PING
    console.log('\n--- Test 1: PING ---');
    const pingResponse = await redis.ping();
    console.log(`Réponse du serveur : ${pingResponse}`);
    if (pingResponse !== 'PONG') {
      throw new Error('La réponse au PING est incorrecte.');
    }
    console.log('✅ Le test PING a réussi.');

    // Test 2: Définir et récupérer une clé
    console.log('\n--- Test 2: SET / GET ---');
    const testKey = 'test:worker';
    const testValue = `La connexion fonctionne à ${new Date().toLocaleTimeString()}`;

    console.log(`Définition de la clé '${testKey}'...`);
    await redis.set(testKey, testValue);

    console.log(`Récupération de la clé '${testKey}'...`);
    const retrievedValue = await redis.get(testKey);

    if (retrievedValue === testValue) {
      console.log('✅ Le test SET/GET a réussi.');
      console.log(` -> Valeur récupérée : "${retrievedValue}"`);
    } else {
      throw new Error('La valeur récupérée ne correspond pas à la valeur définie.');
    }
  } catch (error) {
    console.error('\n❌ Un test a échoué :', error.message);
  } finally {
    // On ferme la connexion pour que le script se termine
    console.log('\nFermeture de la connexion...');
    redis.quit();
  }
}

// Attendre que la connexion soit établie avant de lancer les tests
redis.on('ready', runRedisTests);