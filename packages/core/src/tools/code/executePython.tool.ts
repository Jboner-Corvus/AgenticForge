import { exec } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

import { getErrDetails } from '../../utils/errorUtils.js';

export const executePythonParams = z.object({
  code: z.string().describe('The Python code to execute.'),
});

export const executePythonTool: Tool<typeof executePythonParams> = {
  description: 'Executes Python 3 code locally.',
  execute: async (args: z.infer<typeof executePythonParams>, ctx: Ctx) => {
    ctx.log.info('Executing Python code locally.', { code: args.code });
    return new Promise((resolve) => {
      exec(`python -c "${args.code.replace(/"/g, '"')}"`, (error, stdout, stderr) => {
        let output = '';
        if (error) {
          output += `Exit Code: ${error.code}\n`;
          const errDetails = getErrDetails(error);
          ctx.log.error('Python execution failed', {
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
  name: 'executePython',
  parameters: executePythonParams,
};
