import { z } from 'zod';
import { getConfig } from '../../../../config.ts';
import type { Tool } from '../../../../types.ts';

const PingParams = z.object({});

export const pingTool: Tool<typeof PingParams> = {
  description:
    'Health check tool that returns "pong" to verify the Alpha Vantage tools are working correctly',

  execute: async (params, context) => {
    const { log } = context;

    try {
      log.info('Alpha Vantage ping tool executed');

      const response = {
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
        service: 'Alpha Vantage Tools for AgenticForge',
      };

      log.info('Alpha Vantage ping successful', response);

      return response;
    } catch (error) {
      log.error({ err: error }, 'Error in Alpha Vantage ping tool');
      throw new Error(
        `Alpha Vantage ping tool failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  name: 'alpha_vantage_ping',
  parameters: PingParams,
};
