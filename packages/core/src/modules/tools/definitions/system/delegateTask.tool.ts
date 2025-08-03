
import { z } from 'zod';
import { Tool } from '../../../../types';
import { spawn } from 'child_process';
import { getRedisClientInstance } from '../../../redis/redisClient';
import { v4 as uuidv4 } from 'uuid';

// Define the parameters for the delegateTask tool
const delegateTaskParams = z.object({
  taskDescription: z.string().describe("The task to delegate to a specialized agent."),
  agent: z.enum(['gemini-cli', 'qwen-cli']).describe("The specialized agent to use."),
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
  name: 'delegateTask',
  description: 'Delegates a task to a specialized agent and returns a job ID to stream the output.',
  parameters: delegateTaskParams,
  execute: async ({ taskDescription, agent }) => {
    const redis = getRedisClientInstance();
    const credits = await getApiCredits(agent);

    if (credits <= 0) {
      return `Error: No API credits left for ${agent}.`;
    }

    const creditsKey = `api-credits:${agent}`;
    await redis.decr(creditsKey);
    
    const jobId = uuidv4();
    const channel = `job:${jobId}:events`;

    console.log(`Delegating task "${taskDescription}" to ${agent}. Streaming output to job ID: ${jobId}`);

    // Do not wait for the promise to resolve
    spawnChildProcess(taskDescription, agent, channel);

    return `Task delegated. You can stream the output using the job ID: ${jobId}`;
  },
};

const spawnChildProcess = (taskDescription: string, agent: string, channel: string) => {
  const redis = getRedisClientInstance();
  const child = spawn(agent, [taskDescription], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const message = { type: 'stdout', content: data.toString() };
    redis.publish(channel, JSON.stringify(message));
  });

  child.stderr.on('data', (data) => {
    const message = { type: 'stderr', content: data.toString() };
    redis.publish(channel, JSON.stringify(message));
  });

  child.on('close', (code) => {
    const message = { type: 'status', content: `Agent ${agent} exited with code ${code}.` };
    redis.publish(channel, JSON.stringify(message));
  });

  child.on('error', (err) => {
    const message = { type: 'error', content: `Failed to start agent ${agent}: ${err.message}` };
    redis.publish(channel, JSON.stringify(message));
  });
};

export default delegateTaskTool;
