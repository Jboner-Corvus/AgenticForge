import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { Tool } from '../../../../types';
import { getRedisClientInstance } from '../../../redis/redisClient';

// Define the parameters for the delegateTask tool
const delegateTaskParams = z.object({
  agent: z
    .enum(['gemini-cli', 'qwen-cli'])
    .describe('The specialized agent to use.'),
  taskDescription: z
    .string()
    .describe('The task to delegate to a specialized agent.'),
});

const getApiCredits = async (agent: string): Promise<number> => {
  const redis = getRedisClientInstance();
  const creditsKey = `api-credits:${agent}`;
  let credits = await redis.get(creditsKey);

  if (credits === null) {
    // Initialize credits if they don't exist
    await redis.set(creditsKey, 100);
    credits = '100';
  }

  return parseInt(credits, 10);
};

const delegateTaskTool: Tool<typeof delegateTaskParams> = {
  description:
    'Delegates a task to a specialized agent and returns a job ID to stream the output.',
  execute: async ({ agent, taskDescription }) => {
    const redis = getRedisClientInstance();
    const credits = await getApiCredits(agent);

    if (credits <= 0) {
      return `Error: No API credits left for ${agent}.`;
    }

    const creditsKey = `api-credits:${agent}`;
    await redis.decr(creditsKey);

    const jobId = uuidv4();
    const channel = `job:${jobId}:events`;

    console.log(
      `Delegating task "${taskDescription}" to ${agent}. Streaming output to job ID: ${jobId}`,
    );

    // Do not wait for the promise to resolve
    spawnChildProcess(taskDescription, agent, channel);

    return `Task delegated. You can stream the output using the job ID: ${jobId}`;
  },
  name: 'delegateTask',
  parameters: delegateTaskParams,
};

const spawnChildProcess = (
  taskDescription: string,
  agent: string,
  channel: string,
) => {
  const redis = getRedisClientInstance();
  const child = spawn(agent, [taskDescription], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const message = { content: data.toString(), type: 'stdout' };
    redis.publish(channel, JSON.stringify(message));
  });

  child.stderr.on('data', (data) => {
    const message = { content: data.toString(), type: 'stderr' };
    redis.publish(channel, JSON.stringify(message));
  });

  child.on('close', (code) => {
    const message = {
      content: `Agent ${agent} exited with code ${code}.`,
      type: 'status',
    };
    redis.publish(channel, JSON.stringify(message));
  });

  child.on('error', (err) => {
    const message = {
      content: `Failed to start agent ${agent}: ${err.message}`,
      type: 'error',
    };
    redis.publish(channel, JSON.stringify(message));
  });
};

export default delegateTaskTool;
