// src/tools/code/executePython.tool.ts
import { z } from 'zod';

import { config } from '../../config.js';
import { runInSandbox } from '../../utils/dockerManager.js';
import { getErrDetails } from '../../utils/errorUtils.js';
export const executePythonParams = z.object({
  code: z.string().describe('The Python code to execute.'),
});
export const executePythonTool = {
  description: 'Executes Python 3 code in a secure sandboxed environment.',
  execute: async (args, ctx) => {
    ctx.log.info('Executing Python code in sandbox.', { code: args.code });
    try {
      const result = await runInSandbox(config.PYTHON_SANDBOX_IMAGE, [
        'python',
        '-c',
        args.code,
      ]);
      let output = `Exit Code: ${result.exitCode}\n`;
      if (result.stdout) output += `--- STDOUT ---\n${result.stdout}\n`;
      if (result.stderr) output += `--- STDERR ---\n${result.stderr}\n`;
      return output;
    } catch (error) {
      // CORRECTION DÉFINITIVE : Séparation du message et de l'objet de données.
      const errDetails = getErrDetails(error);
      ctx.log.error('Python sandbox execution failed', {
        message: errDetails.message,
        name: errDetails.name,
        stack: errDetails.stack,
      });
      return `Error: Failed to execute Python code. ${errDetails.message}`;
    }
  },
  name: 'executePython',
  parameters: executePythonParams,
};
//# sourceMappingURL=executePython.tool.js.map
