import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const restartServerParams = z.object({
  reason: z.string().optional().describe('The reason for the restart (e.g., loading a new tool).'),
});

export const restartServerTool: Tool<typeof restartServerParams> = {
  name: 'system_restartServer',
  description:
    'Restarts the agent server and workers to apply changes, such as loading a new tool.',
  parameters: restartServerParams,
  execute: async (args, ctx: Ctx<typeof restartServerParams>) => {
    ctx.log.warn({ reason: args.reason }, 'AGENT IS INITIATING A SERVER RESTART.');

    const command = 'docker-compose restart server worker';

    exec(command, (error, stdout, stderr) => {
      if (error) {
        ctx.log.error({ err: error, stdout, stderr }, 'Failed to execute restart command.');
      }
    });

    return `Restart command issued for reason: ${args.reason || 'No reason specified'}. The server will be unavailable for a moment.`;
  },
};
