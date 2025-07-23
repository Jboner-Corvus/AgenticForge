import { Worker } from 'bullmq';
import { spawn } from 'child_process';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { redis } from '../redis/redisClient.js';

const shellCommandWorker = new Worker(
  'execute-shell-command-detached',
  async (job) => {
    const { command, notificationChannel } = job.data;
    const log = logger.child({ command, jobId: job.id });

    log.info(`Executing detached shell command: ${command}`);

    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(command, {
          cwd: config.WORKSPACE_PATH,
          shell: '/bin/bash',
          stdio: 'pipe',
        });

        let _stdout = '';
        let _stderr = '';

        const streamToFrontend = (
          type: 'stderr' | 'stdout',
          content: string,
        ) => {
          const data = { data: { content, type }, type: 'tool_stream' };
          redis.publish(notificationChannel, JSON.stringify(data));
        };

        child.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          _stdout += chunk;
          log.info(`[stdout] ${chunk}`);
          streamToFrontend('stdout', chunk);
        });

        child.stderr.on('data', (data: Buffer) => {
          const chunk = data.toString();
          _stderr += chunk;
          log.error(`[stderr] ${chunk}`);
          streamToFrontend('stderr', chunk);
        });

        child.on('error', (error) => {
          log.error(
            { err: error },
            `Failed to start detached shell command: ${command}`,
          );
          streamToFrontend(
            'stderr',
            `Failed to start command: ${error.message}`,
          );
          reject(error);
        });

        child.on('close', (code) => {
          const finalMessage = `--- COMMAND FINISHED ---\nExit Code: ${code}`;
          log.info(finalMessage);
          streamToFrontend('stdout', `\n${finalMessage}`);

          if (code !== 0) {
            reject(new Error(`Command exited with code ${code}`));
          } else {
            resolve();
          }
        });
      });
      log.info(`Detached shell command completed successfully: ${command}`);
    } catch (error: unknown) {
      log.error(
        { err: error },
        `Error executing detached shell command: ${command}`,
      );
      throw error; // Re-throw to mark job as failed in BullMQ
    }
  },
  { connection: redis },
);

shellCommandWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed for command: ${job.data.command}`);
  redis.publish(
    job.data.notificationChannel,
    JSON.stringify({
      data: { jobId: job.id, status: 'completed' },
      type: 'tool_stream_end',
    }),
  );
});

shellCommandWorker.on('failed', (job, err) => {
  logger.error(
    { err },
    `Job ${job?.id} failed for command: ${job?.data.command}`,
  );
  redis.publish(
    job?.data.notificationChannel,
    JSON.stringify({
      data: { error: err.message, jobId: job?.id, status: 'failed' },
      type: 'tool_stream_end',
    }),
  );
});

export default shellCommandWorker;
