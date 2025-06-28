// FICHIER CORRIGÉ : src/worker.ts
import { Job } from 'bullmq';
import { redis } from './redisClient'; // Assurez-vous que ce fichier existe maintenant
import logger from './logger';
import { callLLM } from './utils/llmProvider';
import { loadTools } from './utils/toolLoader';
import { sendWebhook } from './utils/webhookUtils';
import { MCP_WEBHOOK_URL, MCP_API_KEY } from './config';
import { Message, Tool } from './types';

const availableTools = loadTools();

export async function processJob(job: Job): Promise<any> {
  const { prompt, sessionId, toolName } = job.data; // toolName est essentiel ici
  const log = logger.child({ jobId: job.id, sessionId, toolName });
  const historyKey = `session:${sessionId}:history`;

  try {
    const storedHistory = await redis.get(historyKey);
    const history: Message[] = storedHistory ? JSON.parse(storedHistory) : [];
    history.push({ role: 'user', content: prompt });
    
    const modelResponse = await callLLM(history, availableTools as Tool[]);
    history.push(modelResponse);
    await redis.set(historyKey, JSON.stringify(history), 'EX', 7 * 24 * 60 * 60);

    if (MCP_WEBHOOK_URL) {
      // CORRIGÉ : Ajout de 'toolName'
      await sendWebhook(MCP_WEBHOOK_URL, {
        jobId: job.id, sessionId, status: 'completed', output: modelResponse,
      }, toolName);
    }
    return modelResponse;
  } catch (error) {
    log.error({ error }, 'Erreur dans le worker');
    if (MCP_WEBHOOK_URL) {
      // CORRIGÉ : Ajout de 'toolName'
      await sendWebhook(MCP_WEBHOOK_URL, {
        jobId: job.id, sessionId, status: 'failed', error: (error as Error).message,
      }, toolName);
    }
    throw error;
  }
}