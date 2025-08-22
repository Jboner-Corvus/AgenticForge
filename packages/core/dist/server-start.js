import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  initializeWebServer
} from "./chunk-UAWRYNOZ.js";
import "./chunk-KBVJI43H.js";
import "./chunk-5OF3AFAD.js";
import "./chunk-DE5MSL2E.js";
import "./chunk-ZEBJECHX.js";
import "./chunk-6VDWH2OR.js";
import "./chunk-TJOGLTT7.js";
import "./chunk-LCH7Z4UB.js";
import {
  getRedisClientInstance
} from "./chunk-SIBAPVHV.js";
import {
  getLoggerInstance
} from "./chunk-E5QXXMSG.js";
import {
  config,
  loadConfig
} from "./chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/server-start.ts
init_esm_shims();
import { Client as PgClient } from "pg";
async function startServer() {
  await loadConfig();
  const logger = getLoggerInstance();
  logger.info(`Resolved WORKSPACE_PATH: ${config.WORKSPACE_PATH}`);
  logger.info(`Resolved HOST_PROJECT_PATH: ${config.HOST_PROJECT_PATH}`);
  await new Promise((res) => setTimeout(res, 15e3));
  let pgClient = null;
  let connected = false;
  for (let i = 0; i < 5; i++) {
    try {
      logger.info("PostgreSQL Connection Parameters:");
      logger.info(`  Database: ${config.POSTGRES_DB}`);
      logger.info(`  Host: ${config.POSTGRES_HOST}`);
      logger.info(`  Port: ${config.POSTGRES_PORT}`);
      logger.info(`  User: ${config.POSTGRES_USER}`);
      logger.info(
        `  Password: ${config.POSTGRES_PASSWORD ? "********" : "undefined"}`
      );
      pgClient = new PgClient({
        database: config.POSTGRES_DB,
        host: config.POSTGRES_HOST,
        password: config.POSTGRES_PASSWORD,
        port: config.POSTGRES_PORT,
        user: config.POSTGRES_USER
      });
      await pgClient.connect();
      logger.info("Connected to PostgreSQL.");
      connected = true;
      break;
    } catch (err) {
      logger.warn(
        { err },
        `Failed to connect to PostgreSQL, retrying... (${i + 1}/5)`
      );
      await new Promise((res) => setTimeout(res, 1e4));
    }
  }
  if (!connected || !pgClient) {
    logger.error("Could not connect to PostgreSQL after 5 attempts, exiting.");
    process.exit(1);
  }
  pgClient.on("error", (err) => {
    logger.error({ err }, "PostgreSQL client error");
  });
  const redisClient = getRedisClientInstance();
  const { server } = await initializeWebServer(pgClient, redisClient);
  const port = config.PORT || 3001;
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
  process.on("exit", () => {
    pgClient?.end();
    logger.info("PostgreSQL client disconnected.");
  });
}
startServer().catch((err) => {
  getLoggerInstance().fatal({ err }, "Failed to start web server");
  process.exit(1);
});
