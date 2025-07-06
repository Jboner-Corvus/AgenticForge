console.log('Starting worker...');
import { Job, Worker } from 'bullmq';

import { config } from '../config.js';
import logger from '../logger.js';
console.log('Logger imported');
import { redis } from '../redisClient.js';
import { summarizeTool } from '../tools/ai/summarize.tool.js';
import { getAllTools } from '../tools/index.js';
import { Message, SessionData } from '../types.js';
import { getLlmResponse } from '../utils/llmProvider.js';
import { sendWebhook } from '../utils/webhookUtils.js';
import { getOrchestratorPrompt } from './prompts/orchestrator.prompt.js';

console.log('Imports complete');

const availableTools = await getAllTools();
console.log('Tools loaded');

// Map to store active SessionData by sessionId
const activeSessions = new Map<string, SessionData>();

interface AgentContext {
  history: Message[];
  iterations: number;
  objective: string;
  scratchpad: string[];
}

export async function processJob(job: Job): Promise<string> {
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
    const initialHistory: Message[] = storedHistory
      ? JSON.parse(storedHistory)
      : [];

    sessionData = {
      history: initialHistory,
      id: sessionId,
      identities: [{ id: 'user', type: 'email' }],
    };
    activeSessions.set(sessionId, sessionData);
    log.info('Created new session data.');
  }

  const subscriber = redis.duplicate();
  const interruptChannel = `job:${job.id}:interrupt`;
  let interrupted = false;

  subscriber.subscribe(interruptChannel, (err) => {
    if (err) {
      log.error({ err }, 'Failed to subscribe to interrupt channel');
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === interruptChannel && message === 'interrupt') {
      interrupted = true;
      log.info('Interrupt signal received');
    }
  });

  try {
    // Add user prompt to session history
    sessionData.history.push({ content: prompt, role: 'user' });

    const agentContext: AgentContext = {
      history: sessionData.history,
      iterations: 0,
      objective: prompt,
      scratchpad: [],
    };

    let finalResponse = '';
    const MAX_ITERATIONS = config.AGENT_MAX_ITERATIONS || 10; // Define max iterations

    while (agentContext.iterations < MAX_ITERATIONS && !interrupted) {
      agentContext.iterations++;
      log.info(`Agent iteration: ${agentContext.iterations}`);

      const orchestratorPrompt = getOrchestratorPrompt(
        agentContext,
        availableTools,
      );

      const result = await getLlmResponse([
        ...agentContext.history.map((msg: Message) => ({
          parts: [{ text: msg.content }],
          role: msg.role === 'user' ? 'user' : 'model',
        })),
        {
          parts: [{ text: orchestratorPrompt }],
          role: 'user',
        },
      ]);

      const modelResponseContent = result;

      log.info({ modelResponseContent }, 'Model response');
      agentContext.scratchpad.push(`Model response: ${modelResponseContent}`);
      await redis.publish(
        channel,
        JSON.stringify({
          content: modelResponseContent,
          type: 'agent_response',
        }),
      );

      try {
        const parsedResponse = JSON.parse(modelResponseContent);
        const { command, thought } = parsedResponse;

        agentContext.scratchpad.push(`Thought: ${thought}`);
        log.info({ thought }, 'Agent thought');
        await redis.publish(
          channel,
          JSON.stringify({ content: thought, type: 'agent_thought' }),
        );

        if (command) {
          log.info({ command }, 'Agent command');
          const toolName = command.name;
          const toolParams = command.params;

          const toolToExecute = availableTools.find(
            (tool) => tool.name === toolName,
          );

          if (toolToExecute) {
            log.info(
              `Executing tool: ${toolName} with params: ${JSON.stringify(toolParams)}`,
            );
            const toolResult = await toolToExecute.execute(toolParams, {
              job,
              log,
            });
            agentContext.scratchpad.push(
              `Tool result: ${JSON.stringify(toolResult)}`,
            );
            agentContext.history.push({
              content: `Tool result: ${JSON.stringify(toolResult)}`,
              role: 'model',
            });
            await redis.publish(
              channel,
              JSON.stringify({
                result: toolResult,
                toolName,
                type: 'tool_result',
              }),
            );
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
        log.error(
          { modelResponseContent, parseError },
          'Error parsing model response as JSON, assuming final answer or error.',
        );
        finalResponse = modelResponseContent;
        break;
      }
    }

    if (interrupted) {
      finalResponse = 'Agent execution interrupted.';
      await redis.publish(channel, JSON.stringify({ type: 'job_failed' }));
    } else {
      await redis.publish(channel, JSON.stringify({ type: 'job_completed' }));
    }

    const modelMessage: Message = { content: finalResponse, role: 'model' };
    sessionData.history.push(modelMessage);

    // Save updated history to Redis
    await redis.set(
      historyKey,
      JSON.stringify(sessionData.history),
      'EX',
      7 * 24 * 60 * 60,
    );

    await summarizeHistory(sessionData, log);

    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(
        webhookUrl,
        {
          inParams: { prompt, sessionId },
          msg: 'Job completed successfully.',
          result: finalResponse ?? '',
          status: 'completed',
          taskId: job.id,
          ts: new Date().toISOString(),
        },
        job.id,
        'process-message',
        false,
      );
    }
    return finalResponse;
  } catch (error) {
    log.error({ error }, 'Erreur dans le worker');
    if (config.MCP_WEBHOOK_URL && config.MCP_API_KEY) {
      const webhookUrl: string = config.MCP_WEBHOOK_URL;
      await sendWebhook(
        webhookUrl,
        {
          error: {
            message: (error as Error).message ?? 'Unknown error',
            name: (error as Error).name ?? 'UnknownError',
          },
          inParams: { prompt, sessionId },
          msg: 'Job failed.',
          status: 'error',
          taskId: job.id,
          ts: new Date().toISOString(),
        },
        job.id,
        'process-message',
        false,
      );
    }
    throw error;
  } finally {
    subscriber.unsubscribe(interruptChannel);
    subscriber.quit();
    // Optionally close session if it's short-lived, or manage lifecycle elsewhere
    // For now, keep it active for subsequent messages in the same session
  }
}

export async function startWorker() {
  console.log('startWorker function called');
  const worker = new Worker(
    'tasks',
    async (job) => {
      logger.info(`Processing job ${job.id} of type ${job.name}`);
      return processJob(job);
    },
    {
      concurrency: config.WORKER_CONCURRENCY,
      connection: redis,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed.`);
  });

  logger.info('Worker démarré et écoute les tâches...');
  console.log('Worker started and listening for tasks...');
}

async function summarizeHistory(sessionData: SessionData, log: typeof logger) {
  if (sessionData.history.length > config.HISTORY_MAX_LENGTH) {
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = sessionData.history.slice(0, -10);
    const textToSummarize = historyToSummarize
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const summary = await summarizeTool.execute(
        { text: textToSummarize },
        {
          log,
        },
      );
      const summarizedMessage: Message = {
        content: `Summarized conversation: ${summary}`,
        role: 'model',
      };
      sessionData.history = [
        summarizedMessage,
        ...sessionData.history.slice(-10),
      ];
      log.info('History summarized successfully.');
    } catch (error) {
      log.error({ error }, 'Error summarizing history');
    }
  }
}

startWorker().catch((err) => {
  console.error('Failed to start worker:', err);
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
