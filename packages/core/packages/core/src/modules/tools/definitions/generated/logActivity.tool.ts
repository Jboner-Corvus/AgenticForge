
// Outil généré par l'agent : log-activity
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';


export const logActivityParams = z.object(z.object({ message: z.string().describe('The message to log.') }));

export const logActivityTool: Tool<typeof logActivityParams> = {
  name: 'log-activity',
  description: 'Logs a message with a timestamp to activity.log.',
  parameters: logActivityParams,
  execute: async (args, ctx: Ctx) => {
    const timestamp = new Date().toISOString();
const logEntry = `${timestamp} - ${message}\n`;
let existingContent = '';
try {
  existingContent = await tools.readFile({ path: 'activity.log' });
} catch (error) {
  // If file doesn't exist, existingContent remains empty.
  // This is expected and fine, as writeFile will create it.
}
const newContent = existingContent + logEntry;
await tools.writeFile({ path: 'activity.log', content: newContent });
return `Message logged to activity.log: ${message}`;
  },
};
