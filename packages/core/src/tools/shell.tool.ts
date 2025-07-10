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
    return new Promise((resolve) => {
      exec(args.command, (error, stdout, stderr) => {
        let output = '';

        if (stdout) {
          output += `--- STDOUT ---\n${stdout}\n`;
        }
        if (stderr) {
          output += `--- STDERR ---\n${stderr}\n`;
        }

        if (error) {
          output += `--- EXECUTION FAILED ---\nExit Code: ${error.code}\n`;
          ctx.log.error(
            { err: error },
            `Shell command failed: ${args.command}`,
          );
        } else {
          output += `--- SUCCESS ---\nExit Code: 0\n`;
        }

        ctx.log.info(`Shell command executed. Full output:\n${output}`);
        // Nous retournons un objet pour être cohérent avec les autres outils
        resolve({ output: output.trim() });
      });
    });
  },
  name: 'shell',
  parameters: shellParams,
};
