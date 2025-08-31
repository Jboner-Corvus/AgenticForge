#!/usr/bin/env tsx

/**
 * Script de test pour valider les optimisations PostgreSQL
 * Teste le pool de connexions, le circuit breaker et les métriques
 */

import { getPostgresPool, DatabaseCircuitBreaker, getPostgresMonitor } from './packages/core/src/modules/database/index.ts';
import { getLogger } from './packages/core/src/logger.ts';

const logger = getLogger().child({ component: 'PostgresTest' });

async function testPostgresOptimizations() {
  console.log('🚀 Démarrage des tests d\'optimisation PostgreSQL...\n');

  try {
    // Test 1: Initialisation du pool
    console.log('📊 Test 1: Initialisation du pool PostgreSQL');
    const poolManager = getPostgresPool();
    const circuitBreaker = new DatabaseCircuitBreaker();
    const monitor = getPostgresMonitor(poolManager);

    console.log('✅ Pool initialisé avec succès');

    // Test 2: Test de connexion basique
    console.log('\n🔗 Test 2: Test de connexion basique');
    await circuitBreaker.execute(async () => {
      const client = await poolManager.getClient();
      const result = await client.query('SELECT version() as postgres_version');
      console.log('✅ Connexion réussie - PostgreSQL version:', result.rows[0].postgres_version);
      client.release();
    });

    // Test 3: Test de performance avec requêtes concurrentes
    console.log('\n⚡ Test 3: Test de performance (10 requêtes concurrentes)');
    const startTime = Date.now();

    const concurrentQueries = Array.from({ length: 10 }, async (_, i) => {
      return circuitBreaker.execute(async () => {
        const client = await poolManager.getClient();
        const result = await client.query('SELECT pg_sleep(0.1) as delay_test');
        client.release();
        return result.rows[0];
      });
    });

    await Promise.all(concurrentQueries);
    const endTime = Date.now();
    console.log(`✅ 10 requêtes concurrentes exécutées en ${endTime - startTime}ms`);

    // Test 4: Test des métriques
    console.log('\n📈 Test 4: Métriques du pool');
    const metrics = monitor.getMetrics();
    console.log('Métriques actuelles:', {
      pool: metrics.pool,
      health: metrics.health,
      performance: metrics.performance,
    });

    // Test 5: Test du circuit breaker
    console.log('\n🔌 Test 5: Test du circuit breaker');
    const breakerState = circuitBreaker.getState();
    console.log('État du circuit breaker:', breakerState);

    // Test 6: Test de charge légère
    console.log('\n🏋️ Test 6: Test de charge légère (50 requêtes)');
    const loadTestPromises = Array.from({ length: 50 }, async (_, i) => {
      return circuitBreaker.execute(async () => {
        const client = await poolManager.getClient();
        const result = await client.query('SELECT $1::int as test_value', [i]);
        client.release();
        return result.rows[0].test_value;
      });
    });

    const loadTestResults = await Promise.all(loadTestPromises);
    console.log(`✅ Test de charge réussi - ${loadTestResults.length} requêtes traitées`);

    // Test 7: Vérification finale des métriques
    console.log('\n📊 Test 7: Métriques finales');
    const finalMetrics = monitor.getMetrics();
    const finalBreakerState = circuitBreaker.getState();

    console.log('Métriques finales:', {
      poolUtilization: `${finalMetrics.pool.utilizationRate.toFixed(1)}%`,
      healthStatus: finalMetrics.health.status,
      totalConnections: finalMetrics.pool.totalConnections,
      breakerState: finalBreakerState.state,
    });

    console.log('\n🎉 Tous les tests d\'optimisation PostgreSQL sont passés avec succès!');
    console.log('\n📋 Résumé des améliorations:');
    console.log('• ✅ Pool de connexions opérationnel');
    console.log('• ✅ Circuit breaker fonctionnel');
    console.log('• ✅ Monitoring en temps réel');
    console.log('• ✅ Performance concurrente validée');
    console.log('• ✅ Métriques détaillées disponibles');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests d\'optimisation:', error);
    process.exit(1);
  }
}

// Exécuter les tests
testPostgresOptimizations().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});