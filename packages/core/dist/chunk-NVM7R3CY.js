import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getLogger
} from "./chunk-ODN6V7GO.js";
import {
  config
} from "./chunk-W2OHWP3M.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/database/postgresPool.ts
init_esm_shims();
import { Pool } from "pg";
var logger = getLogger();
var poolConfig = {
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  // Configuration optimisée du pool
  min: 2,
  // Minimum de connexions maintenues
  max: 20,
  // Maximum de connexions (ajustable selon charge)
  idleTimeoutMillis: 3e4,
  // Fermer les connexions idle après 30s
  connectionTimeoutMillis: 2e3,
  // Timeout de connexion 2s
  // Gestion d'erreurs améliorée
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};
var PostgresPoolManager = class {
  pool;
  isShuttingDown = false;
  constructor() {
    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
    this.setupHealthMonitoring();
  }
  setupEventHandlers() {
    this.pool.on("error", (err, client) => {
      logger.error({ err }, "Unexpected error on idle client");
    });
    this.pool.on("connect", (client) => {
      logger.debug("New client connected to PostgreSQL");
    });
    this.pool.on("remove", (client) => {
      logger.debug("Client removed from pool");
    });
  }
  setupHealthMonitoring() {
    setInterval(() => {
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      logger.debug({ stats }, "PostgreSQL pool statistics");
    }, 3e4);
  }
  async getClient() {
    if (this.isShuttingDown) {
      throw new Error("Pool is shutting down");
    }
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error({ error }, "Failed to get client from pool");
      throw error;
    }
  }
  async query(text, params) {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
  async close() {
    this.isShuttingDown = true;
    logger.info("Closing PostgreSQL pool...");
    await this.pool.end();
    logger.info("PostgreSQL pool closed");
  }
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
};
var poolManager = null;
function getPostgresPool() {
  if (!poolManager) {
    poolManager = new PostgresPoolManager();
  }
  return poolManager;
}

// src/modules/database/circuitBreaker.ts
init_esm_shims();
var logger2 = getLogger().child({ component: "CircuitBreaker" });
var DatabaseCircuitBreaker = class {
  state = {
    failures: 0,
    lastFailureTime: 0,
    state: "CLOSED"
  };
  failureThreshold = 5;
  resetTimeout = 6e4;
  // 1 minute
  monitoringInterval = 3e4;
  // 30 secondes
  constructor() {
    setInterval(() => {
      this.logState();
    }, this.monitoringInterval);
  }
  async execute(operation) {
    if (this.state.state === "OPEN") {
      if (Date.now() - this.state.lastFailureTime > this.resetTimeout) {
        this.state.state = "HALF_OPEN";
        logger2.info("Circuit breaker moved to HALF_OPEN");
      } else {
        const remainingTime = Math.ceil((this.resetTimeout - (Date.now() - this.state.lastFailureTime)) / 1e3);
        throw new Error(`Circuit breaker is OPEN - database unavailable. Retry in ${remainingTime}s`);
      }
    }
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  onSuccess() {
    if (this.state.state === "HALF_OPEN") {
      logger2.info("Circuit breaker test successful - moved to CLOSED");
    }
    this.state.failures = 0;
    this.state.state = "CLOSED";
  }
  onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    if (this.state.failures >= this.failureThreshold) {
      this.state.state = "OPEN";
      logger2.warn({
        failures: this.state.failures,
        threshold: this.failureThreshold
      }, "Circuit breaker opened due to too many failures");
    } else {
      logger2.warn({
        failures: this.state.failures,
        threshold: this.failureThreshold
      }, "Database operation failed, incrementing failure count");
    }
  }
  logState() {
    logger2.debug({
      state: this.state.state,
      failures: this.state.failures,
      timeSinceLastFailure: Date.now() - this.state.lastFailureTime
    }, "Circuit breaker state");
  }
  getState() {
    return {
      ...this.state,
      timeSinceLastFailure: Date.now() - this.state.lastFailureTime,
      isAvailable: this.state.state !== "OPEN" || Date.now() - this.state.lastFailureTime > this.resetTimeout
    };
  }
  reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: "CLOSED"
    };
    logger2.info("Circuit breaker manually reset");
  }
};

