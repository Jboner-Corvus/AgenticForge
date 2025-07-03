import { z } from 'zod';
import { Tool } from 'fastmcp';
import { redis } from '../../../redisClient.js';

export const writeTool = new Tool({
  name: 'system.write',
  description: 'Writes a key-value pair to the agent's memory.',
  schema: z.object({
    key: z.string().describe('The key to store the information under.'),
    value: z.string().describe('The information to store.'),
  }),
  async execute({ key, value }, { log }) {
    try {
      await redis.set(`memory:${key}`, value);
      log.info(`Successfully wrote to memory: ${key}`);
      return { success: true, message: `Information stored under key: ${key}` };
    } catch (error) {
      log.error({ error }, 'Error writing to memory');
      return { success: false, message: `Failed to write to memory: ${(error as Error).message}` };
    }
  },
});