import { z } from 'zod';
import { Tool } from 'fastmcp';
import { redis } from '../../../redisClient.js';

export const recallTool = new Tool({
  name: 'system.recall',
  description: 'Recalls information stored under a specific key from the agent's memory.',
  schema: z.object({
    key: z.string().describe('The key to recall the information from.'),
  }),
  async execute({ key }, { log }) {
    try {
      const value = await redis.get(`memory:${key}`);
      if (value) {
        log.info(`Successfully recalled from memory: ${key}`);
        return { success: true, value, message: `Information recalled from key: ${key}` };
      } else {
        log.info(`No information found for key: ${key}`);
        return { success: false, message: `No information found for key: ${key}` };
      }
    } catch (error) {
      log.error({ error }, 'Error recalling from memory');
      return { success: false, message: `Failed to recall from memory: ${(error as Error).message}` };
    }
  },
});