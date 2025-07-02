import { exec, type ExecException } from 'child_process';
// src/tools/system/restartServer.tool.ts
import { z } from 'zod';
import { Context } from 'fastmcp';
import type { Tool, SessionData } from '../../types.js';

import { getErrDetails } from '../../utils/errorUtils.js';

export const restartServerParams = z.object({
  reason: z
    .string()
    .optional()
    .describe('The reason for the restart (e.g., loading a new tool).'),
});

export const restartServerTool: Tool<typeof restartServerParams> = {
  description:
    'Restarts the agent server and workers to apply changes, such as loading a new tool.',
  execute: async (args, ctx: Context<SessionData>) => {
    ctx.log.warn('AGENT IS INITIATING A SERVER RESTART.', {
      reason: args.reason,
    });
    const command = 'docker-compose restart server worker';
    exec(
      command,
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          // CORRECTION DÉFINITIVE : Séparation du message et de l'objet de données.
          const errDetails = getErrDetails(error);
          ctx.log.error('Failed to execute restart command.', {
            message: errDetails.message,
            name: errDetails.name,
            stack: errDetails.stack,
            stderr,
            stdout,
          });
        }
      },
    );
    return `Restart command issued for reason: ${args.reason || 'No reason specified'}. The server will be unavailable for a moment.`;
  },
  name: 'system_restartServer',
  parameters: restartServerParams,
};
