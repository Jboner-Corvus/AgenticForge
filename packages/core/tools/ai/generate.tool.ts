import { z } from 'zod';
import { Tool } from '../../types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const generateTool: Tool<typeof z.any, typeof z.any> = {
  name: 'generate',
  description: 'Generates content using the Gemini API.',
  inputSchema: z.object({
    prompt: z.string(),
  }),
  outputSchema: z.any(),
  async execute({ input }) {
    const { prompt } = input;
    const scriptPath = 'packages/core/tools/ai/generate.py';
    const command = `python3 ${scriptPath} "${prompt}"`;

    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        throw new Error(stderr);
      }
      return stdout;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

export default generateTool;
