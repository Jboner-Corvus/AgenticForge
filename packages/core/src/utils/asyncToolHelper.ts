import type { SessionData } from '../types.js';

// src/utils/asyncToolHelper.ts (Corrigé pour SessionData)
import { getLogger } from '../logger.js';
import {
  type AsyncTaskJobPayload,
  getJobQueue,
} from '../modules/queue/queue.js';
import {
  EnqueueTaskError,
  type ErrorDetails,
  getErrDetails,
} from './errorUtils.js';

export interface EnqueueParams<TParams> {
  auth: SessionData | undefined;
  cbUrl?: string;
  params: TParams;
  taskId: string;
  toolName: string;
}

export interface TaskOutcome<TParams, TResult> {
  error?: ErrorDetails;
  inParams: TParams;
  msg: string;
  progress?: { current: number; total: number; unit?: string };
  result?: TResult;
  status: 'completed' | 'error' | 'processing';
  taskId: string;
  ts: string;
}

export async function enqueueTask<TParams extends Record<string, unknown>>(
  args: EnqueueParams<TParams>,
): Promise<string | undefined> {
  const { auth, cbUrl, params, taskId, toolName } = args;
  const log = getLogger().child({
    cbUrl: !!cbUrl,
    clientIp: auth?.clientIp,
    proc: 'task-producer',
    taskId,
    tool: toolName,
  });
  const jobData: AsyncTaskJobPayload<TParams> = {
    auth,
    cbUrl,
    params,
    taskId,
    toolName,
  };
  try {
    const job = await getJobQueue().add(toolName, jobData, { jobId: taskId });
    log.info({ jobId: job.id }, "Tâche ajoutée à la file d'attente.");
    return job.id;
  } catch (error: unknown) {
    const errDetails = getErrDetails(error);
    log.error("Échec de l'ajout de la tâche à la file d'attente.", {
      err: errDetails,
    });
    throw new EnqueueTaskError(
      `L'ajout de la tâche ${taskId} pour ${toolName} à la file d'attente a échoué : ${errDetails.message}`,
      { originalError: errDetails, taskId, toolName },
    );
  }
}
