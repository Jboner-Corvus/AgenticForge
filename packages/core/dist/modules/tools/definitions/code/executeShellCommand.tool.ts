import { z } from 'zod';

import { Ctx, Tool } from '../../../../types.ts';
import { executeShellCommand } from '../../../../utils/shellUtils.ts';

export const executeShellCommandParams = z.object({
  command: z.string().describe('The shell command to execute.'),
  detach: z
    .boolean()
    .optional()
    .describe(
      'If true, the command will be executed in the background and the tool will return immediately.',
    ),
});

export const executeShellCommandOutput = z.object({
  exitCode: z.number().nullable(),
  stderr: z.string(),
  stdout: z.string(),
});

export const executeShellCommandTool: Tool<
  typeof executeShellCommandParams,
  typeof executeShellCommandOutput
> = {
  description:
    'Executes ANY shell command, including complex ones like `ls -la`. Use this for direct OS interaction like listing files, running scripts, or process management. Be cautious with destructive commands.',
  execute: async (
    args: z.infer<typeof executeShellCommandParams>,
    ctx: Ctx,
  ) => {
    const detachCommand = args.detach ?? false; // Handle default here

    if (detachCommand) {
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
      const result = await executeShellCommand(args.command, ctx);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ctx.log.error(
        { err: error },
        `Error executing shell command: ${errorMessage}`,
      );
      return {
        exitCode: 1,
        stderr: `An unexpected error occurred: ${errorMessage}`,
        stdout: '',
      };
    }
  },
  name: 'executeShellCommand',
  parameters: executeShellCommandParams,
};
