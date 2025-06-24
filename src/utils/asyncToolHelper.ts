// src/utils/asyncToolHelper.ts (Corrigé pour SessionData)
import logger from '../logger.js';
import { taskQueue, type AsyncTaskJobPayload } from '../queue.js';
import {
  EnqueueTaskError,
  getErrDetails,
  type ErrorDetails,
} from './errorUtils.js';
import type { SessionData } from '../types.js';

export interface EnqueueParams<TParams> {
  params: TParams;
  auth: SessionData | undefined;
  taskId: string;
  toolName: string;
  cbUrl?: string;
}

export interface TaskOutcome<TParams, TResult> {
  taskId: string;
  status: 'completed' | 'error' | 'processing';
  msg: string;
  result?: TResult;
  error?: ErrorDetails;
  inParams: TParams;
  ts: string;
  progress?: { current: number; total: number; unit?: string };
}

export async function enqueueTask<TParams extends Record<string, unknown>>(
  args: EnqueueParams<TParams>,
): Promise<string | undefined> {
  const { params, auth, taskId, toolName, cbUrl } = args;
  const log = logger.child({
    clientIp: auth?.clientIp,
    tool: toolName,
    taskId,
    proc: 'task-producer',
    cbUrl: !!cbUrl,
  });
  const jobData: AsyncTaskJobPayload<TParams> = {
    params,
    auth,
    taskId,
    toolName,
    cbUrl,
  };
  try {
    const job = await taskQueue.add(toolName, jobData, { jobId: taskId });
    log.info({ jobId: job.id }, "Tâche ajoutée à la file d'attente.");
    return job.id;
  } catch (error: unknown) {
    const errDetails = getErrDetails(error);
    log.error("Échec de l'ajout de la tâche à la file d'attente.", {
      err: errDetails,
    });
    throw new EnqueueTaskError(
      `L'ajout de la tâche ${taskId} pour ${toolName} à la file d'attente a échoué : ${errDetails.message}`,
      { originalError: errDetails, toolName, taskId },
    );
  }
}