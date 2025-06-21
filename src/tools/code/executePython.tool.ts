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
  execute: async (args, ctx: Ctx<typeof executePythonParams>) => {
    ctx.log.info({ code: args.code }, 'Executing Python code in sandbox.');
    try {
       const result = await runInSandbox(config.PYTHON_SANDBOX_IMAGE, ['python', '-c', args.code]);
      
      let output = `Exit Code: ${result.exitCode}\n`;
      if (result.stdout) output += `--- STDOUT ---\n${result.stdout}\n`;
      if (result.stderr) output += `--- STDERR ---\n${result.stderr}\n`;
      return output;

    } catch (error) {
      const err = error as Error;
      ctx.log.error({ err: err.message }, 'Python sandbox execution failed');
      return `Error: Failed to execute Python code. ${err.message}`;
    }
  },
};
