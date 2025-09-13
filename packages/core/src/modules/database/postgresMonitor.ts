import { getLogger } from '../../logger.ts';
import { PostgresPoolManager } from './postgresPool.ts';

const logger = getLogger().child({ component: 'PostgresMonitor' });

export interface PostgresMetrics {
  pool: {
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    totalConnections: number;
    utilizationRate: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    responseTime: number;
    errorCount: number;
  };
  performance: {
    averageQueryTime: number;
    slowQueriesCount: number;
    connectionErrors: number;
  };
}

export class PostgresMonitor {
  private poolManager: PostgresPoolManager;
  private metrics: PostgresMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(poolManager: PostgresPoolManager) {
    this.poolManager = poolManager;
    this.metrics = this.getInitialMetrics();
    this.startHealthMonitoring();
  }

  private getInitialMetrics(): PostgresMetrics {
    return {
      pool: {
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        totalConnections: 0,
        utilizationRate: 0,
      },
      health: {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        errorCount: 0,
      },
      performance: {
        averageQueryTime: 0,
        slowQueriesCount: 0,
        connectionErrors: 0,
      },
    };
  }

  private startHealthMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Toutes les 30 secondes

    logger.info('PostgreSQL monitoring started');
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Test de connexion simple
      const client = await this.poolManager.getClient();
      const queryStart = Date.now();
      await client.query('SELECT 1 as health_check');
      const queryTime = Date.now() - queryStart;
      client.release();

      const responseTime = Date.now() - startTime;

      // Mettre à jour les métriques
      this.metrics.health = {
        status:
          responseTime < 1000
            ? 'healthy'
            : responseTime < 5000
              ? 'degraded'
              : 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime,
        errorCount: 0, // Reset on success
      };

      this.metrics.performance.averageQueryTime = queryTime;

      // Log si dégradé ou unhealthy
      if (this.metrics.health.status !== 'healthy') {
        logger.warn(
          {
            status: this.metrics.health.status,
            responseTime,
            queryTime,
          },
          'PostgreSQL health check degraded',
        );
      }
    } catch (error) {
      this.metrics.health.errorCount++;
      this.metrics.health.status = 'unhealthy';
      this.metrics.health.lastCheck = new Date().toISOString();
      this.metrics.performance.connectionErrors++;

      logger.error({ error }, 'PostgreSQL health check failed');
    }

    // Mettre à jour les métriques du pool
    this.updatePoolMetrics();
  }

  private updatePoolMetrics() {
    const poolStats = this.poolManager.getStats();

    this.metrics.pool = {
      activeConnections: poolStats.totalCount - poolStats.idleCount,
      idleConnections: poolStats.idleCount,
      waitingClients: poolStats.waitingCount,
      totalConnections: poolStats.totalCount,
      utilizationRate:
        poolStats.totalCount > 0
          ? ((poolStats.totalCount - poolStats.idleCount) /
              poolStats.totalCount) *
            100
          : 0,
    };
  }

  public getMetrics(): PostgresMetrics {
    // Mettre à jour les métriques du pool avant de retourner
    this.updatePoolMetrics();
    return { ...this.metrics };
  }

  public async runHealthCheck(): Promise<boolean> {
    try {
      const client = await this.poolManager.getClient();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error({ error }, 'Manual PostgreSQL health check failed');
      return false;
    }
  }

  public getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    return this.metrics.health.status;
  }

  public isHealthy(): boolean {
    return this.metrics.health.status === 'healthy';
  }

  public getPoolUtilization(): number {
    return this.metrics.pool.utilizationRate;
  }

  public stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    logger.info('PostgreSQL monitoring stopped');
  }

  public resetMetrics() {
    this.metrics = this.getInitialMetrics();
    logger.info('PostgreSQL metrics reset');
  }
}

// Singleton pour l'application
let monitor: PostgresMonitor | null = null;

export function getPostgresMonitor(
  poolManager: PostgresPoolManager,
): PostgresMonitor {
  if (!monitor) {
    monitor = new PostgresMonitor(poolManager);
  }
  return monitor;
}

export function stopPostgresMonitoring(): void {
  if (monitor) {
    monitor.stopMonitoring();
    monitor = null;
  }
}
