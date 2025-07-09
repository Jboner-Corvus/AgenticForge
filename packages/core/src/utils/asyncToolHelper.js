// src/utils/asyncToolHelper.ts (Corrigé pour SessionData)
import logger from '../logger.js';
import { jobQueue as taskQueue } from '../queue.js';
import { EnqueueTaskError, getErrDetails } from './errorUtils.js';
export async function enqueueTask(args) {
  const { auth, cbUrl, params, taskId, toolName } = args;
  const log = logger.child({
    cbUrl: !!cbUrl,
    clientIp: auth?.clientIp,
    proc: 'task-producer',
    taskId,
    tool: toolName,
  });
  const jobData = {
    auth,
    cbUrl,
    params,
    taskId,
    toolName,
  };
  try {
    const job = await taskQueue.add(toolName, jobData, { jobId: taskId });
    log.info({ jobId: job.id }, "Tâche ajoutée à la file d'attente.");
    return job.id;
  } catch (error) {
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
//# sourceMappingURL=asyncToolHelper.js.map
