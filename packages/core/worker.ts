import { Job, Worker } from 'bullmq';
import { FastMCP, FastMCPSession } from 'fastmcp';

import { config } from './config.js';
import logger from './logger.js';
import { jobQueue } from './queue.js';
import { redis } from './redisClient.js';
import { Message, SessionData } from './types.js';
import { getAllTools } from './tools/index.js';
import { sendWebhook } from './utils/webhookUtils.js';
import { summarizeTool } from './tools/ai/summarize.tool.js';
import { getOrchestratorPrompt } from './prompts/orchestrator.prompt.js';

const availableTools = await getAllTools();

// Initialize FastMCP server in the worker
const mcpWorkerServer = new FastMCP<SessionData>({
  name: 'agentic-forge-server',
  version: '1.0.0',
});

// Register tools with FastMCP server
for (const tool of availableTools) {
  mcpWorkerServer.addTool(tool);
}

// Map to store active SessionData by sessionId
const activeSessions = new Map<string, SessionData>();

interface AgentContext {
  objective: string;
  history: Message[];
  iterations: number;
  scratchpad: string[];
}

async function summarizeHistory(sessionData: SessionData, log: typeof logger) {
  if (sessionData.history.length > config.HISTORY_MAX_LENGTH) {
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = sessionData.history.slice(0, -10);
    const textToSummarize = historyToSummarize.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    try {
      const summary = await summarizeTool.execute({ text: textToSummarize }, { log } as any);
      const summarizedMessage: Message = {
        content: `Summarized conversation: ${summary}`,
        role: 'model',
      };
      sessionData.history = [summarizedMessage, ...sessionData.history.slice(-10)];
      log.info('History summarized successfully.');
    } catch (error) {
      log.error({ error }, 'Error summarizing history');
    }
  }
}


export async function processJob(job: Job): Promise<any> {
  const { prompt, sessionId } = job.data;
  const log = logger.child({ jobId: job.id, sessionId });
  const historyKey = `session:${sessionId}:history`;
  const channel = `job:${job.id}:events`;

  let sessionData: SessionData;
  if (activeSessions.has(sessionId)) {
    sessionData = activeSessions.get(sessionId)!;
    log.info('Reusing existing session data.');
  } else {
    const storedHistory = await redis.get(historyKey);
    const initialHistory: Message[] = storedHistory ? JSON.parse(storedHistory) : [];

    sessionData = {
      history: initialHistory,
      id: sessionId,
      identities: [{ id: 'user', type: 'email' }],
    };
    activeSessions.set(sessionId, sessionData);
    log.info('Created new session data.');
  }

  try {
    // Add user prompt to session history
    sessionData.history.push({ content: prompt, role: 'user' });

    const agentContext: AgentContext = {
      objective: prompt,
      history: sessionData.history,
      iterations: 0,
      scratchpad: [],
    };

    const session = new FastMCPSession<SessionData>({
      auth: sessionData,
      name: 'agentic-forge-session',
      prompts: [],
      resources: [],
      resourcesTemplates: [],
      tools: availableTools as any,
      version: '1.0.0',
    });

    let finalResponse = '';
    const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS || 10; // Define max iterations

    while (agentContext.iterations < MAX_ITERATIONS) {
      agentContext.iterations++;
      log.info(`Agent iteration: ${agentContext.iterations}`);

      const orchestratorPrompt = getOrchestratorPrompt(agentContext, availableTools);

      const result = await session.requestSampling({
        messages: [
          ...agentContext.history.map((msg: Message) => ({
            content: { type: 'text', text: msg.content },
            role: msg.role === 'user' ? 'user' : 'assistant',
          })),
          {
            content: { type: 'text', text: orchestratorPrompt },
            role: 'user',
          },
        ],
        maxTokens: 2000,
      });

      const modelResponseContent: string = (() => {
        if (result.content && 'text' in result.content && typeof result.content.text === 'string') {
          return result.content.text;
        }
        return JSON.stringify(result.content ?? {});
      })();

      log.info({ modelResponseContent }, 'Model response');
      agentContext.scratchpad.push(`Model response: ${modelResponseContent}`);
      await redis.publish(channel, JSON.stringify({ type: 'agent_response', content: modelResponseContent }));

      try {
        const parsedResponse = JSON.parse(modelResponseContent);
        const { thought, command } = parsedResponse;

        agentContext.scratchpad.push(`Thought: ${thought}`);
        log.info({ thought }, 'Agent thought');
        await redis.publish(channel, JSON.stringify({ type: 'agent_thought', content: thought }));

        if (command) {
          log.info({ command }, 'Agent command');
          const toolName = command.name;
          const toolParams = command.params;

          const toolToExecute = availableTools.find(tool => tool.name === toolName);

          if (toolToExecute) {
            log.info(`Executing tool: ${toolName} with params: ${JSON.stringify(toolParams)}`);
            const toolResult = await toolToExecute.execute(toolParams, { log } as any);
            agentContext.scratchpad.push(`Tool result: ${JSON.stringify(toolResult)}`);
            agentContext.history.push({ content: `Tool result: ${JSON.stringify(toolResult)}`, role: 'model' });
          } else {
            const errorMessage = `Tool not found: ${toolName}`;
            log.error(errorMessage);
            agentContext.scratchpad.push(errorMessage);
            agentContext.history.push({ content: errorMessage, role: 'model' });
          }
        } else {
          // If no command, assume it's the final answer
          finalResponse = thought;
          break;
        }
      } catch (parseError) {
        log.error({ parseError, modelResponseContent }, 'Error parsing model response as JSON, assuming final answer or error.');
        finalResponse = modelResponseContent;
        break;
      }
    }

    const modelMessage: Message = { content: finalResponse, role: 'model' };
    sessionData.history.push(modelMessage);

    // Save updated history to Redis
    await redis.set(historyKey, JSON.stringify(sessionData.history), 'EX', 7 * 24 * 60 * 60);

    await summarizeHistory(sessionData, log);

    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(webhookUrl, {
        inParams: { prompt, sessionId },
        msg: 'Job completed successfully.',
        result: finalResponse ?? '',
        status: 'completed',
        taskId: job.id,
        ts: new Date().toISOString(),
      }, job.id, 'process-message', false);
    }
    return finalResponse;
  } catch (error) {
    log.error({ error }, 'Erreur dans le worker');
    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(webhookUrl, {
        inParams: { prompt, sessionId },
        error: { message: (error as Error).message ?? 'Unknown error', name: (error as Error).name ?? 'UnknownError' },
        msg: 'Job failed.',
        status: 'error',
        taskId: job.id,
        ts: new Date().toISOString(),
      }, job.id, 'process-message', false);
    }
    throw error;
  } finally {
    // Optionally close session if it's short-lived, or manage lifecycle elsewhere
    // For now, keep it active for subsequent messages in the same session
  }
}

export async function startWorker() {
  const worker = new Worker('tasks', async (job) => {
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    return processJob(job);
  }, {
    concurrency: config.WORKER_CONCURRENCY,
    connection: redis,
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

  logger.info('Worker démarré et écoute les tâches...');
}