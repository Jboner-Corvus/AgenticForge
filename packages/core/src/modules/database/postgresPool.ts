import { Pool, PoolConfig, PoolClient } from 'pg';
import { getLogger } from '../../logger.ts';
import { config } from '../../config.ts';

const logger = getLogger();

const poolConfig: PoolConfig = {
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,

  // Configuration optimisée du pool
  min: 2, // Minimum de connexions maintenues
  max: 20, // Maximum de connexions (ajustable selon charge)
  idleTimeoutMillis: 30000, // Fermer les connexions idle après 30s
  connectionTimeoutMillis: 2000, // Timeout de connexion 2s

  // Gestion d'erreurs améliorée
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

export class PostgresPoolManager {
  private pool: Pool;
  private isShuttingDown = false;

  constructor() {
    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
    this.setupHealthMonitoring();
  }

  private setupEventHandlers() {
    // Gestion des erreurs de pool
    this.pool.on('error', (err, client) => {
      logger.error({ err }, 'Unexpected error on idle client');
    });

    // Logging des connexions
    this.pool.on('connect', (client) => {
      logger.debug('New client connected to PostgreSQL');
    });

    this.pool.on('remove', (client) => {
      logger.debug('Client removed from pool');
    });
  }

  private setupHealthMonitoring() {
    // Monitoring périodique du pool
    setInterval(() => {
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      };
      logger.debug({ stats }, 'PostgreSQL pool statistics');
    }, 30000); // Toutes les 30 secondes
  }

  public async getClient(): Promise<PoolClient> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }

    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error({ error }, 'Failed to get client from pool');
      throw error;
    }
  }

  public async query(text: string, params?: any[]) {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async close() {
    this.isShuttingDown = true;
    logger.info('Closing PostgreSQL pool...');
    await this.pool.end();
    logger.info('PostgreSQL pool closed');
  }

  public getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

// Singleton pattern
let poolManager: PostgresPoolManager | null = null;

export function getPostgresPool(): PostgresPoolManager {
  if (!poolManager) {
    poolManager = new PostgresPoolManager();
  }
  return poolManager;
}

export async function closePostgresPool(): Promise<void> {
  if (poolManager) {
    await poolManager.close();
    poolManager = null;
  }
}
