// --- Fichier : src/tools/code/executePython.tool.ts ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { config } from '../../config.js';
import { runInSandbox } from '../../utils/dockerManager.js';

export const executePythonParams = z.object({
  code: z.string().describe('The Python code to execute.'),
});

export const executePythonTool: Tool<typeof executePythonParams> = {
  name: 'executePython',
  description: 'Executes Python 3 code in a secure sandboxed environment.',
  parameters: executePythonParams,
  execute: async (args, ctx: Ctx) => {
    ctx.log.info('Executing Python code in sandbox.', { code: args.code });
    try {
      const result = await runInSandbox(config.PYTHON_SANDBOX_IMAGE, [ 'python', '-c', args.code ]);
      let output = `Exit Code: ${result.exitCode}\n`;
      if (result.stdout) output += `--- STDOUT ---\n${result.stdout}\n`;
      if (result.stderr) output += `--- STDERR ---\n${result.stderr}\n`;
      return output;
    } catch (error) {
      const err = error as Error;
      ctx.log.error('Python sandbox execution failed', { err: { message: err.message, stack: err.stack } });
      return `Error: Failed to execute Python code. ${err.message}`;
    }
  },
};