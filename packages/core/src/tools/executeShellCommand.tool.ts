import { spawn } from 'child_process';
import { z } from 'zod';
import type { Ctx, Tool } from '../types.js';
import { redis } from '../redisClient.js'; // Assuming redisClient.ts exports a redis instance

export const executeShellCommandParams = z.object({
  command: z.string().describe('The shell command to execute.'),
});

export const executeShellCommandTool: Tool<typeof executeShellCommandParams> = {
  description: 'Executes a shell command and streams its output in real-time.',
  name: 'executeShellCommand',
  parameters: executeShellCommandParams,
  execute: async (args, ctx: Ctx) => {
    // La fonction execute doit maintenant être une promesse qui gère les streams
    return new Promise((resolve, reject) => {
      ctx.log.info(`Spawning shell command: ${args.command}`);
      
      // Utilise spawn pour lancer la commande
      const child = spawn(args.command, {
        shell: true, // Important pour interpréter les commandes complexes
        stdio: 'pipe',
      });

      // Fonction pour envoyer un événement de streaming au frontend
      const streamToFrontend = (type: 'stdout' | 'stderr', content: string) => {
        // Publie sur le canal Redis que le frontend écoute
        const channel = `job:${ctx.job!.id}:events`;
        const data = { type: 'tool_stream', data: { type, content } };
        redis.publish(channel, JSON.stringify(data));
      };
      
      // Écoute le flux stdout
      child.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        ctx.log.info(`[stdout] ${chunk}`);
        streamToFrontend('stdout', chunk);
      });

      // Écoute le flux stderr
      child.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        ctx.log.error(`[stderr] ${chunk}`);
        streamToFrontend('stderr', chunk);
      });

      // Gère les erreurs de spawn
      child.on('error', (error) => {
        ctx.log.error({ err: error }, `Failed to start shell command: ${args.command}`);
        reject(new Error(`Failed to start command: ${error.message}`));
      });

      // Lorsque la commande est terminée
      child.on('close', (code) => {
        const finalMessage = `--- COMMAND FINISHED ---\nExit Code: ${code}`;
        ctx.log.info(finalMessage);
        streamToFrontend('stdout', `\n${finalMessage}`);
        
        // Résout la promesse pour que l'agent puisse continuer
        resolve(`Command finished with exit code ${code}.`);
      });
    });
  },
};