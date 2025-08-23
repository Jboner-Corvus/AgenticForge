import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getLogger
} from "./chunk-5JE7E5SU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/redis/redisClient.ts
init_esm_shims();
import IORedis from "ioredis";
var logger = getLogger();
var redisClient = null;
var redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  maxRetriesPerRequest: null,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
};
var getRedisClientInstance = () => {
  if (!redisClient) {
    if (process.env.NODE_ENV === "test") {
      throw new Error(
        "Redis client not initialized for test environment. Use setRedisClientInstance."
      );
    }
    try {
      redisClient = new IORedis(redisOptions);
      redisClient.on("connect", () => {
        logger.info("Successfully connected to Redis.");
      });
      redisClient.on("error", (err) => {
        logger.error({ err }, "Redis connection error:");
      });
    } catch (error) {
      logger.error({ error }, "Failed to create Redis client");
      throw error;
    }
  }
  return redisClient;
};
var setRedisClientInstance = (client) => {
  redisClient = client;
};
var disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client disconnected.");
  }
};

export {
  getRedisClientInstance,
  setRedisClientInstance,
  disconnectRedis
};
