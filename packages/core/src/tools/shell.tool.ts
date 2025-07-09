import { exec } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../types.js';

// Définir les paramètres attendus par l'outil
export const shellParams = z.object({
  command: z.string().describe('The shell command to execute.'),
});

export const shellTool: Tool<typeof shellParams> = {
  description: 'Executes a shell command.',
  execute: async (args, ctx: Ctx) => {
    return new Promise((resolve, reject) => {
      exec(args.command, (error, stdout, stderr) => {
        if (error) {
          ctx.log.error(
            { err: error },
            `Failed to execute shell command: ${args.command}`,
          );
          reject(new Error(`Shell command failed: ${error.message}`));
          return;
        }
        if (stderr) {
          ctx.log.warn(`Shell command stderr: ${stderr}`);
        }
        ctx.log.info(`Shell command stdout: ${stdout}`);
        resolve(stdout);
      });
    });
  },
  name: 'shell',
  parameters: shellParams,
};
