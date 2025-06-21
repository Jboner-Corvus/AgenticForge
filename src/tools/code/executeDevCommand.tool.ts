// --- Fichier : src/tools/code/executeDevCommand.tool.ts ---
import { z } from 'zod';
import type { Tool, Ctx } from '../../types.js';
import { config } from '../../config.js';
import { runInSandbox } from '../../utils/dockerManager.js';

// Création d'une image Docker de base pour le développement Node.js/TypeScript
const DEV_SANDBOX_IMAGE = 'node:20-alpine';

export const executeDevCommandParams = z.object({
  command: z
    .string()
    .describe(
      'La commande shell à exécuter (ex: "pnpm install", "tsc --noEmit", "pnpm run lint")',
    ),
});

export const executeDevCommandTool: Tool<typeof executeDevCommandParams> = {
  name: 'executeDevCommand',
  description:
    'Executes shell commands within a secure sandbox that includes Node.js and pnpm. Ideal for project management tasks like installing dependencies, compiling, and linting.',
  parameters: executeDevCommandParams,
  execute: async (args, ctx: Ctx) => {
    ctx.log.info(`Executing dev command in sandbox: "${args.command}"`);
    try {
      // La commande est scindée pour être passée correctement à `runInSandbox`
      const commandParts = args.command.split(' ');
      const result = await runInSandbox(DEV_SANDBOX_IMAGE, commandParts, {
        // Montage du répertoire de travail pour que les commandes agissent sur le projet
        workingDir: '/usr/src/app',
        mounts: [
          {
            Type: 'bind',
            Source: process.cwd(), // Correction : 'source' devient 'Source'
            Target: '/usr/src/app', // Correction : 'target' devient 'Target'
          },
        ],
      });

      let output = `Exit Code: ${result.exitCode}\n`;
      if (result.stdout) {
        output += `--- STDOUT ---\n${result.stdout}\n`;
      }
      if (result.stderr) {
        output += `--- STDERR ---\n${result.stderr}\n`;
      }
      return output;
    } catch (error) {
      const err = error as Error;
      ctx.log.error('Dev command sandbox execution failed', {
        err: { message: err.message, stack: err.stack },
      });
      return `Error: Failed to execute dev command. ${err.message}`;
    }
  },
};
