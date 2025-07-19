import { spawn } from 'child_process';
import { z } from 'zod';

import { config } from '../../config.js';
import type { Ctx, Tool } from '../../types.js';

import { redis } from '../../redisClient.js';

export const executeShellCommandParams = z.object({
  command: z.string().describe('The shell command to execute.'),
});

export const executeShellCommandOutput = z.object({
  exitCode: z.number(),
  stderr: z.string(),
  stdout: z.string(),
});

export const executeShellCommandTool: Tool<
  typeof executeShellCommandParams,
  typeof executeShellCommandOutput
> = {
  description:
    'Executes ANY shell command on the system and streams its output in real-time. Use this tool for tasks requiring direct operating system interaction, such as listing files, running scripts, or managing processes. Be cautious, as this tool can perform powerful and potentially dangerous operations.',
  execute: async (
    args: z.infer<typeof executeShellCommandParams>,
    ctx: Ctx,
  ) => {
    try {
      return await new Promise((resolve) => {
        ctx.log.info(`Spawning shell command: ${args.command}`);

        const child = spawn(args.command, {
          cwd: config.WORKSPACE_PATH,
          shell: true,
          stdio: 'pipe',
        });

        let stdout = '';
        let stderr = '';

        const streamToFrontend = (
          type: 'stderr' | 'stdout',
          content: string,
        ) => {
          const channel = `job:${ctx.job!.id}:events`;
          const data = { data: { content, type }, type: 'tool_stream' };
          redis.publish(channel, JSON.stringify(data));
        };

        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stdout += chunk;
          ctx.log.info(`[stdout] ${chunk}`);
          streamToFrontend('stdout', chunk);
        });

        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          stderr += chunk;
          ctx.log.error(`[stderr] ${chunk}`);
          streamToFrontend('stderr', chunk);
        });

        child.on('error', (error) => {
          ctx.log.error(
            { err: error },
            `Failed to start shell command: ${args.command}`,
          );
          resolve({
            exitCode: 1, // Indicate an error exit code
            stderr: stderr + `Failed to start command: ${error.message}`,
            stdout: '',
          });
        });

        child.on('close', (code) => {
          const finalMessage = `--- COMMAND FINISHED ---\nExit Code: ${code}`;
          ctx.log.info(finalMessage);
          streamToFrontend('stdout', `\n${finalMessage}`);

          resolve({
            exitCode: code ?? 1, // Use 1 if code is null (e.g., killed by signal)
            stderr,
            stdout,
          });
        });
      });
    } catch (error: unknown) {
      ctx.log.error({ err: error }, `Error in executeShellCommandTool`);
      return {
        exitCode: 1,
        stderr: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        stdout: '',
      };
    }
  },
  name: 'run_shell_command',
  parameters: executeShellCommandParams,
};
