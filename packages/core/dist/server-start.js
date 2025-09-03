import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  initializeWebServer
} from "./chunk-KF6AEDXV.js";
import {
  DatabaseCircuitBreaker,
  getPostgresMonitor,
  getPostgresPool
} from "./chunk-NVM7R3CY.js";
import "./chunk-AE23EWBX.js";
import "./chunk-FYJSLOGB.js";
import "./chunk-DE5MSL2E.js";
import "./chunk-CO4VKFV6.js";
import "./chunk-Y2RPXT4B.js";
import "./chunk-GWM7R3BS.js";
import {
  getRedisClientInstance
} from "./chunk-HKREBWDH.js";
import "./chunk-7NFV5TWA.js";
import {
  getLoggerInstance
} from "./chunk-ODN6V7GO.js";
import {
  config,
  loadConfig
} from "./chunk-W2OHWP3M.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/server-start.ts
init_esm_shims();
process.on("unhandledRejection", (reason, promise) => {
  const logger = getLoggerInstance();
  logger.fatal({ promise, reason }, "Unhandled rejection caught!");
});
process.on("uncaughtException", (error) => {
  const logger = getLoggerInstance();
  logger.fatal({ error }, "Uncaught exception caught!");
});
async function checkServerLock(redisClient) {
  const lockKey = "server:singleton:lock";
  const lockTimeout = 60;
  const processId = `${process.pid}:${Date.now()}`;
  try {
    const result = await redisClient.set(lockKey, processId, "EX", lockTimeout, "NX");
    if (result === "OK") {
      getLoggerInstance().info(`\u2705 Server lock acquired by process ${process.pid}`);
      const refreshInterval = setInterval(async () => {
        try {
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.expire(lockKey, lockTimeout);
            getLoggerInstance().debug(`\u{1F504} Server lock refreshed by process ${process.pid}`);
          } else {
            clearInterval(refreshInterval);
            getLoggerInstance().warn(`\u26A0\uFE0F Server lock lost by process ${process.pid}, shutting down`);
            process.exit(0);
          }
        } catch (error) {
          getLoggerInstance().error({ error }, "Error refreshing server lock");
        }
      }, lockTimeout / 2 * 1e3);
      process.on("SIGTERM", async () => {
        clearInterval(refreshInterval);
        await redisClient.del(lockKey);
        getLoggerInstance().info(`\u{1F9F9} Server lock released by process ${process.pid}`);
      });
      process.on("SIGINT", async () => {
        clearInterval(refreshInterval);
        await redisClient.del(lockKey);
        getLoggerInstance().info(`\u{1F9F9} Server lock released by process ${process.pid}`);
      });
      return true;
    } else {
      const existingLock = await redisClient.get(lockKey);
      getLoggerInstance().warn(`\u274C Server already running with lock: ${existingLock}, process ${process.pid} will exit`);
      return false;
    }
  } catch (error) {
    getLoggerInstance().error({ error }, "Error checking server lock");
    return false;
  }
}
async function startServer() {
  await loadConfig();
  const logger = getLoggerInstance();
  const redisClient = getRedisClientInstance();
  const canProceed = await checkServerLock(redisClient);
  if (!canProceed) {
    logger.info("\u{1F6AB} [SERVER] Another server is already running, exiting...");
    process.exit(0);
  }
  logger.info(`Resolved WORKSPACE_PATH: ${config.WORKSPACE_PATH}`);
  logger.info(`Resolved HOST_PROJECT_PATH: ${config.HOST_PROJECT_PATH}`);
  const poolManager = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();
  const monitor = getPostgresMonitor(poolManager);
  logger.info("PostgreSQL Connection Parameters:");
  logger.info(`  Database: ${config.POSTGRES_DB}`);
  logger.info(`  Host: ${config.POSTGRES_HOST}`);
  logger.info(`  Port: ${config.POSTGRES_PORT}`);
  logger.info(`  User: ${config.POSTGRES_USER}`);
  logger.info(`  Password: ${config.POSTGRES_PASSWORD ? "********" : "undefined"}`);
  logger.info(`  Pool Config: min=${poolManager.getStats().idleCount}, max=20`);
  let connected = false;
  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute(async () => {
        const client = await poolManager.getClient();
        await client.query("SELECT 1 as connection_test");
        client.release();
      });
      logger.info("PostgreSQL pool initialized successfully");
      connected = true;
      break;
    } catch (err) {
      logger.warn(
        { err },
        `Failed to initialize PostgreSQL pool, retrying... (${i + 1}/5)`
      );
      await new Promise((res) => setTimeout(res, 1e4));
    }
  }
  if (!connected) {
    logger.error("Could not initialize PostgreSQL pool after 5 attempts, exiting.");
    process.exit(1);
  }
  const healthStatus = monitor.getHealthStatus();
  logger.info({ healthStatus }, "PostgreSQL initial health status");
  const dbWrapper = {
    query: (text, params) => poolManager.query(text, params),
    // Méthodes de compatibilité pour l'ancienne interface
    connect: async () => {
      const client = await poolManager.getClient();
      return client;
    },
    end: async () => {
      await poolManager.close();
    },
    on: (event, handler) => {
      if (event === "error") {
        logger.error("Database wrapper error event");
      }
    }
  };
  const { server } = await initializeWebServer(dbWrapper, redisClient);
  const port = config.PORT || 3001;
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
  process.on("exit", async () => {
    await poolManager.close();
    logger.info("PostgreSQL pool closed.");
  });
  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully...");
    await poolManager.close();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    await poolManager.close();
    process.exit(0);
  });
}
startServer().catch((err) => {
  getLoggerInstance().fatal({ err }, "Failed to start web server");
  process.exit(1);
});
