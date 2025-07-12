import { exec } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getErrDetails } from '../../utils/errorUtils.js';

export const executeDevCommandParams = z.object({
  command: z
    .string()
    .describe(
      'The shell command to execute (e.g., "pnpm install", "tsc --noEmit")',
    ),
});

export const executeDevCommandTool: Tool<typeof executeDevCommandParams> = {
  description: 'Executes shell commands locally within the project directory.',
  execute: async (args: z.infer<typeof executeDevCommandParams>, ctx: Ctx) => {
    ctx.log.info(`Executing dev command locally: "${args.command}"`);
    return new Promise((resolve) => {
      exec(args.command, (error, stdout, stderr) => {
        let output = '';
        if (error) {
          output += `Exit Code: ${error.code}\n`;
          const errDetails = getErrDetails(error);
          ctx.log.error('Dev command execution failed', {
            message: errDetails.message,
            name: errDetails.name,
            stack: errDetails.stack,
          });
          output += `--- ERROR ---\n${errDetails.message}\n`;
        }
        if (stdout) output += `--- STDOUT ---\n${stdout}\n`;
        if (stderr) output += `--- STDERR ---\n${stderr}\n`;
        resolve(output);
      });
    });
  },
  name: 'executeDevCommand',
  parameters: executeDevCommandParams,
};
