import type { TaskOutcome } from './asyncToolHelper.js';
/**
 * Envoie un webhook à l'URL spécifiée avec le payload.
 */
export declare function sendWebhook<P, R>(
  url: string,
  payload: TaskOutcome<P, R>,
  taskId: string,
  toolName: string,
  throwErr?: boolean,
): Promise<boolean>;
/**
 * Utilitaire pour vérifier la signature HMAC.
 */
export declare function verifyWebhookSignature(
  payload: string,
  receivedSignature: string,
  secret: string,
): boolean;
//# sourceMappingURL=webhookUtils.d.ts.map
