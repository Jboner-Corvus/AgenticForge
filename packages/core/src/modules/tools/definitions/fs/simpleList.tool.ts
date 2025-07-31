import { exec } from 'child_process';
import { z } from 'zod';

import type { Tool } from '@/types.js';

export const simpleListParams = z.object({});

export const simpleListOutput = z.string();

export const simpleListTool: Tool<
  typeof simpleListParams,
  typeof simpleListOutput
> = {
  description: 'A simple tool to list files using ls -F.',
  execute: async () => {
    return new Promise((resolve) => {
      exec('ls -F', (error, stdout, stderr) => {
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
