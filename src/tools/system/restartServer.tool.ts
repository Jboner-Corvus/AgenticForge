/**
 * src/tools/system/restartServer.tool.ts
 *
 * Outil Prométhéen : Permet à l'agent de se redémarrer lui-même.
 * Ceci est nécessaire pour charger les nouveaux outils créés dynamiquement.
 */
import { z } from 'zod';
import type { Tool, Ctx } from '@fastmcp/fastmcp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const restartServerParams = z.object({
  reason: z.string().optional().describe('The reason for the restart (e.g., loading a new tool).'),
});

export const restartServerTool: Tool<typeof restartServerParams> = {
  name: 'system_restartServer',
  description:
    'Restarts the agent server and workers to apply changes, such as loading a new tool.',
  parameters: restartServerParams,
  execute: async (args, ctx: Ctx) => {
    ctx.log.warn({ reason: args.reason }, 'AGENT IS INITIATING A SERVER RESTART.');

    // La commande exacte dépend de l'environnement.
    // Dans notre cas, nous sommes dans Docker, donc nous utilisons docker-compose.
    // Cela suppose que la commande `docker` est disponible dans le conteneur du serveur.
    // Il faudrait monter le socket Docker pour que cela fonctionne.
    const command = 'docker-compose restart server worker';

    // On ne `await` pas la commande, car le processus serveur va être tué.
    // On lance la commande et on retourne un message immédiatement.
    exec(command, (error, stdout, stderr) => {
      if (error) {
        ctx.log.error({ err: error, stdout, stderr }, 'Failed to execute restart command.');
      }
    });

    // Ce message sera probablement le dernier envoyé avant que le serveur ne s'arrête.
    return `Restart command issued for reason: ${args.reason}. The server will be unavailable for a moment.`;
  },
};