// src/modules/database/postgresMonitor.ts
init_esm_shims();
var logger3 = getLogger().child({ component: "PostgresMonitor" });
var PostgresMonitor = class {
  poolManager;
  metrics;
  healthCheckInterval = null;
  isMonitoring = false;
  constructor(poolManager2) {
    this.poolManager = poolManager2;
    this.metrics = this.getInitialMetrics();
    this.startHealthMonitoring();
  }
  getInitialMetrics() {
    return {
      pool: {
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        totalConnections: 0,
        utilizationRate: 0
      },
      health: {
        status: "healthy",
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: 0,
        errorCount: 0
      },
      performance: {
        averageQueryTime: 0,
        slowQueriesCount: 0,
        connectionErrors: 0
      }
    };
  }
  startHealthMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 3e4);
    logger3.info("PostgreSQL monitoring started");
  }
  async performHealthCheck() {
    const startTime = Date.now();
    try {
      const client = await this.poolManager.getClient();
      const queryStart = Date.now();
      await client.query("SELECT 1 as health_check");
      const queryTime = Date.now() - queryStart;
      client.release();
      const responseTime = Date.now() - startTime;
      this.metrics.health = {
        status: responseTime < 1e3 ? "healthy" : responseTime < 5e3 ? "degraded" : "unhealthy",
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime,
        errorCount: 0
        // Reset on success
      };
      this.metrics.performance.averageQueryTime = queryTime;
      if (this.metrics.health.status !== "healthy") {
        logger3.warn({
          status: this.metrics.health.status,
          responseTime,
          queryTime
        }, "PostgreSQL health check degraded");
      }
    } catch (error) {
      this.metrics.health.errorCount++;
      this.metrics.health.status = "unhealthy";
      this.metrics.health.lastCheck = (/* @__PURE__ */ new Date()).toISOString();
      this.metrics.performance.connectionErrors++;
      logger3.error({ error }, "PostgreSQL health check failed");
    }
    this.updatePoolMetrics();
  }
  updatePoolMetrics() {
    const poolStats = this.poolManager.getStats();
    this.metrics.pool = {
      activeConnections: poolStats.totalCount - poolStats.idleCount,
      idleConnections: poolStats.idleCount,
      waitingClients: poolStats.waitingCount,
      totalConnections: poolStats.totalCount,
      utilizationRate: poolStats.totalCount > 0 ? (poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount * 100 : 0
    };
  }
  getMetrics() {
    this.updatePoolMetrics();
    return { ...this.metrics };
  }
  async runHealthCheck() {
    try {
      const client = await this.poolManager.getClient();
      await client.query("SELECT 1");
      client.release();
      return true;
    } catch (error) {
      logger3.error({ error }, "Manual PostgreSQL health check failed");
      return false;
    }
  }
  getHealthStatus() {
    return this.metrics.health.status;
  }
  isHealthy() {
    return this.metrics.health.status === "healthy";
  }
  getPoolUtilization() {
    return this.metrics.pool.utilizationRate;
  }
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    logger3.info("PostgreSQL monitoring stopped");
  }
  resetMetrics() {
    this.metrics = this.getInitialMetrics();
    logger3.info("PostgreSQL metrics reset");
  }
};
var monitor = null;
function getPostgresMonitor(poolManager2) {
  if (!monitor) {
    monitor = new PostgresMonitor(poolManager2);
  }
  return monitor;
}

// src/modules/database/index.ts
init_esm_shims();

export {
  getPostgresPool,
  DatabaseCircuitBreaker,
  getPostgresMonitor
};
