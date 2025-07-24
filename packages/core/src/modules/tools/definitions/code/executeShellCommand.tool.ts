import { z } from 'zod';

import type { Ctx, Tool } from '@/types.js';

import { executeShellCommand } from '../../../../utils/shellUtils.js';
import { redis } from '../../../redis/redisClient.js';

export const executeShellCommandParams = z.object({
  command: z.string().describe('The shell command to execute.'),
  detach: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'If true, the command will be executed in the background and the tool will return immediately.',
    ),
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
    if (args.detach) {
      // Enqueue the command for background execution
      const jobId = `shell-command-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await ctx.taskQueue.add(
        'execute-shell-command-detached', // Job name for the worker
        {
          command: args.command,
          jobId: ctx.job!.id,
          notificationChannel: `job:${ctx.job!.id}:events`,
        },
        { jobId: jobId, removeOnComplete: true, removeOnFail: true },
      );
      ctx.log.info(
        `Enqueued detached shell command: ${args.command} with job ID: ${jobId}`,
      );
      return {
        exitCode: 0,
        stderr: '',
        stdout: `Command "${args.command}" enqueued for background execution with job ID: ${jobId}. Results will be streamed to the frontend.`,
      };
    }

    try {
      return await executeShellCommand(args.command);
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
