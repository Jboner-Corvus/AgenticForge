import { exec } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../../types.js';

export const getTextFromUrlParams = z.object({
  url: z.string().url().describe('The URL to fetch plain text from.'),
});

export const getTextFromUrlOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const getTextFromUrlTool: Tool<typeof getTextFromUrlParams, typeof getTextFromUrlOutput> = {
  description:
    'Fetches the textual content of a web page after stripping HTML tags. Useful for static pages.',
  execute: (args, _ctx: Ctx) => {
    return new Promise((resolve) => {
      try {
        exec(`curl -sL "${args.url}"`, (error, stdout, stderr) => {
          if (error) {
            resolve({ "erreur": `Error fetching URL: ${stderr}` });
            return;
          }
          const textContent = stdout
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s\s+/g, ' ')
            .trim();

          resolve(textContent);
        });
      } catch (error: any) {
        resolve({ "erreur": `An unexpected error occurred: ${error.message || error}` });
      }
    });
  },
  name: 'getTextFromUrl',
  parameters: getTextFromUrlParams,
};
