
// Outil généré par l'agent : check-website-status
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';


export const checkWebsiteStatusParams = z.object(z.object({ url: z.string().describe('The URL to check.') }));

export const checkWebsiteStatusTool: Tool<typeof checkWebsiteStatusParams> = {
  name: 'check-website-status',
  description: 'Checks the online status of a given URL using Python and the requests library.',
  parameters: checkWebsiteStatusParams,
  execute: async (args, ctx: Ctx) => {
    const { url } = params;
const installCommand = 'pip install requests';
const pythonCommand = `python check_website.py ${url}`;

try {
  const installResult = await executeShellCommand({ command: installCommand });
  console.log('Install requests result:', installResult);
} catch (error) {
  console.error('Failed to install requests:', error);
}

const result = await executeShellCommand({ command: pythonCommand });
return result.stdout.trim();
  },
};
