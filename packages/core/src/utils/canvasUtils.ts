import { getRedisClientInstance } from '../modules/redis/redisClient.ts';

/**
 * Ferme le canvas
 * @param jobId L'ID du job en cours
 */
export function closeCanvas(jobId: string) {
  const channel = `job:${jobId}:events`;
  const message = JSON.stringify({
    type: 'agent_canvas_close',
  });

  // Publier le message sur le canal Redis
  getRedisClientInstance().publish(channel, message);

  console.log(`[CANVAS] Canvas closed for job ${jobId}`);
}

/**
 * Envoie du contenu au canvas via Redis
 * @param jobId L'ID du job en cours
 * @param content Le contenu à afficher
 * @param contentType Le type de contenu (par défaut 'html')
 */
export function sendToCanvas(
  jobId: string,
  content: string,
  contentType: 'html' | 'json' | 'markdown' | 'text' | 'url' = 'html',
) {
  // Vérifier si le contenu est une todo list générée par l'agent interne
  try {
    const parsedContent = JSON.parse(content);
    // Si c'est une todo list interne de l'agent, ne pas l'envoyer au canvas
    if (parsedContent.isAgentInternal === true) {
      console.log(`[CANVAS] Skipping agent-internal content for job ${jobId}`);
      return;
    }
  } catch (_e) {
    // Si le contenu n'est pas un JSON valide, continuer normalement
  }

  const channel = `job:${jobId}:events`;
  const message = JSON.stringify({
    content,
    contentType,
    type: 'agent_canvas_output',
  });

  console.log(
    `[CANVAS] Attempting to send to canvas for job ${jobId}, type: ${contentType}, content length: ${content.length}`,
  );
  console.log(`[CANVAS] Channel: ${channel}`);
  console.log(`[CANVAS] Message:`, message);

  // Publier le message sur le canal Redis
  const result = getRedisClientInstance().publish(channel, message);

  console.log(`[CANVAS] Redis publish result:`, result);
  console.log(`[CANVAS] Content sent to canvas for job ${jobId}`);
}
