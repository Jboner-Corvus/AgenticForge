import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "../../../../chunk-SIBAPVHV.js";
import "../../../../chunk-E5QXXMSG.js";
import "../../../../chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/delegateTask.tool.ts
init_esm_shims();
import { z } from "zod";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
var delegateTaskParams = z.object({
  taskDescription: z.string().describe("The task to delegate to a specialized agent."),
  agent: z.enum(["gemini-cli", "qwen-cli"]).describe("The specialized agent to use.")
});
var getApiCredits = async (agent) => {
  const redis = getRedisClientInstance();
  const creditsKey = `api-credits:${agent}`;
  let credits = await redis.get(creditsKey);
  if (credits === null) {
    await redis.set(creditsKey, 100);
    credits = "100";
  }
  return parseInt(credits, 10);
};
var delegateTaskTool = {
  name: "delegateTask",
  description: "Delegates a task to a specialized agent and returns a job ID to stream the output.",
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
    spawnChildProcess(taskDescription, agent, channel);
    return `Task delegated. You can stream the output using the job ID: ${jobId}`;
  }
};
var spawnChildProcess = (taskDescription, agent, channel) => {
  const redis = getRedisClientInstance();
  const child = spawn(agent, [taskDescription], {
    shell: true,
    stdio: ["pipe", "pipe", "pipe"]
  });
  child.stdout.on("data", (data) => {
    const message = { type: "stdout", content: data.toString() };
    redis.publish(channel, JSON.stringify(message));
  });
  child.stderr.on("data", (data) => {
    const message = { type: "stderr", content: data.toString() };
    redis.publish(channel, JSON.stringify(message));
  });
  child.on("close", (code) => {
    const message = { type: "status", content: `Agent ${agent} exited with code ${code}.` };
    redis.publish(channel, JSON.stringify(message));
  });
  child.on("error", (err) => {
    const message = { type: "error", content: `Failed to start agent ${agent}: ${err.message}` };
    redis.publish(channel, JSON.stringify(message));
  });
};
var delegateTask_tool_default = delegateTaskTool;
export {
  delegateTask_tool_default as default
};
