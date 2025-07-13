import { spawn } from 'child_process';
import { z } from 'zod';

import type { Ctx, Tool } from '../types.js';

import { redis } from '../redisClient.js';

export const executeShellCommandParams = z.object({
  command: z.string().describe('The shell command to execute.'),
});

export const executeShellCommandOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const executeShellCommandTool: Tool<typeof parameters, typeof executeShellCommandOutput> = {
  description: 'Executes a shell command and streams its output in real-time.',
  execute: async (args, ctx: Ctx) => {
    try {
      return await new Promise((resolve) => {
        ctx.log.info(`Spawning shell command: ${args.command}`);

        const child = spawn(args.command, {
          shell: true,
          stdio: 'pipe',
        });

        const streamToFrontend = (type: 'stderr' | 'stdout', content: string) => {
          const channel = `job:${ctx.job!.id}:events`;
          const data = { data: { content, type }, type: 'tool_stream' };
          redis.publish(channel, JSON.stringify(data));
        };

        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          ctx.log.info(`[stdout] ${chunk}`);
          streamToFrontend('stdout', chunk);
        });

        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          ctx.log.error(`[stderr] ${chunk}`);
          streamToFrontend('stderr', chunk);
        });

        child.on('error', (error) => {
          ctx.log.error(
            { err: error },
            `Failed to start shell command: ${args.command}`,
          );
          resolve({ "erreur": `Failed to start command: ${error.message}` });
        });

        child.on('close', (code) => {
          const finalMessage = `--- COMMAND FINISHED ---\nExit Code: ${code}`;
          ctx.log.info(finalMessage);
          streamToFrontend('stdout', `\n${finalMessage}`);

          if (code !== 0) {
            resolve({ "erreur": `Command finished with exit code ${code}.` });
          } else {
            resolve(`Command finished with exit code ${code}.`);
          }
        });
      });
    } catch (error: any) {
      ctx.log.error({ err: error }, `Error in executeShellCommandTool`);
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'runShellCommand',
  parameters: executeShellCommandParams,
};
