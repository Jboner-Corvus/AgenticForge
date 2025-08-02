import { exec } from 'child_process';
import { z } from 'zod';

import type { Tool } from '../../../../types.js';

export const simpleListParams = z.object({
  detailed: z.boolean().optional(),
});

export const simpleListOutput = z.string();

export const simpleListTool: Tool<
  typeof simpleListParams,
  typeof simpleListOutput
> = {
  description: 'Provides a simple, non-detailed list of files and directories.',
  execute: async (params) => {
    return new Promise((resolve) => {
      const command = params.detailed ? 'ls -la' : 'ls -F';
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          resolve(`stderr: ${stderr}`);
          return;
        }
        resolve(stdout);
      });
    });
  },
  name: 'simpleList',
  parameters: simpleListParams,
};
