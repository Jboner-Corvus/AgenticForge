// NOTE: CE FICHIER DOIT ÊTRE DANS src/utils/ ET NON src/tools/utils
import logger from '../logger.js';
import { taskQueue } from '../queue.js';
import { EnqueueTaskError, getErrDetails, type ErrorDetails } from './errorUtils.js';
import type { AuthData, AsyncTaskJobPayload } from '../types.js';

export interface EnqueueParams<TParams> {
  params: TParams;
  auth: AuthData | undefined;
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

export async function enqueueTask<TParams>(
  args: EnqueueParams<TParams>
): Promise<string | undefined> {
  const { params, auth, taskId, toolName, cbUrl } = args;
  const log = logger.child({
    clientIp: auth?.clientIp,
    tool: toolName,
    taskId,
    proc: 'task-producer',
    cbUrl: !!cbUrl,
  });
  const jobData: AsyncTaskJobPayload<TParams> = { params, auth, taskId, toolName, cbUrl };
  try {
    const job = await taskQueue.add(toolName, jobData, { jobId: taskId });
    log.info(`Tâche ajoutée à la file d'attente. Job ID: ${job.id}`);
    return job.id;
  } catch (error: unknown) {
    const errDetails = getErrDetails(error as Error);
    log.error(
      { err: errDetails, toolName, taskId },
      "Échec de l'ajout de la tâche à la file d'attente."
    );
    throw new EnqueueTaskError(
      `L'ajout de la tâche ${taskId} pour ${toolName} à la file d'attente a échoué : ${errDetails.message}`,
      { originalError: errDetails, toolName, taskId }
    );
  }
}